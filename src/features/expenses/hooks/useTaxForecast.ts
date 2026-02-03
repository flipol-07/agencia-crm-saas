'use client'

import { useState, useEffect } from 'react'

interface TaxForecast {
    iva_repercutido: number
    iva_soportado: number
    iva_resultado: number
    quarter: number
    year: number
}

// Importar la acción de servidor
import { getTaxForecastAction } from '@/features/expenses/actions/taxActions'

export function useTaxForecast() {
    const [data, setData] = useState<TaxForecast | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = async () => {
        setIsLoading(true)
        try {
            const result = await getTaxForecastAction()
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar previsión fiscal')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return { data, isLoading, error, refresh }
}
