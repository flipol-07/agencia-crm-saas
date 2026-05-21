'use client'

import { useAuraStore } from '@/features/ai-assistant/store/aura-store'

const PROMPTS: { icon: string; label: string; message: string; tone: string }[] = [
    {
        icon: '⚡',
        label: '¿Qué hago ahora?',
        message: '¿Qué hago ahora? Haz una auditoría relámpago de mi CRM y dame mi TOP 3 de acciones inmediatas con justificación.',
        tone: 'purple',
    },
    {
        icon: '💰',
        label: 'Cobrar facturas',
        message: 'Revisa mis facturas vencidas y pendientes. Dame el plan exacto: a quién contactar primero, por qué, y qué decir.',
        tone: 'emerald',
    },
    {
        icon: '🔥',
        label: 'Leads calientes',
        message: 'Identifica mis leads más calientes ahora mismo (mayor probabilidad de cierre, alto valor estimado, interacción reciente). Sugiere el siguiente paso para cada uno.',
        tone: 'red',
    },
    {
        icon: '😴',
        label: 'Reactivar dormidos',
        message: 'Encuentra mis leads dormidos (>30 días sin contacto). Para cada uno, redacta un mensaje breve de reactivación adaptado al contexto del cliente.',
        tone: 'amber',
    },
    {
        icon: '📊',
        label: 'Resumen semanal',
        message: 'Hazme un resumen ejecutivo de la última semana: leads nuevos, facturas, tareas completadas, dinero entrado. ¿Qué tendencia ves?',
        tone: 'blue',
    },
    {
        icon: '🎯',
        label: 'Cerrar deals',
        message: 'De mis deals en propuesta o negociación, ¿cuáles están más cerca de cerrar y qué necesitan para hacerlo?',
        tone: 'purple',
    },
]

const toneClasses = (tone: string) => {
    switch (tone) {
        case 'purple': return 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 text-purple-200'
        case 'emerald': return 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-200'
        case 'red': return 'border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-200'
        case 'amber': return 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-200'
        case 'blue': return 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-blue-200'
        default: return 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
    }
}

export function AuraQuickPrompts() {
    const { triggerMessage, setIsOpen } = useAuraStore()

    const handleClick = (message: string) => {
        setIsOpen(true)
        triggerMessage(message)
    }

    return (
        <section>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-gradient-to-r from-purple-500 to-transparent"></span>
                Pregunta a Aura
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {PROMPTS.map(prompt => (
                    <button
                        key={prompt.label}
                        onClick={() => handleClick(prompt.message)}
                        className={`flex flex-col items-start gap-2 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 ${toneClasses(prompt.tone)}`}
                    >
                        <span className="text-xl">{prompt.icon}</span>
                        <span className="text-xs font-bold leading-tight text-left">{prompt.label}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}
