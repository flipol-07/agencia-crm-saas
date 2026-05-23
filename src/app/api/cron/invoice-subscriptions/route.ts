import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET || ''

/**
 * Trigger manual del procesador de suscripciones.
 *
 * El cron real corre dentro de Supabase (pg_cron, ver migration
 * 20260522101100_invoice_subscriptions_cron.sql). Este endpoint solo es util
 * para tests/triggers manuales con curl + Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
    const headerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const querySecret = new URL(request.url).searchParams.get('secret')
    const isAuthorized = CRON_SECRET && (headerSecret === CRON_SECRET || querySecret === CRON_SECRET)

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('process_invoice_subscriptions')

    if (error) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: 500 }
        )
    }

    return NextResponse.json(data ?? { processed: 0 })
}
