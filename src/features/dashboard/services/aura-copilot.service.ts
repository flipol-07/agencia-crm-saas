'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getExecutiveKPIs, getPriorityTasks } from './dashboard.service'
import { format, subMonths } from 'date-fns'

export interface CopilotContext {
    role: string | null
    description: string | null
    kpis: any
    recentLeads: any[]
    urgentTasks: any[]
    pendingInvoices: any[]
}

export async function getAuraCopilotContext(userId: string): Promise<CopilotContext> {
    const supabase = createAdminClient()

    // 1. Perfil y Rol
    const { data: profile } = await supabase
        .from('profiles')
        .select('professional_role, professional_description')
        .eq('id', userId)
        .single() as { data: { professional_role: string; professional_description: string } | null }


    // 2. KPIs
    const kpis = await getExecutiveKPIs(userId, '30d')

    // 3. Tareas Urgentes
    const urgentTasks = await getPriorityTasks(userId)

    // 4. Leads Recientes (30 días)
    const { data: recentLeads } = await supabase
        .from('contacts')
        .select('id, company_name, contact_name, status, created_at')
        .gt('created_at', format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(5)

    // 5. Facturas Pendientes/Vencidas
    const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('id, number, total, status, due_date, contacts(company_name)')
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(5)

    return {
        role: profile?.professional_role || null,
        description: profile?.professional_description || null,
        kpis,
        recentLeads: recentLeads || [],
        urgentTasks: urgentTasks || [],
        pendingInvoices: pendingInvoices || []
    }
}
