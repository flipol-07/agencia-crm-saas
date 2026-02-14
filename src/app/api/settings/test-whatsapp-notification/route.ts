import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/shared/lib/whatsapp'

const getSettingsKey = (userId: string) => `notification_preferences:${userId}`

const isValidEvolutionPhone = (phone: string) => /^34\d{8,15}$/.test(phone)

export async function POST() {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await (admin.from('app_settings') as any)
        .select('value')
        .eq('key', getSettingsKey(user.id))
        .maybeSingle()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const value = data?.value || {}
    const whatsappEnabled = value?.whatsapp_enabled === true
    const whatsappNumber = typeof value?.whatsapp_number === 'string' ? value.whatsapp_number : ''

    if (!whatsappEnabled) {
        return NextResponse.json({ error: 'Activa primero las notificaciones por WhatsApp.' }, { status: 400 })
    }

    if (!isValidEvolutionPhone(whatsappNumber)) {
        return NextResponse.json({ error: 'Numero invalido. Debe cumplir formato 34... (solo digitos).' }, { status: 400 })
    }

    const result = await WhatsAppService.sendMessageToNumberDetailed(
        whatsappNumber,
        `✅ *Prueba de notificaciones CRM Aurie*\n\nTu canal de WhatsApp esta configurado correctamente.\n\nFecha: ${new Date().toISOString()}`
    )

    if (!result.success) {
        return NextResponse.json({
            error: 'No se pudo enviar el mensaje de prueba.',
            details: result.error,
            status: result.status || null,
        }, { status: 502 })
    }

    return NextResponse.json({ success: true })
}
