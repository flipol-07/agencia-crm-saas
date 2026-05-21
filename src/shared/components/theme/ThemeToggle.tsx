'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className }: { className?: string }) {
    const { mode, toggle } = useTheme()
    const isDark = mode === 'dark'

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--divider)] text-[var(--ink-500)] hover:text-[var(--ink-700)] hover:bg-[var(--bg-3)] hover:border-[var(--divider-strong)] transition-colors ${className || ''}`}
        >
            {isDark ? (
                /* sun icon */
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
            ) : (
                /* moon icon */
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
            )}
        </button>
    )
}
