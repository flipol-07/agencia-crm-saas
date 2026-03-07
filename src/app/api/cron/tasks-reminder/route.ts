import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { WhatsAppService } from '@/shared/lib/whatsapp';
import { WebPushService } from '@/shared/lib/web-push';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const CRON_SECRET = process.env.CRON_SECRET || 'aurie-maquina-2026';

    if (secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    try {
        // 1. Get tasks due in the next 24 hours that are not completed
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                due_date,
                status,
                assigned_to,
                profiles!tasks_assigned_to_fkey(full_name, id)
            `)
            .neq('status', 'completed')
            .gte('due_date', now.toISOString())
            .lte('due_date', tomorrow.toISOString());

        if (tasksError) throw tasksError;
        if (!tasks || (tasks as any[]).length === 0) {
            return NextResponse.json({ message: 'No urgent tasks found' });
        }

        const results: any[] = [];
        const taskPromises = (tasks as any[]).map(async (taskData) => {
            const task = taskData;
            const assignees = Array.isArray(task.profiles) ? task.profiles : [task.profiles];

            const assigneePromises = assignees.map(async (profile: any) => {
                if (!profile?.id) return;

                // 2 & 3. Notify via WhatsApp and Push in parallel
                const notificationPromises: Promise<any>[] = [];

                notificationPromises.push(
                    WhatsAppService.notifyTaskUrgent(
                        task.title,
                        new Date(task.due_date).toLocaleString(),
                        task.id
                    )
                );

                const { data: subscriptions } = await (supabase
                    .from('push_subscriptions') as any)
                    .select('id, subscription')
                    .eq('user_id', profile.id);

                if (subscriptions && (subscriptions as any[]).length > 0) {
                    const pushPromises = (subscriptions as any[]).map(async (sub) => {
                        const pushResult = await WebPushService.sendNotification(sub.subscription, {
                            title: 'Tarea Urgente',
                            body: `La tarea "${task.title}" vence pronto (${new Date(task.due_date).toLocaleTimeString()}).`,
                            data: { url: `/tasks/list?id=${task.id}` }
                        });

                        if (pushResult.error === 'GONE') {
                            await (supabase
                                .from('push_subscriptions') as any)
                                .delete()
                                .eq('id', sub.id);
                        }
                    });
                    notificationPromises.push(...pushPromises);
                }

                await Promise.allSettled(notificationPromises);
                results.push({ task: task.title, user: profile.full_name });
            });

            await Promise.all(assigneePromises);
        });

        await Promise.all(taskPromises);

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error('Task Reminder Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
