'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
    children: React.ReactNode
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    return (
        <div className="relative inline-flex items-center">
            <div
                ref={triggerRef}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="cursor-help"
            >
                {children}
            </div>

            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} 
                        px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 
                        rounded-lg shadow-xl backdrop-blur-xl
                        animate-in fade-in duration-200
                        max-w-xs whitespace-normal`}
                >
                    {content}
                    {/* Arrow */}
                    <div className={`absolute w-2 h-2 bg-zinc-900 border-white/10 rotate-45 ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
                            position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
                                position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
                                    'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
                        }`} />
                </div>
            )}
        </div>
    )
}

// Icon helper for info tooltips
export function InfoTooltip({ content, position = 'top' }: { content: string; position?: 'top' | 'bottom' | 'left' | 'right' }) {
    return (
        <Tooltip content={content} position={position}>
            <svg className="w-4 h-4 text-text-muted hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </Tooltip>
    )
}
