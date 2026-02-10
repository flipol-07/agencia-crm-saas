
import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

export const emailServerService = {
    send: async (options: EmailOptions) => {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
            port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER || process.env.EMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
        };

        return await transporter.sendMail(mailOptions);
    }
};
