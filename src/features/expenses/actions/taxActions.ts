'use server'

import { createClient } from '@/lib/supabase/server'
import { getTaxForecastCached } from '../services/expenseService.server'

export async function getTaxForecastAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return await getTaxForecastCached(user?.id)
}
