import { z } from 'zod'

const dateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')

export const invoiceSubscriptionFrequencySchema = z.enum(['monthly', 'quarterly', 'yearly'])

export const invoiceSubscriptionCreateSchema = z.object({
    contact_id: z.string().uuid('contact_id inválido'),
    template_invoice_id: z.string().uuid('template_invoice_id inválido'),
    frequency: invoiceSubscriptionFrequencySchema,
    start_date: dateString,
    end_date: dateString.optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
})

export type InvoiceSubscriptionCreateInput = z.infer<typeof invoiceSubscriptionCreateSchema>

export const invoiceSubscriptionUpdateSchema = z.object({
    id: z.string().uuid('id inválido'),
    active: z.boolean().optional(),
    frequency: invoiceSubscriptionFrequencySchema.optional(),
    end_date: dateString.optional().nullable(),
    next_run_at: dateString.optional(),
    notes: z.string().max(2000).optional().nullable(),
})

export type InvoiceSubscriptionUpdateInput = z.infer<typeof invoiceSubscriptionUpdateSchema>

export const invoiceSubscriptionIdSchema = z.object({
    id: z.string().uuid('id inválido'),
})
