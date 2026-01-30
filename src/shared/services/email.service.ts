/**
 * Servicio Global de Email
 * 
 * Unifica el envío de correos para toda la aplicación.
 */

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer; // Base64 string o Buffer
        encoding?: string;       // 'base64'
        contentType?: string;
    }>;
}

export const emailService = {
    /**
     * Envía un correo electrónico
     */
    send: async (options: EmailOptions): Promise<boolean> => {
        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Error del servidor de correo: ${error}`);
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('EmailService Error:', error);
            throw error;
        }
    }
};
