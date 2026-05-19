'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
    Expense,
    ExpenseInsert,
    ExpenseUpdate,
    ExpenseWithRelations,
    Sector,
    ExpenseCategory
} from '../types'
import { classifyExpenseAI } from '../services/expense-ai.service'
import { analyzeReceiptAI } from '../services/receipt-ai.service'

export async function classifyExpenseAction(params: {
    description: string
    sectors: Sector[]
    categories: ExpenseCategory[]
    type: 'expense' | 'income'
}) {
    return await classifyExpenseAI(params)
}

export async function analyzeReceiptAction(params: {
    formData: FormData
    sectors: Sector[]
    categories: ExpenseCategory[]
    type: 'expense' | 'income'
}) {
    const file = params.formData.get('receipt')

    if (!(file instanceof File)) {
        throw new Error('No se ha recibido ningún archivo')
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no puede superar los 10 MB')
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Sube un PDF o una imagen JPG, PNG o WebP')
    }

    return await analyzeReceiptAI({
        file,
        sectors: params.sectors,
        categories: params.categories,
        type: params.type,
    })
}

export async function uploadReceiptAction(formData: FormData): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('No autorizado')
    }

    const file = formData.get('receipt')
    if (!(file instanceof File)) {
        throw new Error('No se ha recibido ningún archivo')
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no puede superar los 10 MB')
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Sube un PDF o una imagen JPG, PNG o WebP')
    }

    const admin = await createAdminClient()
    await admin.storage.createBucket('expense-receipts', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: allowedTypes,
    })

    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'factura'
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}.${extension}`

    const { error: uploadError } = await admin.storage
        .from('expense-receipts')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
        })

    if (uploadError) {
        throw new Error(`No se pudo subir la factura: ${uploadError.message}`)
    }

    const { data } = admin.storage
        .from('expense-receipts')
        .getPublicUrl(path)

    return data.publicUrl
}

export async function getExpenseByIdAction(id: string): Promise<ExpenseWithRelations | null> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .select(`
            *,
            sectors (id, name, color, icon),
            expense_categories (id, name, type, icon)
        `)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }
    return data as ExpenseWithRelations
}

export async function createExpenseAction(expense: ExpenseInsert): Promise<Expense> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .insert(expense as any)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Expense
}

export async function updateExpenseAction(id: string, expense: ExpenseUpdate): Promise<Expense> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .update({ ...expense, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Expense
}

export async function deleteExpenseAction(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase.from('expenses') as any)
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}
