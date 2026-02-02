'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TaskStatusSelector } from './TaskStatusSelector'
import { TaskAssigneeAvatars } from './TaskAssigneeSelector'
import { TASK_PRIORITIES } from '@/types/database'
import type { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/database'

interface TaskCardProps {
    task: TaskWithDetails
    onOpen: () => void
    onStatusChange: (status: TaskStatus) => void
    className?: string
    style?: React.CSSProperties
}

export function TaskCard({
    task,
    onOpen,
    onStatusChange,
    className = '',
    style
}: TaskCardProps) {
    const [isStatusOpen, setIsStatusOpen] = useState(false)
    const priority = TASK_PRIORITIES.find(p => p.id === task.priority)

    const priorityBadge: Record<TaskPriority, string> = {
        low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    }

    const priorityBorder: Record<TaskPriority, string> = {
        low: 'border-l-gray-500',
        medium: 'border-l-blue-500',
        high: 'border-l-amber-500',
        urgent: 'border-l-red-500',
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
    const commentCount = task.task_comments?.length || 0

    return (
        <div
            className={`glass rounded-lg p-4 border-l-4 ${priorityBorder[task.priority]} hover:bg-white/5 transition-all cursor-pointer group relative ${isStatusOpen ? 'z-50' : 'hover:z-50'} ${className}`}
            onClick={onOpen}
            style={style}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white truncate group-hover:text-lime-400 transition-colors">{task.title}</h3>
                        {commentCount > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                💬 {commentCount}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-sm mb-3">
                        {task.projects && (
                            <>
                                <Link
                                    href={`/contacts/${task.projects.contact_id}`}
                                    className="text-gray-400 hover:text-lime-400 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    🏢 {task.projects.contacts?.company_name}
                                </Link>
                                <span className="text-gray-600">→</span>
                                <span className="text-gray-400">📋 {task.projects.name}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div onClick={(e) => e.stopPropagation()}>
                            <TaskStatusSelector
                                status={task.status}
                                onChange={onStatusChange}
                                onOpenChange={setIsStatusOpen}
                            />
                        </div>

                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityBadge[task.priority]}`}>
                            {priority?.label}
                        </span>

                        {task.due_date && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                                📅 {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                {isOverdue && <span className="text-red-500 font-semibold">!</span>}
                            </span>
                        )}

                        <div className="ml-auto">
                            <TaskAssigneeAvatars assignees={task.task_assignees} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
