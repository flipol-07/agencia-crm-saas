
'use server'

import { googleCalendarService, CalendarEventPayload } from '@/shared/services/googleCalendarService';
import { addHours, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client'; // Note: Server Actions can use this but sebaiknya use server client if possible. 
import { createAdminClient } from '@/lib/supabase/server';
import { WhatsAppService } from '@/shared/lib/whatsapp';

/**
 * Server Action to schedule a meeting in Google Calendar
 */
export async function scheduleGoogleMeetingAction(formData: {
    title: string;
    date: string;
    summary: string;
    attendees: string[];
    recurrence?: string[];
}) {
    try {
        const startTime = parseISO(formData.date);
        const endTime = addHours(startTime, 1); // Default 1 hour

        let googleEventResult = null;
        const meetLink = process.env.GOOGLE_MEET_PERMANENT_LINK || '';

        // 1. Intentar crear en Google Calendar (si falla, no bloqueamos)
        try {
            const payload: CalendarEventPayload = {
                title: formData.title,
                description: formData.summary,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                attendees: formData.attendees,
                ...(formData.recurrence ? { recurrence: formData.recurrence } : {}),
            };
            googleEventResult = await googleCalendarService.createEvent(payload);
        } catch (calendarError) {
            console.error('⚠️ Google Calendar Sync Failed:', calendarError);
            // Continuamos aunque falle Google Calendar
        }

        // 2. Enviar correos de invitación siempre (incluso si falló Calendar)
        try {
            if (formData.attendees.length > 0) {
                const { emailServerService } = await import('@/shared/services/emailServer');

                const emailHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
                        <h2 style="color: #A3E635;">📅 Nueva Reunión Agendada</h2>
                        <p>Hola,</p>
                        <p>Se ha agendado una nueva reunión en <strong>Aurie CRM</strong>:</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Título:</strong> ${formData.title}</p>
                            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${startTime.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            <p style="margin: 5px 0;"><strong>Agenda:</strong> ${formData.summary || 'Sin descripción'}</p>
                        </div>

                        ${meetLink ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${meetLink}" style="background-color: #A3E635; color: black; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                                    Unirse a Google Meet
                                </a>
                            </div>
                        ` : ''}

                        <p style="color: #666; font-size: 12px;">Esta es una invitación automática de Aurie CRM.</p>
                    </div>
                `;

                await emailServerService.send({
                    to: formData.attendees,
                    subject: `Invitación: ${formData.title}`,
                    html: emailHtml
                });
            }
        } catch (emailError) {
            console.error('⚠️ Email Sending Failed:', emailError);
        }

        // Siempre devolvemos éxito para que el frontend guarde en Supabase
        return {
            success: true,
            data: {
                id: googleEventResult?.id || null,
                htmlLink: googleEventResult?.htmlLink || null,
                meetLink: meetLink || googleEventResult?.meetLink || null,
                warning: !googleEventResult ? 'Google Calendar sync failed, but meeting scheduled locally.' : null
            },
        };
    } catch (error: any) {
        console.error('Critical Action Error:', error);
        // Fallback absoluto
        return {
            success: true, // Forzamos true para que no bloquee la UI
            data: {
                meetLink: process.env.GOOGLE_MEET_PERMANENT_LINK || '',
            }
        };
    }
}

export async function sendManualReminderAction(
    attendees: string[],
    meetingTitle: string,
    guestPhones: string[] = [],
    meetingDateStr: string,
    meetingUrl: string | null
) {
    if ((!attendees || attendees.length === 0) && (!guestPhones || guestPhones.length === 0)) {
        return { success: false, error: 'No hay asistentes ni invitados para enviar el recordatorio.' }
    }

    try {
        const meetingDate = new Date(meetingDateStr);
        const dateStr = format(meetingDate, "dd/MM/yyyy", { locale: es });
        const timeStr = format(meetingDate, "HH:mm", { locale: es });
        const msg = `🚨 *Recordatorio de Reunión*\n\nRecuerda que tienes la reunión *${meetingTitle}* el *${dateStr}* a las *${timeStr}*.\n\nY este es el enlace: ${meetingUrl || 'No proporcionado'}`;

        const supabase = await createAdminClient();
        const { data: profiles } = await supabase
            .from('profiles')
            .select('email, billing_phone')
            .in('email', attendees)
            .not('billing_phone', 'is', null);

        const profilesSafe = profiles || [];

        let sentCount = 0;
        for (const profile of (profilesSafe as any[])) {
            if (profile.billing_phone) {
                const result = await WhatsAppService.sendMessageToNumberDetailed(profile.billing_phone, msg);
                if (result.success) sentCount++;
            }
        }

        // Send to guest phones as well
        if (guestPhones && guestPhones.length > 0) {
            for (const phone of guestPhones) {
                const result = await WhatsAppService.sendMessageToNumberDetailed(phone, msg);
                if (result.success) sentCount++;
            }
        }

        return {
            success: true,
            message: `Se enviaron ${sentCount} recordatorios de WhatsApp exitosamente.`
        }
    } catch (error: any) {
        console.error('WhatsApp Reminder Error:', error)
        return { success: false, error: error.message || 'Error desconocido' }
    }
}
