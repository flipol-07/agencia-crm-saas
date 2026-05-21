import Link from 'next/link'
import type { ExecutiveAlerts } from '../services/dashboard.service'

interface Props {
    alerts: ExecutiveAlerts
}

const formatCurrency = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function AlertsPanel({ alerts }: Props) {
    const items = [
        {
            visible: alerts.overdueInvoices.count > 0,
            href: '/invoices',
            tone: 'red',
            title: `${alerts.overdueInvoices.count} factura${alerts.overdueInvoices.count === 1 ? '' : 's'} vencida${alerts.overdueInvoices.count === 1 ? '' : 's'}`,
            subtitle: `${formatCurrency(alerts.overdueInvoices.total)} por cobrar`,
            cta: 'Revisar facturas',
            icon: '⚠️',
        },
        {
            visible: alerts.inactiveLeads.count > 0,
            href: '/contacts',
            tone: 'amber',
            title: `${alerts.inactiveLeads.count} lead${alerts.inactiveLeads.count === 1 ? '' : 's'} sin contacto +30d`,
            subtitle: `${formatCurrency(alerts.inactiveLeads.lostValue)} en riesgo`,
            cta: 'Reactivar',
            icon: '😴',
        },
        {
            visible: alerts.overdueTasks.count > 0,
            href: '/tasks',
            tone: 'red',
            title: `${alerts.overdueTasks.count} tarea${alerts.overdueTasks.count === 1 ? '' : 's'} atrasada${alerts.overdueTasks.count === 1 ? '' : 's'}`,
            subtitle: 'Acción inmediata requerida',
            cta: 'Ver tareas',
            icon: '🔥',
        },
        {
            visible: alerts.upcomingTasks.count > 0,
            href: '/tasks',
            tone: 'blue',
            title: `${alerts.upcomingTasks.count} tarea${alerts.upcomingTasks.count === 1 ? '' : 's'} esta semana`,
            subtitle: 'Próximos 7 días',
            cta: 'Planificar',
            icon: '📅',
        },
    ].filter(item => item.visible)

    if (items.length === 0) {
        return (
            <section>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center gap-4">
                    <div className="text-3xl">✨</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Todo bajo control</h3>
                        <p className="text-sm text-gray-400">Sin alertas críticas en este momento. Sigue así.</p>
                    </div>
                </div>
            </section>
        )
    }

    const toneClasses = (tone: string) => {
        switch (tone) {
            case 'red': return 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
            case 'amber': return 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
            case 'blue': return 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
            default: return 'border-white/10 bg-white/5 hover:bg-white/10'
        }
    }
    const ctaToneClasses = (tone: string) => {
        switch (tone) {
            case 'red': return 'text-red-300 group-hover:text-red-200'
            case 'amber': return 'text-amber-300 group-hover:text-amber-200'
            case 'blue': return 'text-blue-300 group-hover:text-blue-200'
            default: return 'text-gray-300 group-hover:text-white'
        }
    }

    return (
        <section>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-gradient-to-r from-red-500 to-transparent"></span>
                Atención Inmediata
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                    <Link
                        key={idx}
                        href={item.href}
                        className={`group block rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${toneClasses(item.tone)}`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl">{item.icon}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${ctaToneClasses(item.tone)}`}>{item.cta} →</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-xs text-gray-400">{item.subtitle}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
