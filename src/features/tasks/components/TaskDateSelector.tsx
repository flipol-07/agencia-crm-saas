'use client'

import { useState, useRef, useEffect } from 'react'

interface DateSelectorProps {
    value: string | null
    onChange: (date: string | null) => void
    disabled?: boolean
}

// Opciones rápidas de fecha aproximada
const quickDates = [
    { label: 'Hoy', days: 0 },
    { label: 'Mañana', days: 1 },
    { label: 'Esta semana', days: 7 },
    { label: 'En 2 semanas', days: 14 },
    { label: 'Este mes', days: 30 },
    { label: 'Sin fecha', days: null },
]

export function TaskDateSelector({ value, onChange, disabled }: DateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [customDate, setCustomDate] = useState(value || '')
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

    useEffect(() => {
        setCustomDate(value || '')
    }, [value])

    const handleQuickDate = (days: number | null) => {
        if (days === null) {
            onChange(null)
        } else {
            const date = new Date()
            date.setDate(date.getDate() + days)
            onChange(date.toISOString().split('T')[0])
        }
        setIsOpen(false)
    }

    const handleCustomDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value
        setCustomDate(newDate)
        if (newDate) {
            onChange(newDate)
        }
    }

    const formatDisplayDate = (dateStr: string | null) => {
        if (!dateStr) return 'Sin fecha'
        const date = new Date(dateStr)
        const today = new Date()
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diff === 0) return '📅 Hoy'
        if (diff === 1) return '📅 Mañana'
        if (diff < 0) return `📅 ${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} (vencida)`
        return `📅 ${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    }

    const isOverdue = value && new Date(value) < new Date()

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm
                    ${isOverdue
                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                        : value
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:border-lime-400'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-lime-400'
                    }
                    disabled:opacity-50`}
            >
                <span>{formatDisplayDate(value)}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {/* Opciones rápidas */}
                    <div className="p-2 border-b border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">Fecha aproximada</p>
                        {quickDates.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => handleQuickDate(option.days)}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5 rounded transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Fecha concreta */}
                    <div className="p-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">Fecha concreta</p>
                        <input
                            type="date"
                            value={customDate}
                            onChange={handleCustomDate}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-lime-400"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
