'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { cacheLife } from 'next/cache'

// ============================================
// Types
// ============================================

export interface ExecutiveKPIs {
    incomeThisMonth: number      // Paid invoices this month
    expensesThisMonth: number    // Business expenses this month (is_personal=false)
    netProfit: number            // Income - Expenses
    pipelinePotential: number    // Sum of estimated_value for active contacts
    pendingInvoices: number      // Total pending invoices (sent + overdue)
    activeProjects: number       // Count of active projects
}

export interface MonthlyTrendData {
    month: string                // e.g., "Ene", "Feb"
    income: number
    expenses: number
}

export interface ExpenseDistributionData {
    name: string                 // Category name
    value: number                // Amount
    color: string                // Chart color
}

export type DashboardPeriod = '30d' | '90d' | '6m' | '1y' | 'all'

export interface ProjectProgressData {
    id: string
    name: string
    clientName: string
    status: string
    totalTasks: number
    completedTasks: number
    progressPercent: number
    deadline: string | null
}

export interface TaskWithProject {
    id: string
    title: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    due_date: string | null
    is_completed: boolean
    projects?: {
        name: string
        contacts?: {
            company_name: string
        }
    }
}

function getRangeFromPeriod(period: DashboardPeriod) {
    const now = new Date()
    let start: Date | null = null
    const end = now

    switch (period) {
        case '30d':
            start = subMonths(now, 1)
            break
        case '90d':
            start = subMonths(now, 3)
            break
        case '6m':
            start = subMonths(now, 6)
            break
        case '1y':
            start = subMonths(now, 12)
            break
        case 'all':
            start = null
            break
    }

    return {
        start: start ? format(start, 'yyyy-MM-dd') : null,
        end: format(end, 'yyyy-MM-dd')
    }
}

// ============================================
// Service Functions
// ============================================

/**
 * Get Executive KPIs for the dashboard
 */
