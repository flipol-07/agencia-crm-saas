import type { InvoiceSubscriptionFrequency } from '@/types/database'

/**
 * Calcula la siguiente fecha de emision a partir de una fecha base y la frecuencia.
 * Funcion pura: no consulta BD ni mutates.
 *
 * Reglas:
 * - monthly: +1 mes
 * - quarterly: +3 meses
 * - yearly: +12 meses
 *
 * Si el dia de la fecha base no existe en el mes destino (p.ej. 31 enero -> febrero),
 * Date normaliza al ultimo dia disponible automaticamente. Nos vale.
 */
export function computeNextRun(from: Date, frequency: InvoiceSubscriptionFrequency): Date {
    const next = new Date(from.getTime())
    next.setHours(0, 0, 0, 0)

    switch (frequency) {
        case 'monthly':
            next.setMonth(next.getMonth() + 1)
            break
        case 'quarterly':
            next.setMonth(next.getMonth() + 3)
            break
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1)
            break
    }

    return next
}

/**
 * Formatea un Date como YYYY-MM-DD para columnas tipo DATE de Postgres.
 */
export function toDateString(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Parsea un string YYYY-MM-DD como Date local (no UTC para evitar shift de dia).
 */
export function parseDateString(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
}
