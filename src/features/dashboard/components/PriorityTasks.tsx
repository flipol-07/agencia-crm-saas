import Link from 'next/link'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { getPriorityTasks, type TaskWithProject } from '../services/dashboard.service'

export async function PriorityTasks({ userId }: { userId: string }) {
    const tasks = await getPriorityTasks(userId) as TaskWithProject[]
    const today = new Date().toISOString().split('T')[0]

    const getPriorityBadge = (priority: string, dueDate: string | null) => {
        const isOverdue = dueDate && dueDate < today

        if (isOverdue) {
            return <Badge variant="error">Vencida</Badge>
        }

        switch (priority) {
            case 'urgent':
                return <Badge variant="error">Urgente</Badge>
            case 'high':
                return <Badge variant="warning">Alta</Badge>
            case 'medium':
                return <Badge variant="info">Media</Badge>
            default:
                return <Badge variant="default">Baja</Badge>
        }
    }

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                    Tareas Pendientes
                </h3>
                <Link href="/tasks" className="text-xs text-text-muted hover:text-brand transition-colors">
                    Ver todas →
                </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-text-muted text-sm">¡Todo al día!</p>
                        <p className="text-text-muted/60 text-xs mt-1">No hay tareas pendientes</p>
                    </div>
                ) : (
                    tasks.map(task => {
                        const isOverdue = task.due_date && task.due_date < today

                        return (
                            <div
                                key={task.id}
                                className={`group p-4 rounded-xl border transition-all duration-300 ${isOverdue
                                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-text-primary text-sm line-clamp-1 group-hover:text-brand transition-colors">
                                        {task.title}
                                    </p>
                                    {getPriorityBadge(task.priority, task.due_date)}
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                        {task.projects?.contacts?.company_name || 'Sin cliente'}
                                    </span>
                                    <span className="text-xs text-text-muted">•</span>
                                    <span className="text-xs text-text-muted truncate">
                                        {task.projects?.name || 'Sin proyecto'}
                                    </span>
                                </div>

                                {task.due_date && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <p className={`text-xs flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-text-muted'}`}>
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
        </Card>
    )
}