export async function getExecutiveKPIs(userId: string, period: DashboardPeriod = '30d'): Promise<ExecutiveKPIs> {
    'use cache'
    cacheLife('minutes')

    // Use admin client to avoid cookies() inside "use cache"
    const supabase = createAdminClient()
    const { start, end } = getRangeFromPeriod(period)

    // Parallelize all KPI queries
    const [incomeResult, expenseResult, activeContacts, activeProjectsData, pendingInvs, activeProjectsCount] = await Promise.all([
        // 1. Income
        (async () => {
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'income')
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 2. Expenses
        (async () => {
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'expense').eq('is_personal', false)
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 3. Contacts
        (supabase as any).from('contacts').select('estimated_value').not('status', 'in', '("won","lost")'),
        // 4. Projects budget
        (supabase as any).from('projects').select('budget').eq('status', 'active'),
        // 5. Pending invoices
        (supabase as any).from('invoices').select('total').in('status', ['sent', 'overdue']),
        // 6. Projects count
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ])

    const incomeThisMonth = (incomeResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const expensesThisMonth = (expenseResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const contactsValue = (activeContacts.data as { estimated_value: number }[] | null)?.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0) || 0
    const projectsValue = (activeProjectsData.data as { budget: number }[] | null)?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0
    const pipelinePotential = contactsValue + projectsValue
    const pendingInvoices = (pendingInvs.data as { total: number }[] | null)?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0

    return {
        incomeThisMonth,
        expensesThisMonth,
        netProfit: incomeThisMonth - expensesThisMonth,
        pipelinePotential,
        pendingInvoices,
        activeProjects: activeProjectsCount.count || 0
    }
}

/**
 * Get monthly trend data for line chart (last N months)
 */
export async function getMonthlyTrend(userId: string, months: number = 6): Promise<MonthlyTrendData[]> {
    'use cache'
    cacheLife('hours')

    const supabase = createAdminClient()
    const now = new Date()

    const monthPromises = Array.from({ length: months }, (_, i) => {
        const targetMonth = subMonths(now, i)
        const monthStart = format(startOfMonth(targetMonth), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(targetMonth), 'yyyy-MM-dd')
        const monthLabel = format(targetMonth, 'MMM')

        return (async () => {
            const [incomeResult, expenseResult] = await Promise.all([
                (supabase as any).from('expenses').select('amount').eq('type', 'income').gte('date', monthStart).lte('date', monthEnd),
                (supabase as any).from('expenses').select('amount').eq('type', 'expense').eq('is_personal', false).gte('date', monthStart).lte('date', monthEnd)
            ])

            const income = (incomeResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
            const expenseTotal = (expenseResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0

            return {
                month: monthLabel,
                income,
                expenses: expenseTotal,
                sortKey: i
            }
        })()
    })

    const results = await Promise.all(monthPromises)
    return results.sort((a, b) => b.sortKey - a.sortKey).map(({ sortKey, ...rest }) => rest)
}

/**
 * Get expense distribution by category
 */
export async function getExpenseDistribution(userId: string, period: DashboardPeriod = '30d'): Promise<ExpenseDistributionData[]> {
    'use cache'
    cacheLife('hours')

    const supabase = createAdminClient()
    const { start, end } = getRangeFromPeriod(period)

    // Get expenses with category info
    let query = supabase
        .from('expenses')
        .select(`
            amount,
            expense_categories ( name )
        `)
        .eq('type', 'expense')
        .eq('is_personal', false)

    if (start) query = query.gte('date', start)
    query = query.lte('date', end)

    const { data: expenses } = await query

    // Aggregate by category
    const categoryMap = new Map<string, number>()
    expenses?.forEach((exp: any) => {
        const categoryName = exp.expense_categories?.name || 'Sin categoría'
        const current = categoryMap.get(categoryName) || 0
        categoryMap.set(categoryName, current + (Number(exp.amount) || 0))
    })

    // Color palette for categories (more vibrant and varied)
    const colors = [
        '#bfff00', // Brand Lime
        '#3b82f6', // Vivid Blue
        '#9333ea', // Purple
        '#f97316', // Orange
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#10b981', // Emerald
        '#facc15', // Yellow
        '#ef4444', // Red
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#f87171', // Light Red
    ]
    let colorIndex = 0

    const result: ExpenseDistributionData[] = []
    categoryMap.forEach((value, name) => {
        result.push({
            name,
            value,
            color: colors[colorIndex % colors.length]
        })
        colorIndex++
    })

    return result.sort((a, b) => b.value - a.value)
}

/**
 * Get active projects with progress data
 */
export async function getProjectsProgress(userId: string): Promise<ProjectProgressData[]> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()

    // Get active projects with client info
    const { data: projects } = await (supabase as any)
        .from('projects')
        .select(`
            id,
            name,
            status,
            deadline,
            contacts ( company_name )
        `)
        .eq('status', 'active')
        .order('deadline', { ascending: true })
        .limit(5) as { data: { id: string; name: string; status: string; deadline: string | null; contacts: { company_name: string } | null }[] | null }

    if (!projects || projects.length === 0) {
        return []
    }

    // Parallelize task count queries for all projects
    const projectPromises = projects.map(async (project) => {
        const [totalTasks, completedTasks] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', project.id).eq('is_completed', true)
        ])

        const total = totalTasks.count || 0
        const completed = completedTasks.count || 0
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
            id: project.id,
            name: project.name,
            clientName: (project as any).contacts?.company_name || 'Sin cliente',
            status: project.status,
            totalTasks: total,
            completedTasks: completed,
            progressPercent,
            deadline: project.deadline
        }
    })

    return Promise.all(projectPromises)
}

/**
 * Get recent leads with caching
 */
export async function getRecentLeads(userId: string) {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5)

    return data || []
}

/**
 * Get priority tasks with caching
 */
export async function getPriorityTasks(userId: string) {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    let { data } = await (supabase.from('tasks') as any)
        .select(`
            id, title, priority, due_date, is_completed,
            projects ( name, contacts ( company_name ) )
        `)
        .eq('is_completed', false)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(6)

    if (!data) return []

    // Sorting logic moved from component to service
    const priorityWeight: Record<string, number> = {
        'urgent': 4,
        'high': 3,
        'medium': 2,
        'low': 1
    }

    const sortedTasks = [...data].sort((a: any, b: any) => {
        const aOverdue = a.due_date && a.due_date < today ? 1 : 0
        const bOverdue = b.due_date && b.due_date < today ? 1 : 0

        if (aOverdue !== bOverdue) return bOverdue - aOverdue
        const aPriority = priorityWeight[a.priority] || 0
        const bPriority = priorityWeight[b.priority] || 0
        if (aPriority !== bPriority) return bPriority - aPriority
        if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        return a.due_date ? -1 : 1
    })

    return sortedTasks.slice(0, 5)
}
