// Simulación de envío a Evolution API
// En el futuro, aquí irá la integración real con axios/fetch a la instancia de Evolution API

export const evolutionService = {
    async sendMessage(phone: string, content: string): Promise<{ success: boolean; id: string }> {
        console.log(`[MOCK] Sending WhatsApp to ${phone}: ${content}`)

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500))

        // Simular éxito
        // En real devolvería el ID del mensaje generado por Evolution
        return {
            success: true,
            id: `wamid_${Date.now()}_mock`
        }
    },

    // TODO: Añadir métodos para enviar media, listas, botones, etc.
}
