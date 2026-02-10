
// Manually defining types as generation failed to pick up new tables
export interface CalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    allDay: boolean
    type: 'event' | 'meeting' | 'task'
    color?: string
    description?: string | null
    url?: string | null
    status?: string
    priority?: string
    originalData: any
}

export interface Event {
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    all_day: boolean | null
    color: string | null
    user_id: string | null
    created_at: string | null
    updated_at: string | null
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>

export interface Meeting {
    id: string
    title: string
    date: string
    contact_id: string | null
    summary: string | null
    transcription?: string | null
    key_points?: string[] | null
    conclusions?: string[] | null
    feedback?: any | null
    external_id: string | null
    meeting_url: string | null
    attendees?: string[] | null
    user_id: string | null
    status?: string | null
    created_at: string | null
    updated_at: string | null
}

export type MeetingInsert = Omit<Meeting, 'id' | 'created_at' | 'updated_at'>

export interface Task {
    id: string
    title: string
    description: string | null
    priority: string | null
    status: string | null
    due_date: string | null
    project_id: string | null
    contact_id: string | null
    assigned_to: string | null
    is_completed: boolean | null
    completed_at: string | null
    user_id: string | null
    created_at: string | null
    updated_at: string | null
}
