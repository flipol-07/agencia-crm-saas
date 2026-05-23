import { randomUUID } from 'crypto'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return { ...(value as Record<string, unknown>) }
}

function isUuid(value: unknown): value is string {
    return typeof value === 'string' && UUID_PATTERN.test(value.trim())
}

export function prepareInvoiceCreatePayload(invoice: unknown, userId?: string | null): Record<string, unknown> {
    const payload = toRecord(invoice)
    const now = new Date().toISOString()

    payload.id = isUuid(payload.id) ? String(payload.id).trim() : randomUUID()
    payload.created_at = typeof payload.created_at === 'string' && payload.created_at.trim()
        ? payload.created_at
        : now
    payload.updated_at = typeof payload.updated_at === 'string' && payload.updated_at.trim()
        ? payload.updated_at
        : now

    if (!isUuid(payload.created_by)) {
        payload.created_by = isUuid(userId) ? userId : null
    }

    return payload
}

export function prepareInvoiceItemsCreatePayload(items: readonly unknown[]): Record<string, unknown>[] {
    return items.map((item) => {
        const payload = toRecord(item)
        delete payload.id
        delete payload.invoice_id
        delete payload.created_at
        delete payload.updated_at
        return payload
    })
}
