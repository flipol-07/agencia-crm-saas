
import { useState, useEffect, useCallback } from 'react'
import { getSettings, upsertSettings } from '../services/settingsService'
import { Settings, SettingsUpdate } from '@/types/database'

export function useSettings() {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchSettings = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSettings()
            setSettings(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const saveSettings = async (updates: SettingsUpdate) => {
        setSaving(true)
        try {
            const updated = await upsertSettings(updates)
            setSettings(updated)
            return updated
        } catch (error) {
            console.error(error)
            throw error
        } finally {
            setSaving(false)
        }
    }

    return {
        settings,
        loading,
        saving,
        saveSettings,
        refetch: fetchSettings
    }
}
