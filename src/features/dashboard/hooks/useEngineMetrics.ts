'use client'

import { useEffect, useState } from 'react'
import { dashboardService, type EngineMetrics } from '../services/dashboardService'

export function useEngineMetrics() {
    const [metrics, setMetrics] = useState<EngineMetrics>({
        outreachVolume: 0,
        responseRate: 0,
        activeLeads: 0,
        pipelineValue: 0,
        pipelineWeightedValue: 0,
        cashVelocity: 0,
        stalledDealsCount: 0,
        avgDealValue: 0,
        funnel: [],
        hotLeads: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const data = await dashboardService.getEngineMetrics()
                setMetrics(data)
            } catch (error) {
                console.error('Failed to load engine metrics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [])

    return { metrics, loading }
}
