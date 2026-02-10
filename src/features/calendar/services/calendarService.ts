
import { createClient } from '@/lib/supabase/client'
import { CalendarEvent, Event, Meeting, Task, EventInsert, MeetingInsert } from '../types'
import { addHours, parseISO } from 'date-fns'

export const calendarService = {
    async getCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
        const supabase = createClient()

        try {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayIso = todayStart.toISOString()

            // Fetch generic events (only upcoming ones)
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .not('status', 'in', '("completed", "deleted")')
                .gte('start_time', todayIso)
                .lte('end_time', end.toISOString())

            if (eventsError) throw eventsError

            // Fetch meetings (only upcoming ones as requested)
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('meetings')
                .select('*, contacts(company_name, contact_name)')
                .not('status', 'in', '("completed", "deleted")')
                .gte('date', todayIso)
                .lte('date', end.toISOString())

            if (meetingsError) throw meetingsError

            // Fetch tasks with due dates (only upcoming ones)
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*, projects(name), contacts(company_name)')
                .not('due_date', 'is', null)
                .not('status', 'in', '("completed", "deleted")')
                .gte('due_date', todayIso)
                .lte('due_date', end.toISOString())

            if (tasksError) throw tasksError

            // Map Events
            const mappedEvents: CalendarEvent[] = (eventsData || []).map((event: Event) => ({
                id: event.id,
                title: event.title,
                start: parseISO(event.start_time),
                end: parseISO(event.end_time),
                allDay: event.all_day || false,
                type: 'event',
                color: event.color || 'blue',
                description: event.description,
                originalData: event
            }))

            // Map Meetings
            const mappedMeetings: CalendarEvent[] = (meetingsData || []).map((meeting: any) => ({
                id: meeting.id,
                title: `Meeting: ${meeting.title}`,
                start: parseISO(meeting.date),
                end: addHours(parseISO(meeting.date), 1), // Default 1 hour duration
                allDay: false,
                type: 'meeting',
                color: 'purple',
                description: meeting.summary || (meeting.contacts ? `With ${meeting.contacts.contact_name || meeting.contacts.company_name}` : ''),
                url: meeting.meeting_url,
                originalData: meeting
            }))

            // Map Tasks
            const mappedTasks: CalendarEvent[] = (tasksData || []).map((task: any) => ({
                id: task.id,
                title: `Task: ${task.title}`,
                start: parseISO(task.due_date!), // ! safe because of filter
                end: addHours(parseISO(task.due_date!), 1),
                allDay: false, // Could be true if we treated tasks as all day
                type: 'task',
                color: task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'green',
                status: task.status,
                priority: task.priority,
                description: task.description,
                originalData: task
            }))

            return [...mappedEvents, ...mappedMeetings, ...mappedTasks]
        } catch (error) {
            console.error('calendarService: getCalendarEvents error:', error)
            throw error
        }
    },

    async createEvent(event: EventInsert) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async createMeeting(meeting: MeetingInsert, attendeeEmails: string[] = [], options?: { select?: string, skipMeetingUrl?: boolean }) {
        const supabase = createClient()

        // Simplify link generation to avoid compilation hangs in client bundle
        const meetingId = `Aurie-${Math.random().toString(36).substring(7)}`
        // const meetingUrl = `https://meet.jit.si/${meetingId}` // Unused

        const payload: any = {
            ...meeting,
            attendees: attendeeEmails,
            status: 'scheduled'
        }

        // Add meeting_url unless explicitly skipped
        if (!options?.skipMeetingUrl) {
            payload.meeting_url = meeting.meeting_url || `https://meet.jit.si/Aurie-${Math.random().toString(36).substring(7)}`
        }

        const { data, error } = await supabase
            .from('meetings')
            .insert(payload)
            .select(options?.select || '*')
            .single()

        if (error) throw error

        // Invitation logic moved to background or handled elsewhere if possible
        // For now we just return the data to resolve the rendering hang
        return data
    },

    async deleteEvent(id: string) {
        const supabase = createClient()
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) throw error
    },

    async deleteMeeting(id: string) {
        const supabase = createClient()
        const { error } = await supabase.from('meetings').delete().eq('id', id)
        if (error) throw error
    }
}
