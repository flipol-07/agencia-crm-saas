
import { ExecutiveKPIs } from '../services/dashboard.service'

export interface Recommendation {
    id: string
    type: 'success' | 'warning' | 'info' | 'critical'
    title: string
    message: string
    actionLabel?: string
    actionUrl?: string
}

export interface DashboardContext {
    role: string | null
    kpis: ExecutiveKPIs
    recentLeadsCount: number
    highPriorityTasksCount: number
}

export function generateRecommendations(context: DashboardContext): Recommendation[] {
    const { role, kpis, recentLeadsCount, highPriorityTasksCount } = context
    const recommendations: Recommendation[] = []

    const roleLower = role?.toLowerCase() || ''

    // --- REGLAS GENERALES (Para todos) ---

    // 1. Facturas Pendientes
    if (kpis.pendingInvoices > 0) {
        recommendations.push({
            id: 'pending-invoices',
            type: 'warning',
            title: 'Facturación Pendiente',
            message: `Tienes ${kpis.pendingInvoices}€ en facturas enviadas o vencidas sin cobrar.`,
            actionLabel: 'Ver Facturas',
            actionUrl: '/invoices?status=sent,overdue'
        })
    }

    // 2. Tareas Prioritarias acumuladas
    if (highPriorityTasksCount > 5) {
        recommendations.push({
            id: 'high-prio-tasks',
            type: 'critical',
            title: 'Sobrecarga de Tareas',
            message: `Tienes ${highPriorityTasksCount} tareas urgentes/altas acumuladas. Prioriza o delega.`,
            actionLabel: 'Ir al Tablero',
            actionUrl: '/tasks'
        })
    }

    // --- REGLAS POR ROL ---

    // ROL: VENTAS / COMERCIAL / SALES
    if (roleLower.includes('venta') || roleLower.includes('sales') || roleLower.includes('comercial')) {
        // Pipeline bajo
        if (kpis.pipelinePotential < 5000 && kpis.activeProjects < 3) {
            recommendations.push({
                id: 'sales-pipeline-low',
                type: 'info',
                title: 'Pipeline Bajo',
                message: 'Tu pipeline de ventas está bajo. Es momento de prospectar o reactivar leads antiguos.',
                actionLabel: 'Ver Leads',
                actionUrl: '/lead-scraper'
            })
        }

        // Leads recientes
        if (recentLeadsCount === 0) {
            recommendations.push({
                id: 'sales-no-leads',
                type: 'warning',
                title: 'Sin Movimiento Reciente',
                message: 'No has interactuado con leads recientemente.',
                actionLabel: 'Pipeline',
                actionUrl: '/pipeline'
            })
        }
    }

    // ROL: CEO / DUEÑO / FUNDADOR / ADMIN
    if (roleLower.includes('ceo') || roleLower.includes('dueño') || roleLower.includes('fundador') || roleLower.includes('admin') || roleLower === '') {
        // Beneficio Negativo
        if (kpis.netProfit < 0) {
            recommendations.push({
                id: 'ceo-negative-profit',
                type: 'critical',
                title: 'Atención Financiera',
                message: 'Tus gastos superan tus ingresos este mes. Revisa los gastos recurrentes.',
                actionLabel: 'Ver Gastos',
                actionUrl: '/expenses'
            })
        } else if (kpis.netProfit > 2000 && kpis.pendingInvoices === 0) {
            recommendations.push({
                id: 'ceo-good-profit',
                type: 'success',
                title: 'Buen Ritmo Financiero',
                message: 'Beneficio saludable y sin deuda pendiente. Buen momento para reinvertir.',
            })
        }
    }

    // ROL: DEVELOPER / TÉCNICO
    if (roleLower.includes('dev') || roleLower.includes('técnico') || roleLower.includes('programador')) {
        if (kpis.activeProjects > 2 && highPriorityTasksCount > 3) {
            recommendations.push({
                id: 'dev-overload',
                type: 'warning',
                title: 'Posible Cuello de Botella',
                message: 'Tienes múltiples proyectos activos y tareas urgentes.',
                actionLabel: 'Planificar Sprint',
                actionUrl: '/tasks'
            })
        }
    }

    return recommendations
}
