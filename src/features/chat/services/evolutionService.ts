import { sendWhatsAppAction } from '../actions/sendWhatsApp'

export const evolutionService = {
    async sendMessage(phone: string, content: string): Promise<{ success: boolean; id?: string; error?: string }> {
        // Llamamos a la server action que tiene las credenciales seguras
        return await sendWhatsAppAction(phone, content)
    }
}
