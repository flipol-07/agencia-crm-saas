'use client'

import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { TASK_STATUSES } from '@/types/database'
import type { Task, TaskStatus } from '@/types/database'

function TaskCard({ task, isOverlay = false }: { task: Task, isOverlay?: boolean }) {
    const priorityColors: Record<string, string> = {
        low: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
        medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        urgent: 'bg-red-500/10 text-red-400 border border-red-500/20',
    }

    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl p-3 hover:border-lime-400/30 transition-all cursor-grab active:cursor-grabbing group select-none ${isOverlay ? 'shadow-2xl bg-zinc-800 border-lime-500/50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium leading-snug ${task.is_completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {task.title}
                </p>
            </div>

            <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>
                    {task.priority}
                </span>

                {task.due_date && (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                )}
            </div>
        </div>
    )
}

function DraggableTask({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <TaskCard task={task} />
        </div>
    )
}

function KanbanColumn({
    stage,
    stageId,
    tasks,
    color,
    icon,
    children
}: {
    stage: string
    stageId: string
    tasks: Task[]
    color: string
    icon: string
    children: React.ReactNode
}) {
    const { setNodeRef } = useDroppable({
        id: stageId,
    })

    const colorClasses: Record<string, string> = {
        gray: 'border-gray-500/20 bg-gray-500/5',
        blue: 'border-blue-500/20 bg-blue-500/5',
        purple: 'border-purple-500/20 bg-purple-500/5',
        amber: 'border-amber-500/20 bg-amber-500/5',
        lime: 'border-lime-500/20 bg-lime-500/5',
        red: 'border-red-500/20 bg-red-500/5',
    }

    const headerColors: Record<string, string> = {
        gray: 'text-gray-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        amber: 'text-amber-400',
        lime: 'text-lime-400',
        red: 'text-red-400',
    }

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col flex-1 min-w-[80vw] md:min-w-[250px] snap-center border rounded-xl ${colorClasses[color]} h-full transition-colors`}
        >
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <h3 className={`font-bold text-sm ${headerColors[color]}`}>{stage}</h3>
                </div>
                <span className="text-xs text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md font-mono">
                    {tasks.length}
                </span>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {children}
                {tasks.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-zinc-700 text-xs border border-dashed border-white/5 rounded-lg">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    )
}

interface TaskKanbanProps {
    tasks: Task[]
    onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export function TaskKanban({ tasks, onUpdateTask }: TaskKanbanProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
        // Fallback for tasks with undefined status or legacy 'is_completed' logic mapping could go here
        // For now, assume task.status is valid or map safely
        acc[status.id] = tasks.filter(t => {
            // If task has no status but is_completed is true -> map to done? 
            // Better executed in database migration, but here strictly generic:
            return t.status === status.id
        })
        return acc
    }, {} as Record<string, Task[]>)

    const handleDragStart = (event: DragStartEvent) => {
        const task = event.active.data.current?.task as Task
        setActiveTask(task)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const taskId = active.id as string
        const newStatus = over.id as TaskStatus

        const task = tasks.find(t => t.id === taskId)

        if (task && task.status !== newStatus) {
            // Optimistic / Direct update
            // Also update is_completed for compatibility
            const isCompleted = newStatus === 'done'
            try {
                await onUpdateTask(taskId, {
                    status: newStatus,
                    is_completed: isCompleted
                })
            } catch (error) {
                console.error("Failed to update task status", error)
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 min-h-[300px] w-full scrollbar-hide">
                {TASK_STATUSES.map(status => (
                    <KanbanColumn
                        key={status.id}
                        stage={status.label}
                        stageId={status.id}
                        color={status.color}
                        icon={status.icon || '📌'}
                        tasks={tasksByStatus[status.id] || []}
                    >
                        {tasksByStatus[status.id]?.map(task => (
                            <DraggableTask key={task.id} task={task} />
                        ))}
                    </KanbanColumn>
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="w-[var(--card-width)] opacity-90 rotate-2 cursor-grabbing">
                        <TaskCard task={activeTask} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
