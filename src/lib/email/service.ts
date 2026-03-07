import nodemailer from 'nodemailer'
import imap from 'imap-simple'
import { simpleParser } from 'mailparser'
import { AiMemoryService } from '@/shared/services/ai-memory.service'
import { createClient } from '@/lib/supabase/server'

const EMAIL_CONFIG = {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    authTimeout: 3000,
}

const SMTP_CONFIG = {
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
}

export type EmailMessage = {
    messageId: string
    subject: string
    from: string
    to: string
    date: Date
    text: string
    html: string
    snippet: string
    direction: 'inbound' | 'outbound'
}

export class EmailService {
    // === ENVIAR EMAIL ===
    static async sendEmail(to: string, subject: string, html: string, text?: string) {
        const transporter = nodemailer.createTransport(SMTP_CONFIG)

        const info = await transporter.sendMail({
            from: `"${process.env.NEXT_PUBLIC_APP_NAME || 'CRM'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback text
            html,
        })

        return info
    }

    // === SINCRONIZAR EMAILS ===
    static async fetchEmailsForContact(contactEmail: string): Promise<EmailMessage[]> {
        if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.password) {
            throw new Error('Credenciales de email no configuradas')
        }

        const connection = await imap.connect({
            imap: EMAIL_CONFIG as any,
        })

        try {
            const foldersToScan = ['INBOX', 'INBOX.Sent', 'Sent', 'Sent Messages']
            const allParsedEmails: EmailMessage[] = []

            for (const folder of foldersToScan) {
                try {
                    await connection.openBox(folder)

                    const searchCriteria = [
                        ['OR', ['FROM', contactEmail], ['TO', contactEmail]]
                    ]

                    const fetchOptions = {
                        bodies: ['HEADER', 'TEXT', ''],
                        markSeen: false,
                        struct: true
                    }

                    const messages = await connection.search(searchCriteria, fetchOptions)

                    // We take the last 20 from each folder to have a good conversation history
                    const recentMessages = messages.slice(-20)

                    for (const item of recentMessages) {
                        const all = item.parts.find((part: any) => part.which === '')
                        const id = item.attributes.uid

                        if (all && all.body) {
                            const parsed = await simpleParser(all.body)

                            const fromAddr = parsed.from?.value[0]?.address || ''
                            // Si el correo viene del contacto, es inbound. 
                            // Si viene de nosotros (y asumimos que el config.user es nuestro mail), es outbound.
                            const direction = fromAddr.toLowerCase().includes(contactEmail.toLowerCase()) ? 'inbound' : 'outbound'

                            let toAddr = ''
                            if (Array.isArray(parsed.to)) {
                                toAddr = parsed.to[0]?.text || ''
                            } else if (parsed.to && 'text' in (parsed.to as any)) {
                                toAddr = (parsed.to as any).text || ''
                            }

                            allParsedEmails.push({
                                messageId: parsed.messageId || `imap-${folder}-${id}`,
                                subject: parsed.subject || '(Sin asunto)',
                                from: fromAddr,
                                to: toAddr,
                                date: parsed.date || new Date(),
                                text: parsed.text || '',
                                html: parsed.html || '',
                                snippet: (parsed.text || '').substring(0, 150),
                                direction
                            })
                        }
                    }
                } catch (folderError: any) {
                    // Si una carpeta no existe (ej: Sent vs INBOX.Sent), simplemente la saltamos
                    console.warn(`Folder ${folder} not found or inaccessible:`, folderError.message)
                }
            }

            // Deduplicar por messageId y ordenar
            const uniqueEmails = Array.from(
                new Map(allParsedEmails.map(item => [item.messageId, item])).values()
            )

            return uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime())

        } finally {
            connection.end()
        }
    }

    // === GLOBAL SYNC (CRON / MANUAL) ===
    static async fetchGlobalRecent(limit: number = 30): Promise<EmailMessage[]> {
        if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.password) {
            console.warn('Credenciales de email no configuradas. Saltando sync.')
            return []
        }

        const connection = await imap.connect({
            imap: EMAIL_CONFIG as any,
        })

        try {
            // Scan fewer folders to save time and CPU
            const foldersToScan = ['INBOX', 'Sent Messages', 'Sent']
            const allParsedEmails: EmailMessage[] = []

            // Use SINCE to limit the initial search set (last 2 days)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            // Format for IMAP (Month Day, Year)
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const sinceDate = `${monthNames[twoDaysAgo.getMonth()]} ${twoDaysAgo.getDate()}, ${twoDaysAgo.getFullYear()}`;

            for (const folder of foldersToScan) {
                try {
                    await connection.openBox(folder)

                    // Fetch messages from recent days only
                    const searchCriteria = [['SINCE', sinceDate]];
                    const fetchOptions = {
                        bodies: ['HEADER', 'TEXT', ''],
                        markSeen: false,
                        struct: true
                    }

                    const messages = await connection.search(searchCriteria, fetchOptions)
                    // If we have many messages, still limit to the most recent ones
                    const recentMessages = messages.sort((a, b) => b.attributes.uid - a.attributes.uid).slice(0, limit)

                    // Parallelize parsing of these emails for speed
                    const parsedResults = await Promise.all(recentMessages.map(async (item) => {
                        const all = item.parts.find((part: any) => part.which === '')
                        const id = item.attributes.uid

                        if (all && all.body) {
                            try {
                                const parsed = await simpleParser(all.body)
                                const fromAddr = parsed.from?.value[0]?.address || ''
                                const direction = fromAddr.toLowerCase().includes(EMAIL_CONFIG.user.toLowerCase()) ? 'outbound' : 'inbound'

                                let toAddr = ''
                                if (Array.isArray(parsed.to)) {
                                    toAddr = parsed.to[0]?.text || ''
                                } else if (parsed.to && 'text' in (parsed.to as any)) {
                                    toAddr = (parsed.to as any).text || ''
                                }

                                return {
                                    messageId: parsed.messageId || `imap-${folder}-${id}`,
                                    subject: parsed.subject || '(Sin asunto)',
                                    from: fromAddr,
                                    to: toAddr,
                                    date: parsed.date || new Date(),
                                    text: parsed.text || '',
                                    html: parsed.html || '',
                                    snippet: (parsed.text || '').substring(0, 150),
                                    direction
                                } as EmailMessage;
                            } catch (e) {
                                console.error(`Error parsing message ${id}:`, e);
                                return null;
                            }
                        }
                        return null;
                    }));

                    for (const res of parsedResults) {
                        if (res) allParsedEmails.push(res);
                    }

                } catch (folderError: any) {
                    console.warn(`Folder ${folder} not found or inaccessible during global sync:`, folderError.message)
                }
            }

            // Deduplicate by messageId
            const uniqueEmails = Array.from(
                new Map(allParsedEmails.map(item => [item.messageId, item])).values()
            )

            // Sort by date desc
            const sorted = uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime())

            // NOTE: Embedding generation removed from here to separate business logic from I/O sync.
            // This avoids hitting API limits and CPU limits synchronously.
            // The caller (cron) will handle embeddings for TRULY new emails.

            return sorted

        } catch (error) {
            console.error('Error in fetchGlobalRecent:', error)
            return []
        } finally {
            connection.end()
        }
    }
}
