'use client'

import { useState, useEffect, useCallback } from 'react'
import { meetingService } from '../services/meetingService'
import { Meeting } from '../types'
import { toast } from 'sonner'

export function useMeetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true)
            const data = await meetingService.getMeetings()
            setMeetings(data)
        } catch (error: any) {
            console.error('Error fetching meetings:', JSON.stringify(error, null, 2))
            toast.error('Error al cargar las reuniones: ' + (error.message || 'Desconocido'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMeetings()
    }, [fetchMeetings])

    const deleteMeeting = async (id: string) => {
        try {
            await meetingService.deleteMeeting(id)
            setMeetings(prev => prev.filter(m => m.id !== id))
            toast.success('Reunión eliminada')
        } catch (error) {
            console.error('Error deleting meeting:', JSON.stringify(error, null, 2))
            toast.error('Error al eliminar la reunión')
        }
    }

    const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
        try {
            const updated = await meetingService.updateMeeting(id, updates)
            setMeetings(prev => prev.map(m => m.id === id ? updated : m))
            toast.success('Reunión actualizada')
            return updated
        } catch (error) {
            console.error('Error updating meeting:', JSON.stringify(error, null, 2))
            toast.error('Error al actualizar la reunión')
            throw error
        }
    }

    return {
        meetings,
        loading,
        refetch: fetchMeetings,
        deleteMeeting,
        updateMeeting
    }
}
