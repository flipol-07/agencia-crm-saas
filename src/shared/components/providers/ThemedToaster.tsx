'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/shared/components/theme/ThemeProvider'

export function ThemedToaster() {
    const { mode } = useTheme()
    return <Toaster position="top-right" theme={mode} richColors closeButton />
}
