import 'dotenv/config';
import { createAdminClient } from '../lib/supabase/server';
import { WebPushService } from '../shared/lib/web-push';

async function sendTestPush() {
    // Force env vars for script context
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pivqjclgyluohhgtqyic.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // This is just a hint, I'll use the command line to pass it safely or load from file.

    console.log('🚀 Iniciando envío de prueba...');
    const supabase = await createAdminClient();

    // 1. Buscar la suscripción más reciente
    const { data: subscriptions, error } = await (supabase
        .from('push_subscriptions') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !subscriptions || subscriptions.length === 0) {
        console.error('❌ No se encontraron suscripciones activas en la base de datos.');
        return;
    }

    const sub = subscriptions[0];
    console.log(`📡 Enviando notificación a user_id: ${sub.user_id}...`);

    // 2. Enviar notificación
    const result = await WebPushService.sendNotification(sub.subscription, {
        title: '¡Prueba de Aurie CRM! 🚀',
        body: 'Si ves esto, las notificaciones Push están configuradas correctamente en tu dispositivo.',
        data: { url: '/dashboard' }
    });

    if (result.success) {
        console.log('✅ ¡Notificación enviada con éxito!');
    } else {
        console.error('❌ Error al enviar:', result.error);
    }
}

sendTestPush();
