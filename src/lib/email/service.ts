import nodemailer from 'nodemailer'
import imap from 'imap-simple'
import { simpleParser } from 'mailparser'

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
            await connection.openBox('INBOX')

            const searchCriteria = [
                ['OR', ['FROM', contactEmail], ['TO', contactEmail]]
            ]

            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: false,
                struct: true
            }

            const messages = await connection.search(searchCriteria, fetchOptions)
            const recentMessages = messages.slice(-20)

            const parsedEmails: EmailMessage[] = []

            for (const item of recentMessages) {
                const all = item.parts.find((part: any) => part.which === '')
                const id = item.attributes.uid

                if (all && all.body) {
                    const parsed = await simpleParser(all.body)

                    const fromAddr = parsed.from?.value[0]?.address || ''
                    const direction = fromAddr.includes(contactEmail) ? 'inbound' : 'outbound'

                    let toAddr = ''
                    if (Array.isArray(parsed.to)) {
                        toAddr = parsed.to[0]?.text || ''
                    } else if (parsed.to && 'text' in parsed.to) {
                        toAddr = parsed.to.text || ''
                    }

                    parsedEmails.push({
                        messageId: parsed.messageId || `${id}`,
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

            return parsedEmails.sort((a, b) => b.date.getTime() - a.date.getTime())

        } finally {
            connection.end()
        }
    }

    // === GLOBAL SYNC (CRON) ===
    static async fetchGlobalUnread(limit: number = 20): Promise<EmailMessage[]> {
        if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.password) {
            console.warn('Credenciales de email no configuradas. Saltando sync.')
            return []
        }

        const connection = await imap.connect({
            imap: EMAIL_CONFIG as any,
        })

        try {
            await connection.openBox('INBOX')

            // Fetch recent messages (not necessarily unseen, we'll handle duplicates in DB)
            const searchCriteria = ['ALL']
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: false,
                struct: true
            }

            const messages = await connection.search(searchCriteria, fetchOptions)
            const recentMessages = messages.slice(-limit)

            const parsedEmails: EmailMessage[] = []

            for (const item of recentMessages) {
                const all = item.parts.find((part: any) => part.which === '')
                const id = item.attributes.uid

                if (all && all.body) {
                    const parsed = await simpleParser(all.body)

                    const fromAddr = parsed.from?.value[0]?.address || ''

                    let toAddr = ''
                    if (Array.isArray(parsed.to)) {
                        toAddr = parsed.to[0]?.text || ''
                    } else if (parsed.to && 'text' in parsed.to) {
                        toAddr = (parsed.to as any).text || ''
                    }

                    parsedEmails.push({
                        messageId: parsed.messageId || `imap-${id}-${parsed.date?.getTime()}`,
                        subject: parsed.subject || '(Sin asunto)',
                        from: fromAddr,
                        to: toAddr,
                        date: parsed.date || new Date(),
                        text: parsed.text || '',
                        html: parsed.html || '',
                        snippet: (parsed.text || '').substring(0, 150),
                        direction: 'inbound' // In global sync, we assume everything in INBOX is inbound
                    })
                }
            }

            return parsedEmails.sort((a, b) => b.date.getTime() - a.date.getTime())

        } catch (error) {
            console.error('Error in fetchGlobalUnread:', error)
            return []
        } finally {
            connection.end()
        }
    }
}
