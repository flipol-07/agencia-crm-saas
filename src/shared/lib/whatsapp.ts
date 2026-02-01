export class WhatsAppService {
    private static API_URL = process.env.EVOLUTION_API_URL || 'http://13.53.96.3:8080'
    private static API_KEY = process.env.EVOLUTION_API_KEY || '4D809A972D78-4CB6-8203-DCD2560B83BA'
    private static INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'n8nbot'
    private static TARGET_PHONE = '34693482385'

    static async sendMessage(text: string) {
        try {
            const response = await fetch(`${this.API_URL}/message/sendText/${this.INSTANCE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.API_KEY
                },
                body: JSON.stringify({
                    number: this.TARGET_PHONE,
                    text: text
                })
            })

            if (!response.ok) {
                const error = await response.text()
                console.error('WhatsAppService Error:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('WhatsAppService Exception:', error)
            return false
        }
    }

    static async notifyNewEmail(from: string, subject: string, contactId?: string | null) {
        const contactHint = contactId ? '👤 Cliente registrado' : '❓ Remitente desconocido'
        const message = `📧 *Nuevo Email en CRM Aurie*\n\n*De:* ${from}\n*Asunto:* ${subject}\n*Tipo:* ${contactHint}\n\n👉 Ver en el CRM: https://agencia-crm-saas.vercel.app/contacts`

        return this.sendMessage(message)
    }
}
