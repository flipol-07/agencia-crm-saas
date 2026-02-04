'use client'

import { TASK_STATUSES } from '@/types/database'
import type { TaskStatus } from '@/types/database'

interface TaskStatusBadgeProps {
    status: TaskStatus
    size?: 'sm' | 'md'
}

const statusColors: Record<TaskStatus, string> = {
    todo: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
    done: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30',
}

export function TaskStatusBadge({ status, size = 'sm' }: TaskStatusBadgeProps) {
    const statusConfig = TASK_STATUSES.find(s => s.id === status)

    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-0.5'
        : 'text-sm px-3 py-1'

    return (
        <span
            className={`${sizeClasses} rounded-full border ${statusColors[status]} inline-flex items-center gap-1`}
        >
            <span>{statusConfig?.icon}</span>
            <span>{statusConfig?.label}</span>
        </span>
    )
}
