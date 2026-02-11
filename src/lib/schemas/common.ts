import { z } from 'zod'

/**
 * Common Zod schemas for input validation
 * Use these schemas to ensure consistency across the application.
 */

// Email Validation
export const emailSchema = z
    .string()
    .email({ message: "Invalid email address" })
    .min(5)
    .max(255)
    .trim()
    .toLowerCase()

// Password Validation (Minimum 8 chars, at least one number)
export const passwordSchema = z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100)
    .regex(/\d/, { message: "Password must contain at least one number" })

// UUID Validation (for IDs)
export const uuidSchema = z
    .string()
    .uuid({ message: "Invalid ID format" })

// Pagination Schema
export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
})

// Search Query Schema
export const searchSchema = z.string().trim().max(100).optional()

// Date String Schema (ISO 8601)
export const dateStringSchema = z.string().datetime({ message: "Invalid date format" })

export type EmailInput = z.infer<typeof emailSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
