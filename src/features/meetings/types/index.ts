export interface Meeting {
    id: string
    title: string
    date: string
    contact_id: string | null
    summary: string | null
    transcription?: string | null
    key_points?: string[] | null
    conclusions?: string[] | null
    feedback?: {
        seller_feedback: { name: string, improvements: string[] }[]
        general_feedback: string | null
        customer_sentiment: string | null
    } | null
    attendees?: string[] | null
    meeting_url?: string | null
    external_id: string | null
    user_id: string
    created_at: string
    updated_at: string
    contacts?: {
        id: string
        company_name: string
        contact_name: string | null
    } | null
}

export type MeetingInsert = Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'contacts' | 'user_id'>

export interface MeetingStats {
    total_meetings: number
    this_month: number
    with_summary: number
}
