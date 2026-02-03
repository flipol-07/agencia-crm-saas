import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { subscription } = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        // Upsert subscription
        const { error } = await (supabase
            .from('push_subscriptions') as any)
            .upsert({
                user_id: user.id,
                subscription: subscription,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'subscription->>endpoint'
            });

        if (error) {
            console.error('Push subscription upsert error:', error);

            // Fallback: search and then insert/update
            const { data: existing } = await (supabase
                .from('push_subscriptions') as any)
                .select('id')
                .eq('user_id', user.id)
                .contains('subscription', { endpoint: subscription.endpoint })
                .single();

            if (existing) {
                await (supabase
                    .from('push_subscriptions') as any)
                    .update({ subscription, updated_at: new Date().toISOString() })
                    .eq('id', existing.id);
            } else {
                await (supabase
                    .from('push_subscriptions') as any)
                    .insert({ user_id: user.id, subscription });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push subscription API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
