import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type NotificationPreferences = {
    push_enabled: boolean
    whatsapp_enabled: boolean
    whatsapp_number: string
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    push_enabled: true,
    whatsapp_enabled: false,
    whatsapp_number: '',
}

const POL_EMAIL = 'plorenzopizarro@gmail.com'
const POL_WHATSAPP = '34693482385'

const getSettingsKey = (userId: string) => `notification_preferences:${userId}`

const parsePreferences = (value: unknown): NotificationPreferences => {
    const raw = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
    return {
        push_enabled: raw.push_enabled !== false,
        whatsapp_enabled: raw.whatsapp_enabled === true,
        whatsapp_number: typeof raw.whatsapp_number === 'string' ? raw.whatsapp_number : '',
    }
}

const isValidEvolutionPhone = (phone: string) => /^34\d{8,15}$/.test(phone)

export async function GET() {
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

    let preferences = data?.value ? parsePreferences(data.value) : DEFAULT_PREFERENCES

    // Primer arranque: precargar número de Pol si aún no existe configuración.
    if (!data?.value && user.email?.toLowerCase() === POL_EMAIL) {
        preferences = {
            ...preferences,
            whatsapp_number: POL_WHATSAPP,
        }
    }

    return NextResponse.json({ preferences })
}

export async function PUT(request: NextRequest) {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const preferences = parsePreferences(body?.preferences)

        if (preferences.whatsapp_enabled && !isValidEvolutionPhone(preferences.whatsapp_number)) {
            return NextResponse.json({
                error: 'El numero de WhatsApp debe tener formato 34... (solo digitos, sin +)',
            }, { status: 400 })
        }

        const { error } = await (admin.from('app_settings') as any).upsert({
            key: getSettingsKey(user.id),
            value: preferences,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'key',
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, preferences })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid payload'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
