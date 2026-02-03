import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { InvoiceTemplate } from '@/types/database'

// Get the optimal template based on item count to avoid overflow
export function getOptimalTemplate(templates: InvoiceTemplate[], itemCount: number): InvoiceTemplate {
    // 1. Filter templates that can hold the items
    const validTemplates = templates.filter(t => t.max_items >= itemCount)

    // 2. If valid templates exist, return the default one, or the first valid one
    if (validTemplates.length > 0) {
        return validTemplates.find(t => t.is_default) || validTemplates[0]
    }

    // 3. If NO template fits (extreme case), return the one with highest capacity
    return templates.reduce((prev, current) =>
        (prev.max_items > current.max_items) ? prev : current
    )
}

// Client-side fetcher for the selector
export async function fetchTemplatesClient() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .order('is_default', { ascending: false })

    if (error) throw error
    return (data || []) as InvoiceTemplate[]
}

export async function getTemplateById(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data as InvoiceTemplate
}
