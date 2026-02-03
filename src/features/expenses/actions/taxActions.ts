'use server'

import { getTaxForecastCached } from '../services/expenseService.server'

export async function getTaxForecastAction() {
    return await getTaxForecastCached()
}
