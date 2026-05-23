import { z } from 'zod'

const CONTACT_STATUSES = ['prospect', 'qualified', 'proposal', 'won', 'active', 'maintenance', 'lost'] as const
const CONTACT_SOURCES = ['inbound_whatsapp', 'inbound_email', 'outbound', 'referral', 'website', 'other'] as const
const PIPELINE_STAGES = ['nuevo', 'cualificacion', 'propuesta', 'enviada', 'ganado', 'perdido'] as const

const trimmedString = (max: number) => z.string().trim().max(max)
const nullableTrimmed = (max: number) => trimmedString(max).optional().nullable().transform(v => (v === '' ? null : v ?? null))

const emailSchema = z.string().trim().toLowerCase().email('Email no válido').max(254)
const phoneSchema = z.string().trim().min(3).max(40).regex(/^[+\d\s().-]+$/i, 'Teléfono no válido')
const urlSchema = z.string().trim().url('URL no válida').max(2048)

export const contactCreateSchema = z.object({
    company_name: trimmedString(200).min(1, 'El nombre de empresa es obligatorio'),
    contact_name: nullableTrimmed(200),
    email: emailSchema.optional().nullable().or(z.literal('')).transform(v => (v ? v : null)),
    phone: phoneSchema.optional().nullable().or(z.literal('')).transform(v => (v ? v : null)),
    tax_id: nullableTrimmed(40),
    tax_address: nullableTrimmed(500),
    status: z.enum(CONTACT_STATUSES).default('prospect'),
    pipeline_stage: z.enum(PIPELINE_STAGES).default('nuevo'),
    pain_points: z.array(z.string().trim().max(500)).default([]),
    requirements: z.array(z.string().trim().max(500)).default([]),
    notes: nullableTrimmed(5000),
    assigned_to: z.string().uuid().nullable().optional(),
    source: z.enum(CONTACT_SOURCES).default('other'),
    created_by: z.string().uuid().nullable().optional(),
    estimated_value: z.coerce.number().nonnegative().nullable().optional(),
    website: urlSchema.optional().nullable().or(z.literal('')).transform(v => (v ? v : null)),
    ai_description: nullableTrimmed(5000),
    services: z.array(z.string().trim().max(120)).default([]).optional(),
    probability_close: z.coerce.number().int().min(0).max(100).nullable().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const contactUpdateSchema = contactCreateSchema.partial()

export type ContactCreateInput = z.infer<typeof contactCreateSchema>
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>

/**
 * Devuelve el primer mensaje de error de un ZodError en formato amigable.
 */
export function formatZodError(error: z.ZodError): string {
    const issue = error.issues[0]
    if (!issue) return 'Datos no válidos'
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
}
