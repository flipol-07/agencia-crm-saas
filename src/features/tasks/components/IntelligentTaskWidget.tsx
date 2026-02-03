'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TaskWithDetails, Profile } from '@/types/database'
import { TaskCard } from './TaskCard'

interface IntelligentTaskWidgetProps {
    tasks: TaskWithDetails[]
    userProfile: Profile | null
    onOpenTask: (task: TaskWithDetails) => void
}

export function IntelligentTaskWidget({ tasks, userProfile, onOpenTask }: IntelligentTaskWidgetProps) {
    const [isOpen, setIsOpen] = useState(true)

    // Prioritization Logic
    // Prioritization Logic
    const prioritizedTasks = useMemo(() => {
        const userId = userProfile?.id
        console.log('IntelligentWidget Debug:', { userId, tasksCount: tasks.length })

        // 1. Filter tasks: Assigned to user OR High/Urgent priority (global visibility)
        // 1. Filter tasks: Assigned to user OR High/Urgent priority (global visibility)
        const userTasks = tasks.filter(t => {
            if (t.status === 'done') return false

            const isAssigned = userId ? t.task_assignees.some(a => a.user_id === userId) : false
            const isImportant = t.priority === 'urgent' || t.priority === 'high'

            return isAssigned || isImportant
        })

        // 2. Score tasks
        const scoredTasks = userTasks.map(task => {
            let score = 0

            // Priority Score
            if (task.priority === 'urgent') score += 50
            if (task.priority === 'high') score += 30
            if (task.priority === 'medium') score += 10

            // Due Date Score
            if (task.due_date) {
                const due = new Date(task.due_date)
                const now = new Date()
                const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                if (diffDays < 0) score += 100 // Overdue!
                else if (diffDays === 0) score += 50 // Due today
                else if (diffDays <= 2) score += 20 // Due soon
            }

            // Role Match (Simple Keyword Matching)
            // If user has a professional role, check if title matches keywords
            if (userProfile?.professional_role) {
                const roleLower = userProfile.professional_role.toLowerCase()
                const titleLower = task.title.toLowerCase()

                // Example heuristics based on common roles
                if (roleLower.includes('developer') || roleLower.includes('dev')) {
                    if (titleLower.includes('fix') || titleLower.includes('bug') || titleLower.includes('api') || titleLower.includes('refactor')) {
                        score += 20
                    }
                } else if (roleLower.includes('designer') || roleLower.includes('ux')) {
                    if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('layout') || titleLower.includes('color')) {
                        score += 20
                    }
                } else if (roleLower.includes('sales') || roleLower.includes('ventas')) {
                    if (titleLower.includes('call') || titleLower.includes('client') || titleLower.includes('lead') || titleLower.includes('follow-up')) {
                        score += 20
                    }
                }
            }

            return { ...task, score }
        })

        // 3. Sort by score (desc) and take top 3
        return scoredTasks.sort((a, b) => b.score - a.score).slice(0, 3)
    }, [tasks, userProfile])

    if (prioritizedTasks.length === 0) return null

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg border border-white/10">
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Sugerencias IA
                            <span className="text-[10px] font-mono uppercase tracking-wider bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-1.5 py-0.5 rounded ml-1">Beta</span>
                        </h2>
                        <p className="text-xs text-gray-400">Basado en tu rol y prioridades</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                    {isOpen ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {prioritizedTasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative">
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className="text-[10px] font-bold bg-black/50 backdrop-blur text-white px-2 py-0.5 rounded-full border border-white/10">
                                            #{index + 1}
                                        </span>
                                    </div>
                                    <TaskCard
                                        task={task}
                                        onOpen={() => onOpenTask(task)}
                                        onStatusChange={() => { }} // Read-only view mostly
                                        className="bg-zinc-900/90 backdrop-blur-xl !border-white/10"
                                    />
                                    {(task as any).score > 100 && (
                                        <div className="absolute -top-2 -left-2 z-20">
                                            <span className="animate-bounce bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                                🔥 Crítico
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
