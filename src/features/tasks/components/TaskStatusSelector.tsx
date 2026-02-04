'use client'

import { useState, useRef, useEffect } from 'react'
import { TASK_STATUSES } from '@/types/database'
import type { TaskStatus } from '@/types/database'

interface TaskStatusSelectorProps {
    status: TaskStatus
    onChange: (status: TaskStatus) => void
    disabled?: boolean
    onOpenChange?: (isOpen: boolean) => void
}

const statusColors: Record<TaskStatus, { bg: string; hover: string; border: string }> = {
    todo: { bg: 'bg-gray-500/20', hover: 'hover:bg-gray-500/30', border: 'border-gray-500/30' },
    in_progress: { bg: 'bg-blue-500/20', hover: 'hover:bg-blue-500/30', border: 'border-blue-500/30' },
    in_review: { bg: 'bg-purple-500/20', hover: 'hover:bg-purple-500/30', border: 'border-purple-500/30' },
    blocked: { bg: 'bg-red-500/20', hover: 'hover:bg-red-500/30', border: 'border-red-500/30' },
    done: { bg: 'bg-[#8b5cf6]/20', hover: 'hover:bg-[#8b5cf6]/30', border: 'border-[#8b5cf6]/30' },
}

export function TaskStatusSelector({ status, onChange, disabled, onOpenChange }: TaskStatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentStatus = TASK_STATUSES.find(s => s.id === status)

    useEffect(() => {
        onOpenChange?.(isOpen)
    }, [isOpen, onOpenChange])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (newStatus: TaskStatus) => {
        if (newStatus !== status) {
            onChange(newStatus)
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all
                    ${statusColors[status].bg} ${statusColors[status].border} ${statusColors[status].hover}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span>{currentStatus?.icon}</span>
                <span>{currentStatus?.label}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {TASK_STATUSES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleSelect(s.id as TaskStatus)}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-all
                                ${s.id === status ? 'bg-white/10' : 'hover:bg-white/5'}
                            `}
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                            {s.id === status && (
                                <svg className="w-4 h-4 ml-auto text-[#8b5cf6]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
