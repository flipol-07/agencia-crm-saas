'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function DevServiceWorkerCleaner() {
    useEffect(() => {
        // Solo ejecutar en desarrollo para limpiar SWs antiguos que causan conflictos
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                if (registrations.length > 0) {
                    console.warn('[Dev] Detectado Service Worker zombie en modo desarrollo. Limpiando...')

                    let cleaned = false
                    registrations.forEach(registration => {
                        registration.unregister().then(success => {
                            if (success) cleaned = true
                        })
                    })

                    if (cleaned) {
                        toast.warning('Service Worker limpiado. Recarga la página si ves errores extraños.')
                    }
                }
            })
        }
    }, [])

    return null
}
