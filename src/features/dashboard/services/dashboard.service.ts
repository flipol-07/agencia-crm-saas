'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { cacheLife } from 'next/cache'
import { generateRecommendations, Recommendation } from '../lib/recommendation-engine'
import { aiRecommendationsService } from './ai-recommendations.service'

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
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'income').eq('user_id', userId)
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 2. Current Expenses
        (async () => {
            let q = (supabase as any).from('expenses').select('amount').eq('type', 'expense').eq('is_personal', false).eq('user_id', userId)
            if (start) q = q.gte('date', start)
            return q.lte('date', end)
        })(),
        // 3. Current Contacts (Pipeline)
        (supabase as any).from('contacts')
            .select('estimated_value')
            .not('status', 'in', '("won","lost")')
            .or(`created_by.eq.${userId},assigned_to.eq.${userId}`),
        // 4. Current Projects budget
        (supabase as any).from('projects')
            .select('budget')
            .eq('status', 'active')
            .eq('created_by', userId),
        // 5. Current Pending invoices
        (supabase as any).from('invoices')
            .select('total')
            .in('status', ['sent', 'overdue'])
            .or(`created_by.eq.${userId},issuer_profile_id.eq.${userId}`),
        // 6. Current Projects count
        supabase.from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('created_by', userId),

        // --- PREVIOUS PERIOD QUERIES ---

        // 7. Prev Income
        (async () => {
            if (!prevStart || !prevEnd) return { data: [] }
            return (supabase as any).from('expenses')
                .select('amount')
                .eq('type', 'income')
                .eq('user_id', userId)
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
                .eq('user_id', userId)
                .gte('date', prevStart)
                .lte('date', prevEnd)
        })(),
        // 9. Prev Pipeline (Approx: contacts created in previous period)
        (async () => {
            if (!prevStart || !prevEnd) return { data: [] }
            return (supabase as any).from('contacts')
                .select('estimated_value')
                .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
                .gte('created_at', prevStart)
                .lte('created_at', prevEnd)
        })(),
        // 10. Prev Projects (Approx: projects created in range)
        (async () => {
            if (!prevStart || !prevEnd) return { count: 0 }
            return supabase.from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', userId)
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
    const startDate = format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd')

    // 1. Fetch all records in range in just 2 queries, scoped to user
    const incomeQuery = (supabase as any).from('expenses')
            .select('amount, date')
            .eq('type', 'income')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
    const expenseQuery = (supabase as any).from('expenses')
            .select('amount, date')
            .eq('type', 'expense')
            .eq('is_personal', false)
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)

    const [incomeResult, expenseResult] = await Promise.all([
        incomeQuery,
        expenseQuery
    ])

    const incomeData = (incomeResult.data || []) as { amount: number, date: string }[]
    const expenseData = (expenseResult.data || []) as { amount: number, date: string }[]

    // 2. Aggregate in JS
    const results = Array.from({ length: months }, (_, i) => {
        const targetMonth = subMonths(now, i)
        const monthStart = startOfMonth(targetMonth)
        const monthEnd = endOfMonth(targetMonth)
        const monthLabel = format(targetMonth, 'MMM')

        const income = incomeData
            .filter(d => {
                const date = new Date(d.date)
                return date >= monthStart && date <= monthEnd
            })
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

        const expenses = expenseData
            .filter(d => {
                const date = new Date(d.date)
                return date >= monthStart && date <= monthEnd
            })
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

        return {
            month: monthLabel,
            income,
            expenses,
            sortKey: i
        }
    })

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

    // Get expenses with category info, scoped to user
    let query = supabase
        .from('expenses')
        .select(`
            amount,
            expense_categories ( name )
        `)
        .eq('type', 'expense')
        .eq('is_personal', false)
        .eq('user_id', userId)

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
        '#8b5cf6', // Brand Purple
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

    // Get active projects with client info, scoped to user
    const projectsQuery = (supabase as any)
        .from('projects')
        .select(`
            id,
            name,
            status,
            deadline,
            contacts ( company_name )
        `)
        .eq('status', 'active')
        .eq('created_by', userId)
        .order('deadline', { ascending: true })
        .limit(5)

    const { data: projects } = await projectsQuery as { data: { id: string; name: string; status: string; deadline: string | null; contacts: { company_name: string } | null }[] | null }

    if (!projects || projects.length === 0) {
        return []
    }

    const projectIds = projects.map(p => p.id)

    // 1. Fetch all tasks for these projects in one query
    const { data: allTasks } = await (supabase as any)
        .from('tasks')
        .select('project_id, is_completed')
        .in('project_id', projectIds)

    const tasks = (allTasks || []) as { project_id: string, is_completed: boolean }[]

    // 2. Aggregate in JS
    return projects.map((project) => {
        const projectTasks = tasks.filter(t => t.project_id === project.id)
        const total = projectTasks.length
        const completed = projectTasks.filter(t => t.is_completed).length
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
}

/**
 * Get recent leads with caching
 */
export async function getRecentLeads(userId: string) {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const query = (supabase
        .from('contacts')
        .select('*') as any)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('updated_at', { ascending: false })
        .limit(5)

    const { data } = await query

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

    const query = (supabase.from('tasks') as any)
        .select(`
            id, title, priority, due_date, is_completed,
            projects ( name, contacts ( company_name ) )
        `)
        .eq('is_completed', false)
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(6)

    let { data } = await query

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

    // 2. Get KPIs
    const kpis = await getExecutiveKPIs(userId, '30d')

    // 3. Get Context Data, scoped to user
    const recentLeadsQuery = (supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true }) as any)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .gt('created_at', format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
    const highPrioTasksQuery = supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', false)
        .eq('assigned_to', userId)
        .in('priority', ['high', 'urgent'])

    const [recentLeads, highPrioTasks] = await Promise.all([
        recentLeadsQuery,
        highPrioTasksQuery
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

// ============================================
// NEW V2 ANALYTICS
// ============================================

export interface ExecutiveAlerts {
    overdueInvoices: { count: number; total: number }
    inactiveLeads: { count: number; lostValue: number }
    overdueTasks: { count: number }
    upcomingTasks: { count: number }
}

export async function getExecutiveAlerts(userId: string): Promise<ExecutiveAlerts> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = format(subMonths(new Date(), 1), 'yyyy-MM-dd')
    const sevenDaysAhead = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')

    const [overdueInvs, inactiveLeads, overdueTasks, upcomingTasks] = await Promise.all([
        // Overdue invoices (status sent and due_date < today, or status overdue)
        (supabase.from('invoices') as any)
            .select('total')
            .or(`created_by.eq.${userId},issuer_profile_id.eq.${userId}`)
            .or(`status.eq.overdue,and(status.eq.sent,due_date.lt.${today})`),
        // Inactive leads (active status, no interaction in 30+ days)
        (supabase.from('contacts') as any)
            .select('estimated_value')
            .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
            .not('status', 'in', '("won","lost")')
            .or(`last_interaction.is.null,last_interaction.lt.${thirtyDaysAgo}`),
        // Overdue tasks
        supabase.from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', userId)
            .eq('is_completed', false)
            .lt('due_date', today),
        // Upcoming tasks (next 7 days)
        supabase.from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', userId)
            .eq('is_completed', false)
            .gte('due_date', today)
            .lte('due_date', sevenDaysAhead),
    ])

    const overdueData = (overdueInvs.data || []) as { total: number }[]
    const inactiveData = (inactiveLeads.data || []) as { estimated_value: number }[]

    return {
        overdueInvoices: {
            count: overdueData.length,
            total: overdueData.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        },
        inactiveLeads: {
            count: inactiveData.length,
            lostValue: inactiveData.reduce((sum, c) => sum + Number(c.estimated_value || 0), 0),
        },
        overdueTasks: { count: overdueTasks.count || 0 },
        upcomingTasks: { count: upcomingTasks.count || 0 },
    }
}

export interface ConversionMetrics {
    winRate: number             // % of closed deals that were won
    avgDealCycleDays: number    // avg days from created_at to won status (won deals only)
    totalWon: number
    totalLost: number
    totalActive: number
}

export async function getConversionMetrics(userId: string): Promise<ConversionMetrics> {
    'use cache'
    cacheLife('hours')

    const supabase = createAdminClient()

    const { data } = await (supabase.from('contacts') as any)
        .select('status, created_at, updated_at')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)

    const rows = (data || []) as { status: string; created_at: string; updated_at: string }[]

    const won = rows.filter(r => r.status === 'won')
    const lost = rows.filter(r => r.status === 'lost')
    const active = rows.filter(r => !['won', 'lost'].includes(r.status))
    const closed = won.length + lost.length
    const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0

    const cycleDays = won.length > 0
        ? won.reduce((sum, deal) => {
            const start = new Date(deal.created_at).getTime()
            const end = new Date(deal.updated_at).getTime()
            return sum + Math.max(0, (end - start) / 86400000)
        }, 0) / won.length
        : 0

    return {
        winRate,
        avgDealCycleDays: Math.round(cycleDays),
        totalWon: won.length,
        totalLost: lost.length,
        totalActive: active.length,
    }
}

export interface InvoiceAging {
    current: { count: number; total: number }      // not yet due
    overdue30: { count: number; total: number }    // 1-30 days
    overdue60: { count: number; total: number }    // 31-60
    overdue90: { count: number; total: number }    // 61-90
    overdue90plus: { count: number; total: number } // 90+
}

export async function getInvoiceAging(userId: string): Promise<InvoiceAging> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const { data } = await (supabase.from('invoices') as any)
        .select('total, due_date, status')
        .or(`created_by.eq.${userId},issuer_profile_id.eq.${userId}`)
        .in('status', ['sent', 'overdue'])

    const rows = (data || []) as { total: number; due_date: string; status: string }[]
    const today = new Date()
    const aging: InvoiceAging = {
        current: { count: 0, total: 0 },
        overdue30: { count: 0, total: 0 },
        overdue60: { count: 0, total: 0 },
        overdue90: { count: 0, total: 0 },
        overdue90plus: { count: 0, total: 0 },
    }

    for (const inv of rows) {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null
        const total = Number(inv.total || 0)
        if (!dueDate) {
            aging.current.count++
            aging.current.total += total
            continue
        }
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86400000)

        if (daysOverdue <= 0) { aging.current.count++; aging.current.total += total }
        else if (daysOverdue <= 30) { aging.overdue30.count++; aging.overdue30.total += total }
        else if (daysOverdue <= 60) { aging.overdue60.count++; aging.overdue60.total += total }
        else if (daysOverdue <= 90) { aging.overdue90.count++; aging.overdue90.total += total }
        else { aging.overdue90plus.count++; aging.overdue90plus.total += total }
    }

    return aging
}

