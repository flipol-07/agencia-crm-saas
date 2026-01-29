/**
 * API Route: Enviar Email
 * POST /api/lead-scraper/send-email
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Faltan campos: to, subject, html' },
                { status: 400 }
            );
        }

        // Configurar transporter SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Enviar email
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        });

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
        });

    } catch (error) {
        console.error('Error enviando email:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
