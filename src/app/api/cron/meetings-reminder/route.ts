import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { WhatsAppService } from '@/shared/lib/whatsapp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const CRON_SECRET = process.env.CRON_SECRET || 'aurie-maquina-2026';

    if (secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    try {
        const now = new Date();
        const lookAhead = new Date(now.getTime() + 11 * 60 * 1000);

        const { data: meetings, error } = await supabase
            .from('meetings')
            .select(`
                    id,
                    title,
                    date,
                    meeting_url,
                    attendees,
                    guest_phones,
                    user_id
                `)
            .gte('date', now.toISOString())
            .lte('date', lookAhead.toISOString())
            .neq('status', 'cancelled');

        if (error) throw error;
        if (!meetings || meetings.length === 0) {
            return NextResponse.json({ message: 'No upcoming meetings to remind' });
        }

        const results: any[] = [];

        const reminderPromises = (meetings as any[]).map(async (meeting) => {
            const meetingDate = new Date(meeting.date);
            const diffMs = meetingDate.getTime() - now.getTime();
            const diffMinutes = Math.round(diffMs / 60000);

            if (diffMinutes === 10 || diffMinutes === 5) {
                const attendees: string[] = Array.isArray(meeting.attendees) ? meeting.attendees : [];
                const meetTimeStr = format(meetingDate, "HH:mm", { locale: es });
                const msg = `🚨 *Recordatorio de Reunión*\n\nRecuerda que tienes esta reunión *${meeting.title}* a las *${meetTimeStr}*.\n\nY este es el enlace: ${meeting.meeting_url || 'No proporcionado'}`;

                const targetPromises: Promise<any>[] = [];

                if (attendees.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('email, billing_phone')
                        .in('email', attendees)
                        .not('billing_phone', 'is', null);

                    if (profiles && (profiles as any[]).length > 0) {
                        for (const profile of (profiles as any[])) {
                            if (profile.billing_phone) {
                                targetPromises.push(
                                    WhatsAppService.sendMessageToNumberDetailed(profile.billing_phone, msg)
                                        .then(() => results.push({ email: profile.email, targetPhone: profile.billing_phone, meeting: meeting.title, reminder: meetTimeStr }))
                                );
                            }
                        }
                    }
                }

                if (meeting.guest_phones && Number((meeting.guest_phones as any[]).length) > 0) {
                    for (const phone of meeting.guest_phones) {
                        if (phone) {
                            targetPromises.push(
                                WhatsAppService.sendMessageToNumberDetailed(phone, msg)
                                    .then(() => results.push({ targetPhone: phone, meeting: meeting.title, reminder: meetTimeStr, isGuest: true }))
                            );
                        }
                    }
                }

                await Promise.allSettled(targetPromises);
            }
        });

        await Promise.all(reminderPromises);

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error('Meetings Reminder Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
