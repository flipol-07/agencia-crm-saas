
import { createClient } from '@/lib/supabase/client'
import { Settings, SettingsInsert, SettingsUpdate } from '@/types/database'

export const getSettings = async (): Promise<Settings | null> => {
    const supabase = createClient()

    // Asumimos que solo hay una configuración por proyecto/usuario por ahora.
    // O mejor, cogemos la primera que encontremos si no hay auth multi-tenant complejo aún.
    // En un futuro multi-tenant real, filtraríamos por organization_id.
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        console.error('Error fetching settings:', error)
        return null
    }

    return data
}

export const upsertSettings = async (settings: SettingsInsert | SettingsUpdate): Promise<Settings | null> => {
    const supabase = createClient()

    // Si ya existe ID, actualizamos. Si no, insertamos.
    // Como queremos solo UNA fila de settings por ahora, checkeamos si existe primero.

    let existingId = (settings as any).id

    if (!existingId) {
        const current = await getSettings()
        if (current) existingId = current.id
    }

    if (existingId) {
        const { data, error } = await supabase
            .from('settings')
            .update(settings as any)
            .eq('id', existingId)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    } else {
        const { data, error } = await supabase
            .from('settings')
            .insert(settings as any)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    }
}
