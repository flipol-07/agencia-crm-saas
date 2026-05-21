'use server'

import { createClient } from '@/lib/supabase/server'
import { getTaxForecastCached } from '../services/expenseService.server'

export async function getTaxForecastAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
        return { iva_repercutido: 0, iva_soportado: 0, iva_resultado: 0, quarter: 0, year: new Date().getFullYear() }
    }
    return await getTaxForecastCached(user.id)
}
