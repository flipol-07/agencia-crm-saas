'use client'

import { useState, useRef, useEffect } from 'react'
import { TASK_PRIORITIES } from '@/types/database'
import type { TaskPriority } from '@/types/database'

interface TaskPrioritySelectorProps {
    priority: TaskPriority
    onChange: (priority: TaskPriority) => void
    disabled?: boolean
}

const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string }> = {
    low: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' },
    medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
    high: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
    urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
}

export function TaskPrioritySelector({ priority, onChange, disabled }: TaskPrioritySelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentPriority = TASK_PRIORITIES.find(p => p.id === priority)
    const colors = priorityColors[priority]

    const handleSelect = (newPriority: TaskPriority) => {
        if (newPriority !== priority) {
            onChange(newPriority)
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50`}
            >
                <span>{currentPriority?.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {TASK_PRIORITIES.map((p) => {
                        const pColors = priorityColors[p.id as TaskPriority]
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleSelect(p.id as TaskPriority)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors ${p.id === priority ? 'bg-white/10' : ''}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${pColors.bg} ${pColors.border} border`} />
                                <span className={pColors.text}>{p.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
