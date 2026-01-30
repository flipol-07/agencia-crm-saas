'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardMetrics {
    totalLeads: number
    pipelineValue: number
    invoicedThisMonth: number
    pendingPayment: number
    pendingTasks: number
    overdueTasks: number
}

export function useDashboardMetrics() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalLeads: 0,
        pipelineValue: 0,
        invoicedThisMonth: 0,
        pendingPayment: 0,
        pendingTasks: 0,
        overdueTasks: 0,
    })
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const now = new Date()
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                const todayStr = now.toISOString().split('T')[0]

                // 1. Leads: Activos (no ganados/perdidos) y Valor Pipeline
                const { data: leadsData } = await (supabase.from('contacts') as any)
                    .select('estimated_value, status')
                    .not('status', 'in', '("won","lost")') // Excluir cerrados para "Activos"

                const activeLeads = leadsData || []
                const totalLeads = activeLeads.length
                const pipelineValue = activeLeads.reduce((sum: number, lead: any) => sum + (lead.estimated_value || 0), 0)

                // 2. Facturación: Mes actual y Pendiente
                const { data: invoicesData } = await (supabase.from('invoices') as any)
                    .select('total, status, issue_date')

                const invoices = invoicesData || []

                // Facturado este mes (basado en fecha emisión)
                const invoicedThisMonth = invoices
                    .filter((inv: any) => inv.issue_date >= firstDayOfMonth && inv.status !== 'cancelled' && inv.status !== 'draft')
                    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)

                // Pendiente de cobro (sent, overdue)
                const pendingPayment = invoices
                    .filter((inv: any) => ['sent', 'overdue'].includes(inv.status))
                    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)

                // 3. Operativo: Tareas pendientes y vencidas
                const { data: tasksData } = await (supabase.from('tasks') as any)
                    .select('due_date, is_completed')
                    .eq('is_completed', false)

                const pendingTasksList = tasksData || []
                const pendingTasks = pendingTasksList.length

                const overdueTasks = pendingTasksList.filter((t: any) =>
                    t.due_date && t.due_date < todayStr
                ).length

                setMetrics({
                    totalLeads,
                    pipelineValue,
                    invoicedThisMonth,
                    pendingPayment,
                    pendingTasks,
                    overdueTasks
                })
            } catch (error) {
                console.error('Error fetching dashboard metrics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [supabase])

    return { metrics, loading }
}
