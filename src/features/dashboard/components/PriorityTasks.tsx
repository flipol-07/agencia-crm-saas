import Link from 'next/link'
import { Badge } from '@/shared/components/ui/Badge'
import { getPriorityTasks, type TaskWithProject } from '../services/dashboard.service'

export async function PriorityTasks({ userId }: { userId: string }) {
    const tasks = await getPriorityTasks(userId) as TaskWithProject[]
    const today = new Date().toISOString().split('T')[0]

    const getPriorityBadge = (priority: string, dueDate: string | null) => {
        const isOverdue = dueDate && dueDate < today

        if (isOverdue) {
            return <Badge variant="error" className="bg-red-500/10 text-red-500 border-red-500/20">Vencida</Badge>
        }

        switch (priority) {
            case 'urgent':
                return <Badge variant="error" className="bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Urgente</Badge>
            case 'high':
                return <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Alta</Badge>
            case 'medium':
                return <Badge variant="info" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Media</Badge>
            default:
                return <Badge variant="default" className="bg-white/5 text-gray-400 border-white/10">Baja</Badge>
        }
    }

    return (
        <div className="glass-card p-6 h-full flex flex-col rounded-2xl border border-white/5 relative overflow-hidden group">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Tareas Prioritarias
                </h3>
                <Link href="/tasks" className="text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                    Ver todas
                </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-green-500/20">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-white font-medium">¡Todo al día!</p>
                        <p className="text-gray-500 text-sm mt-1">No tienes tareas urgentes pendientes.</p>
                    </div>
                ) : (
                    tasks.map(task => {
                        const isOverdue = task.due_date && task.due_date < today

                        return (
                            <div
                                key={task.id}
                                className={`group/item p-4 rounded-xl border transition-all duration-300 ${isOverdue
                                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                    : 'bg-white/5 border-white/5 hover:border-brand-neon-blue/30 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-gray-200 text-sm line-clamp-1 group-hover/item:text-brand-neon-blue transition-colors">
                                        {task.title}
                                    </p>
                                    {getPriorityBadge(task.priority, task.due_date)}
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] uppercase font-semibold text-gray-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                                        {task.projects?.contacts?.company_name || 'Sin cliente'}
                                    </span>
                                    <span className="text-xs text-gray-600">•</span>
                                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                        {task.projects?.name || 'Sin proyecto'}
                                    </span>
                                </div>

                                {task.due_date && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <p className={`text-xs flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            {isOverdue && ' (Vencida)'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
