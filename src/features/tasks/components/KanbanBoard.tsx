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
import { TaskCard } from './TaskCard'
import { TASK_STATUSES } from '@/types/database'
import type { TaskWithDetails, TaskStatus } from '@/types/database'

interface KanbanBoardProps {
    tasks: TaskWithDetails[]
    onOpenTask: (task: TaskWithDetails) => void
    onStatusChange: (taskId: string, status: TaskStatus) => void
}

// Draggable Wrapper
function DraggableTask({ task, children }: { task: TaskWithDetails, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    )
}

// Droppable Column
function KanbanColumn({
    status,
    tasks,
    children
}: {
    status: TaskStatus
    tasks: TaskWithDetails[]
    children: React.ReactNode
}) {
    const { setNodeRef } = useDroppable({
        id: status,
    })

    const config = TASK_STATUSES.find(s => s.id === status)
    if (!config) return null

    const statusBorderColors: Record<TaskStatus, string> = {
        todo: 'border-t-gray-500',
        in_progress: 'border-t-blue-500',
        in_review: 'border-t-purple-500',
        blocked: 'border-t-red-500',
        done: 'border-t-lime-500',
    }

    return (
        <div
            ref={setNodeRef}
            className={`glass rounded-xl border-t-4 ${statusBorderColors[status]} p-4 flex flex-col h-full`}
        >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="ml-auto text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto min-h-[100px]">
                {children}
                {tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center p-4 border border-dashed border-white/5 rounded-lg">
                        <p className="text-gray-600 text-xs">Arrastra aquí</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export function KanbanBoard({ tasks, onOpenTask, onStatusChange }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null)
    const [showCompleted, setShowCompleted] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        })
    )

    const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'blocked']
    if (showCompleted) {
        statusOrder.push('done')
    }

    const filteredTasks = tasks.filter(t => showCompleted || t.status !== 'done')

    const grouped = statusOrder.reduce((acc, status) => {
        acc[status] = filteredTasks.filter(t => t.status === status)
        return acc
    }, {} as Record<TaskStatus, TaskWithDetails[]>)

    const handleDragStart = (event: DragStartEvent) => {
        const task = event.active.data.current?.task as TaskWithDetails
        setActiveTask(task)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        setActiveTask(null)

        if (!over) return

        const taskId = active.id as string
        const newStatus = over.id as TaskStatus
        const currentTask = tasks.find(t => t.id === taskId)

        if (currentTask && currentTask.status !== newStatus) {
            onStatusChange(taskId, newStatus)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showCompleted
                            ? 'bg-lime-500/20 text-lime-400 border-lime-500/30'
                            : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                        }`}
                >
                    {showCompleted ? 'Ocultar completadas' : 'Mostrar completadas'}
                </button>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
                    {statusOrder.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={grouped[status] || []}
                        >
                            {grouped[status]?.map(task => (
                                <DraggableTask key={task.id} task={task}>
                                    <div className="bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        {/* Simplified card inside draggable, or full card */}
                                        <div
                                            onClick={() => onOpenTask(task)}
                                            className="p-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' :
                                                        task.priority === 'high' ? 'bg-amber-500' :
                                                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                                                    }`} />
                                                <h4 className="font-medium text-white text-sm line-clamp-2">{task.title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2 truncate">
                                                {task.projects?.contacts?.company_name}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                {task.due_date && (
                                                    <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-gray-500'}`}>
                                                        {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </DraggableTask>
                            ))}
                        </KanbanColumn>
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="w-[300px] opacity-90 rotate-3 cursor-grabbing">
                            <TaskCard
                                task={activeTask}
                                onOpen={() => { }}
                                onStatusChange={() => { }}
                                className="bg-[#1a1a1a] shadow-2xl border-lime-500/50"
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
