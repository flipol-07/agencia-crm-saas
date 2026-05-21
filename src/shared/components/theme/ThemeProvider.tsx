'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type ThemeMode = 'dark' | 'light'

interface ThemeContextValue {
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'aurie-theme-mode'

function applyToBody(mode: ThemeMode) {
    if (typeof document === 'undefined') return
    document.body.setAttribute('data-mode', mode)
    document.body.setAttribute('data-brand', 'aurie')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>('dark')

    useEffect(() => {
        const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'dark'
        setModeState(stored)
        applyToBody(stored)
    }, [])

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next)
        localStorage.setItem(STORAGE_KEY, next)
        applyToBody(next)
    }, [])

    const toggle = useCallback(() => {
        setMode(mode === 'dark' ? 'light' : 'dark')
    }, [mode, setMode])

    return (
        <ThemeContext.Provider value={{ mode, setMode, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        // Fallback for components rendered outside the provider during SSR
        return {
            mode: 'dark' as ThemeMode,
            setMode: () => {},
            toggle: () => {},
        }
    }
    return ctx
}
