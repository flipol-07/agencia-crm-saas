import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido')

export const expenseCreateSchema = z.object({
    user_id: z.string().uuid(),
    sector_id: z.string().uuid().nullable().optional(),
    category_id: z.string().uuid().nullable().optional(),
    type: z.enum(['expense', 'income']),
    amount: z.coerce.number().nonnegative('El importe no puede ser negativo'),
    currency: z.string().length(3),
    date: dateString,
    description: z.string().max(2000).nullable().optional(),
    is_personal: z.boolean(),
    tax_deductible: z.boolean(),
    tax_rate: z.coerce.number().min(0).max(100),
    receipt_url: z.string().url().nullable().optional(),
})

export const expenseUpdateSchema = expenseCreateSchema.partial().omit({ user_id: true })

export const expenseIdSchema = z.string().uuid('ID inválido')

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>
