export class WhatsAppService {
    private static API_URL = process.env.EVOLUTION_API_URL || 'http://13.53.96.3:8080'
    private static API_KEY = process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY || '4D809A972D78-4CB6-8203-DCD2560B83BA'
    private static INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'n8nbot'
    private static TARGET_PHONE = process.env.WHATSAPP_TARGET_PHONE || '34693482385'

    static async sendMessageToNumberDetailed(number: string, text: string) {
        try {
            const instancePath = encodeURIComponent(this.INSTANCE)
            const response = await fetch(`${this.API_URL}/message/sendText/${instancePath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.API_KEY
                },
                body: JSON.stringify({
                    number,
                    text
                })
            })

            if (!response.ok) {
                const error = await response.text()
                console.error('WhatsAppService Error:', error)
                return {
                    success: false,
                    status: response.status,
                    error
                }
            }

            return {
                success: true,
                status: response.status
            }
        } catch (error) {
            console.error('WhatsAppService Exception:', error)
            return {
                success: false,
                error: String(error)
            }
        }
    }

    static async sendMessageDetailed(text: string) {
        return this.sendMessageToNumberDetailed(this.TARGET_PHONE, text)
    }

    static async sendMessage(text: string) {
        const result = await this.sendMessageDetailed(text)
        return result.success
    }

    static async notifyNewEmail(from: string, subject: string, contactId?: string | null) {
        const contactHint = contactId ? '👤 Cliente registrado' : '❓ Remitente desconocido'
        const message = `📧 *Nuevo Email en CRM Aurie*\n\n*De:* ${from}\n*Asunto:* ${subject}\n*Tipo:* ${contactHint}\n\n👉 Ver en el CRM: https://agencia-crm-saas.vercel.app/contacts`

        return this.sendMessage(message)
    }
    static async notifyNewEmailDetailed(from: string, subject: string, contactId?: string | null) {
        const contactHint = contactId ? '👤 Cliente registrado' : '❓ Remitente desconocido'
        const message = `📧 *Nuevo Email en CRM Aurie*\n\n*De:* ${from}\n*Asunto:* ${subject}\n*Tipo:* ${contactHint}\n\n👉 Ver en el CRM: https://agencia-crm-saas.vercel.app/contacts`

        return this.sendMessageDetailed(message)
    }

    static async notifyNewTeamMessage(senderName: string, content: string, chatId: string) {
        const message = `💬 *Mensaje de Equipo en CRM Aurie*\n\n*De:* ${senderName}\n*Mensaje:* ${content}\n\n👉 Responder: https://agencia-crm-saas.vercel.app/team-chat/${chatId}`

        return this.sendMessage(message)
    }
    static async notifyNewTeamMessageDetailed(senderName: string, content: string, chatId: string) {
        const message = `💬 *Mensaje de Equipo en CRM Aurie*\n\n*De:* ${senderName}\n*Mensaje:* ${content}\n\n👉 Responder: https://agencia-crm-saas.vercel.app/team-chat/${chatId}`

        return this.sendMessageDetailed(message)
    }

    static async notifyTaskUrgent(taskTitle: string, dueDate: string, taskId: string) {
        const message = `⏰ *Tarea Urgente Pendiente*\n\n*Título:* ${taskTitle}\n*Vence:* ${dueDate}\n\n👉 Gestionar tarea: https://agencia-crm-saas.vercel.app/tasks/list?id=${taskId}`
        return this.sendMessage(message)
    }

    static async notifyLeadStatusChange(contactName: string, company: string, oldStatus: string, newStatus: string, contactId: string) {
        const message = `📈 *Cambio en Pipeline*\n\n*Contacto:* ${contactName}\n*Empresa:* ${company}\n*Estado:* ${oldStatus} -> *${newStatus}*\n\n👉 Ver contacto: https://agencia-crm-saas.vercel.app/contacts/${contactId}`
        return this.sendMessage(message)
    }
}