export interface TopDeal {
    id: string
    company_name: string
    contact_name: string | null
    estimated_value: number
    probability_close: number
    pipeline_stage: string
    last_interaction: string | null
}

export async function getTopDeals(userId: string, limit: number = 5): Promise<TopDeal[]> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const { data } = await (supabase.from('contacts') as any)
        .select('id, company_name, contact_name, estimated_value, probability_close, pipeline_stage, last_interaction')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .not('status', 'in', '("won","lost")')
        .not('estimated_value', 'is', null)
        .order('estimated_value', { ascending: false })
        .limit(limit)

    return (data || []) as TopDeal[]
}

export interface CashForecast {
    next30: number       // Sum of sent/overdue invoices due in next 30 days
    next60: number       // 30-60 days
    next90: number       // 60-90 days
    weightedPipeline: number   // Sum of estimated_value * probability_close
}

export async function getCashForecast(userId: string): Promise<CashForecast> {
    'use cache'
    cacheLife('minutes')

    const supabase = createAdminClient()
    const today = new Date()
    const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]
    const in60 = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0]
    const in90 = new Date(today.getTime() + 90 * 86400000).toISOString().split('T')[0]

    const [invs, contacts] = await Promise.all([
        (supabase.from('invoices') as any)
            .select('total, due_date')
            .or(`created_by.eq.${userId},issuer_profile_id.eq.${userId}`)
            .in('status', ['sent', 'overdue'])
            .gte('due_date', today.toISOString().split('T')[0])
            .lte('due_date', in90),
        (supabase.from('contacts') as any)
            .select('estimated_value, probability_close')
            .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
            .not('status', 'in', '("won","lost")'),
    ])

    const invoiceRows = (invs.data || []) as { total: number; due_date: string }[]
    let next30 = 0, next60 = 0, next90 = 0
    for (const inv of invoiceRows) {
        const dueDate = inv.due_date
        const total = Number(inv.total || 0)
        if (dueDate <= in30) next30 += total
        else if (dueDate <= in60) next60 += total
        else if (dueDate <= in90) next90 += total
    }

    const contactRows = (contacts.data || []) as { estimated_value: number; probability_close: number }[]
    const weighted = contactRows.reduce((sum, c) =>
        sum + (Number(c.estimated_value || 0) * (Number(c.probability_close || 0) / 100)), 0)

    return { next30, next60, next90, weightedPipeline: Math.round(weighted) }
}
