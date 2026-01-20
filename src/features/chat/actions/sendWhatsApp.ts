'use server'

export async function sendWhatsAppAction(phone: string, content: string) {
    try {
        const baseUrl = process.env.EVOLUTION_API_URL
        const apiKey = process.env.EVOLUTION_API_KEY
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME

        if (!baseUrl || !apiKey || !instanceName) {
            throw new Error('Configuración de Evolution API incompleta en el servidor.')
        }

        const cleanUrl = baseUrl.replace(/\/$/, '')
        // Limpiar número (quitar +, espacios, etc)
        const cleanPhone = phone.replace(/\D/g, '')

        const response = await fetch(`${cleanUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: content,
                linkPreview: true
            })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || `Error al enviar WhatsApp (${response.status})`)
        }

        return {
            success: true,
            id: data.key?.id || `msg_${Date.now()}`
        }
    } catch (error: any) {
        console.error('[sendWhatsAppAction Error]', error.message)
        return { success: false, error: error.message }
    }
}
