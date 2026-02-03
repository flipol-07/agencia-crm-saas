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
    trends?: {
        income: number           // Percentage change vs previous period
        expenses: number
        netProfit: number
        pipeline: number
        projects: number
    }
}

// ... (Rest of interfaces remain the same)
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

    // Previous period logic
    let prevStart: Date | null = null
    let prevEnd: Date | null = null

    switch (period) {
        case '30d':
            start = subMonths(now, 1)
            prevStart = subMonths(now, 2)
            prevEnd = subMonths(now, 1)
            break
        case '90d':
            start = subMonths(now, 3)
            prevStart = subMonths(now, 6)
            prevEnd = subMonths(now, 3)
            break
        case '6m':
            start = subMonths(now, 6)
            prevStart = subMonths(now, 12)
            prevEnd = subMonths(now, 6)
            break
        case '1y':
            start = subMonths(now, 12)
            prevStart = subMonths(now, 24)
            prevEnd = subMonths(now, 12)
            break
        case 'all':
            start = null
            prevStart = null
            prevEnd = null
            break
    }

    return {
        start: start ? format(start, 'yyyy-MM-dd') : null,
        end: format(end, 'yyyy-MM-dd'),
        prevStart: prevStart ? format(prevStart, 'yyyy-MM-dd') : null,
        prevEnd: prevEnd ? format(prevEnd, 'yyyy-MM-dd') : null
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
    const { start, end, prevStart, prevEnd } = getRangeFromPeriod(period)

    // Parallelize all KPI queries (Current + Previous Period)
    const [
        // CURRENT PERIOD
        incomeResult,
        expenseResult,
        activeContacts,
        activeProjectsData,
        pendingInvs,
        activeProjectsCount,
        // PREVIOUS PERIOD (for trends)
        prevIncomeResult,
        prevExpenseResult,
        prevActiveContacts, // Needs snapshot or created_at logic (approximation)
        prevActiveProjectsCount
    ] = await Promise.all([
        // 1. Current Income
        (async () => {
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'income')
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 2. Current Expenses
        (async () => {
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'expense').eq('is_personal', false)
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 3. Current Contacts (Pipeline)
        (supabase as any).from('contacts').select('estimated_value').not('status', 'in', '("won","lost")'),
        // 4. Current Projects budget
        (supabase as any).from('projects').select('budget').eq('status', 'active'),
        // 5. Current Pending invoices
        (supabase as any).from('invoices').select('total').in('status', ['sent', 'overdue']),
        // 6. Current Projects count
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),

        // --- PREVIOUS PERIOD QUERIES ---

        // 7. Prev Income
        (async () => {
            if (!prevStart || !prevEnd) return { data: [] }
            return (supabase as any).from('expenses')
                .select('amount')
                .eq('type', 'income')
                .gte('date', prevStart)
                .lte('date', prevEnd)
        })(),
        // 8. Prev Expenses
        (async () => {
            if (!prevStart || !prevEnd) return { data: [] }
            return (supabase as any).from('expenses')
                .select('amount')
                .eq('type', 'expense')
                .eq('is_personal', false)
                .gte('date', prevStart)
                .lte('date', prevEnd)
        })(),
        // 9. Prev Pipeline (Approx: contacts created before prevEnd and updated in that range? Hard to reconstruct pipeline state without snapshots. 
        // Strategy: Just compare created_at volume or assume steady state for now, simplified to 0 for trend if complex)
        // Let's try: Contacts created in the previous period.
        (async () => {
            if (!prevStart || !prevEnd) return { data: [] }
            return (supabase as any).from('contacts')
                .select('estimated_value')
                .gte('created_at', prevStart)
                .lte('created_at', prevEnd)
        })(),
        // 10. Prev Projects (Approx: projects created in range)
        (async () => {
            if (!prevStart || !prevEnd) return { count: 0 }
            return supabase.from('projects')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', prevStart)
                .lte('created_at', prevEnd)
        })()
    ])

    // --- Current Values ---
    const incomeThisMonth = (incomeResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const expensesThisMonth = (expenseResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const netProfit = incomeThisMonth - expensesThisMonth

    const contactsValue = (activeContacts.data as { estimated_value: number }[] | null)?.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0) || 0
    const projectsValue = (activeProjectsData.data as { budget: number }[] | null)?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0
    const pipelinePotential = contactsValue + projectsValue

    const pendingInvoices = (pendingInvs.data as { total: number }[] | null)?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0
    const activeProjects = activeProjectsCount.count || 0

    // --- Previous Values ---
    const prevIncome = (prevIncomeResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const prevExpenses = (prevExpenseResult.data as { amount: number }[] | null)?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0
    const prevNetProfit = prevIncome - prevExpenses

    // Pipeline Trend approximation (Value of leads created in period vs prev period)
    // NOTE: True pipeline trend requires snapshots. We'll use "Value of leads created" as a proxy for sales velocity if period != all
    const prevPipelineCreated = (prevActiveContacts.data as { estimated_value: number }[] | null)?.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0) || 0
    // We need current leads created too for fair comparison
    // But we fetched ALL active contacts for "Current Pipeline". 
    // Optimization: Let's calculate trends strictly for Income/Expense/Profit which are time-series based. 
    // For Pipeline/Projects, we will return 0 trend if we can't accurately calculate it without snapshots.

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    return {
        incomeThisMonth,
        expensesThisMonth,
        netProfit,
        pipelinePotential,
        pendingInvoices,
        activeProjects,
        trends: {
            income: calculateTrend(incomeThisMonth, prevIncome),
            expenses: calculateTrend(expensesThisMonth, prevExpenses),
            netProfit: calculateTrend(netProfit, prevNetProfit),
            pipeline: 0, // Not accurate to calculate without snapshots
            projects: 0  // Not accurate to calculate active count history without snapshots
        }
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

/**
 * Get AI-powered recommendations based on user role and stats
 */
import { generateRecommendations, Recommendation } from '../lib/recommendation-engine'
import { aiRecommendationsService } from './ai-recommendations.service'

export async function getDashboardRecommendations(userId: string): Promise<Recommendation[]> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()

    // 1. Get Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('professional_role')
        .eq('id', userId)
        .single() as { data: { professional_role: string } | null }

    // 2. Get KPIs (reuse existing function logic or call it if not for cache issues - better to fetch necessary data in parallel here for speed)
    // We reuse getExecutiveKPIs but since we are inside a cached function, calling another cached function is fine in Next 16 (deduped).
    const kpis = await getExecutiveKPIs(userId, '30d')

    // 3. Get Context Data
    const [recentLeads, highPrioTasks] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).gt('created_at', format(subMonths(new Date(), 1), 'yyyy-MM-dd')),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('is_completed', false).in('priority', ['high', 'urgent'])
    ])

    const context = {
        role: profile?.professional_role || null,
        kpis,
        recentLeadsCount: recentLeads.count || 0,
        highPriorityTasksCount: highPrioTasks.count || 0
    }

    // 4. Try AI Recommendations first
    try {
        const aiRecommendations = await aiRecommendationsService.generateRecommendations(context)
        if (aiRecommendations.length > 0) {
            return aiRecommendations
        }
    } catch (error) {
        console.error('Failed to get AI recommendations, falling back to rules', error)
    }

    // 5. Fallback to Rule-based engine
    return generateRecommendations(context)
}
