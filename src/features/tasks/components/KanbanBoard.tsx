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
import { TaskAssigneeAvatars } from './TaskAssigneeSelector'
import { TASK_STATUSES } from '@/types/database'
import type { TaskWithDetails, TaskStatus } from '@/types/database'

interface KanbanBoardProps {
    tasks: TaskWithDetails[]
    onOpenTask: (task: TaskWithDetails) => void
    onStatusChange: (taskId: string, status: TaskStatus) => void
    showCompleted: boolean
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
            className={`glass rounded-xl border-t-4 ${statusBorderColors[status]} p-4 flex flex-col h-full min-w-[85vw] md:min-w-[320px] snap-center flex-1`}
        >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="ml-auto text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden min-h-[150px] scrollbar-hide">
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

export function KanbanBoard({ tasks, onOpenTask, onStatusChange, showCompleted }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null)

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
        <DndContext
            sensors={sensors}
            autoScroll={{
                acceleration: 0,
                interval: 5,
                layoutShiftCompensation: {
                    x: false,
                    y: false
                }
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 min-h-[calc(100vh-250px)] w-full scrollbar-hide">
                {statusOrder.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={grouped[status] || []}
                    >
                        {grouped[status]?.map(task => (
                            <DraggableTask key={task.id} task={task}>
                                <div className="bg-white/5 rounded-lg border border-white/5 hover:border-lime-500/30 hover:bg-white/10 transition-all">
                                    <div
                                        onClick={() => onOpenTask(task)}
                                        className="p-3 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-medium text-white text-sm line-clamp-2 leading-tight flex-1">{task.title}</h4>
                                            {task.task_comments && task.task_comments.length > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenTask(task);
                                                    }}
                                                    className="flex items-center gap-1 bg-white/10 hover:bg-lime-500/20 text-gray-400 hover:text-lime-400 px-1.5 py-0.5 rounded-full text-[10px] transition-colors whitespace-nowrap"
                                                >
                                                    💬 {task.task_comments.length}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                                                task.priority === 'high' ? 'bg-amber-500' :
                                                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`} />
                                            <p className="text-xs text-gray-500 truncate">
                                                {task.projects?.contacts?.company_name || 'Sin empresa'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            {task.due_date && (
                                                <span className={`text-[10px] flex items-center gap-1 ${new Date(task.due_date) < new Date() ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                                                    📅 {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                            <div className="ml-auto scale-75 origin-right">
                                                <TaskAssigneeAvatars assignees={task.task_assignees} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DraggableTask>
                        ))}
                    </KanbanColumn>
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div className="w-[280px] opacity-90 rotate-2 cursor-grabbing scrollbar-hide overflow-hidden pointer-events-none">
                        <TaskCard
                            task={activeTask}
                            onOpen={() => { }}
                            onStatusChange={() => { }}
                            className="bg-[#1a1a1a] shadow-2xl border-lime-500/50 scale-95"
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
