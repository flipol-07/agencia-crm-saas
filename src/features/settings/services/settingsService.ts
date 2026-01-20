
import { createClient } from '@/lib/supabase/client'

export interface EvolutionConfig {
    baseUrl: string
    apiKey: string
    instanceName: string
}

export const settingsService = {
    async getEvolutionConfig(): Promise<EvolutionConfig | null> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'evolution_api_config')
            .single()

        if (error || !data) return null
        return data.value as EvolutionConfig
    },

    async saveEvolutionConfig(config: EvolutionConfig) {
        const supabase = createClient()

        // Upsert
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'evolution_api_config',
                value: config,
                updated_at: new Date().toISOString()
            })

        if (error) throw error
    }
}
