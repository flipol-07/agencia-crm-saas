/**
 * Operaciones monetarias con redondeo banker-safe a 2 decimales.
 * Toda suma/resta/multiplicación se hace en céntimos enteros para evitar
 * errores de coma flotante (0.1 + 0.2 !== 0.3).
 */

export const CURRENCY_DECIMALS = 2

/**
 * Redondeo half-away-from-zero a 2 decimales (estandar facturacion ES).
 */
export function roundCurrency(value: number): number {
    if (!Number.isFinite(value)) return 0
    const sign = value < 0 ? -1 : 1
    const abs = Math.abs(value)
    // Number.EPSILON evita el bug "1.005 → 1.00" del round nativo.
    const rounded = Math.round((abs + Number.EPSILON) * 100) / 100
    return sign * rounded
}

/**
 * Convierte euros a céntimos enteros.
 */
function toCents(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.round(value * 100)
}

/**
 * Convierte céntimos enteros a euros.
 */
function fromCents(cents: number): number {
    return cents / 100
}

export interface LineItemLike {
    quantity: number
    unit_price: number
}

/**
 * Calcula el total de un line item: quantity * unit_price, redondeado.
 */
export function lineItemTotal(item: LineItemLike): number {
    if (!Number.isFinite(item.quantity) || !Number.isFinite(item.unit_price)) return 0
    return roundCurrency(item.quantity * item.unit_price)
}

/**
 * Suma de subtotales de varios line items (redondea cada uno antes de sumar
 * para que coincida con lo que se muestra al cliente).
 */
export function sumLineItems(items: LineItemLike[]): number {
    const totalCents = items.reduce((acc, item) => acc + toCents(lineItemTotal(item)), 0)
    return fromCents(totalCents)
}

/**
 * Aplica un porcentaje (e.g. 21 para IVA 21%) sobre una base.
 * Devuelve el importe del impuesto, no la base + impuesto.
 */
export function applyPercentage(base: number, rate: number): number {
    if (!Number.isFinite(base) || !Number.isFinite(rate) || rate === 0) return 0
    return roundCurrency((base * rate) / 100)
}

export interface InvoiceTotals {
    subtotal: number
    taxAmount: number
    irpfAmount: number
    total: number
}

/**
 * Calcula todos los totales de una factura de forma consistente.
 * total = subtotal + IVA - IRPF
 */
export function computeInvoiceTotals(params: {
    items: LineItemLike[]
    taxRate: number
    irpfRate: number
}): InvoiceTotals {
    const subtotal = sumLineItems(params.items)
    const taxAmount = applyPercentage(subtotal, params.taxRate)
    const irpfAmount = applyPercentage(subtotal, params.irpfRate)
    const totalCents = toCents(subtotal) + toCents(taxAmount) - toCents(irpfAmount)
    return {
        subtotal,
        taxAmount,
        irpfAmount,
        total: fromCents(totalCents),
    }
}

/**
 * Whitelist de monedas soportadas (ISO 4217). Para añadir mas:
 * agregar el codigo aqui. Intl.NumberFormat soporta cualquier codigo ISO 4217.
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'MXN', 'ARS', 'COP', 'CLP', 'BRL', 'CAD'] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

export function isSupportedCurrency(c: string): c is SupportedCurrency {
    return (SUPPORTED_CURRENCIES as readonly string[]).includes(c)
}

/**
 * Formatea un importe según locale ES por defecto.
 */
export function formatCurrency(value: number, currency = 'EUR', locale = 'es-ES'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(roundCurrency(value))
}
