import { Card } from '@/shared/components/ui/Card'
import Link from 'next/link'

interface ActionItem {
    id: string
    company_name: string
    last_interaction: string
    reason: 'response' | 'task' | 'stalled'
}

interface ActionListProps {
    items: ActionItem[]
    loading?: boolean
}

export function ActionList({ items, loading }: ActionListProps) {
    if (loading) {
        return <div className="h-48 animate-pulse bg-white/5 rounded-xl" />
    }

    return (
        <Card className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Action Center
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <p className="text-text-muted text-sm">No hay acciones críticas hoy. 🎯</p>
                    </div>
                ) : (
                    items.map(item => (
                        <Link
                            key={item.id}
                            href={`/contacts/${item.id}`}
                            className="block group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand/30 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-text-primary text-sm group-hover:text-brand transition-colors">
                                        {item.company_name}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">
                                        {item.reason === 'response' ? 'Ha respondido a tu email' : 'Requiere seguimiento'}
                                    </p>
                                </div>
                                <div className="text-[10px] text-brand uppercase font-bold tracking-wider">
                                    HOT
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </Card>
    )
}
