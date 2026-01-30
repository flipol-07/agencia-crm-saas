import { createClient } from '@/lib/supabase/client'

export interface EngineMetrics {
    outreachVolume: number
    responseRate: number
    activeLeads: number
    pipelineValue: number
    pipelineWeightedValue: number
    cashVelocity: number
    stalledDealsCount: number
    avgDealValue: number
    funnel: { stage: string; count: number }[]
    hotLeads: { id: string; company_name: string; last_interaction: string; reason: string }[]
}

export const dashboardService = {
    async getEngineMetrics(): Promise<EngineMetrics> {
        const supabase = createClient()

        const { data, error } = await supabase.rpc('get_dashboard_engine_metrics')

        if (error) {
            console.error('Error fetching engine metrics:', error)
            throw error
        }

        return data as EngineMetrics
    }
}
