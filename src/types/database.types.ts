export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    avatar_url: string | null
                    birth_date: string | null
                    created_at: string
                    email: string
                    full_name: string | null
                    gender: string | null
                    height: number | null
                    id: string
                    level: string | null
                    main_styles: string[] | null
                    personal_records: Json | null
                    updated_at: string
                    weight: number | null
                }
                Insert: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string
                    email: string
                    full_name?: string | null
                    gender?: string | null
                    height?: number | null
                    id: string
                    level?: string | null
                    main_styles?: string[] | null
                    personal_records?: Json | null
                    updated_at?: string
                    weight?: number | null
                }
                Update: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string
                    email?: string
                    full_name?: string | null
                    gender?: string | null
                    height?: number | null
                    id?: string
                    level?: string | null
                    main_styles?: string[] | null
                    personal_records?: Json | null
                    updated_at?: string
                    weight?: number | null
                }
                Relationships: []
            }
            contacts: {
                Row: {
                    id: string
                    company_name: string
                    contact_name: string | null
                    email: string | null
                    phone: string | null
                    tax_id: string | null
                    tax_address: string | null
                    status: 'prospect' | 'qualified' | 'proposal' | 'won' | 'active' | 'maintenance' | 'lost'
                    pipeline_stage: string
                    pain_points: string[]
                    requirements: string[]
                    notes: string | null
                    assigned_to: string | null
                    source: 'inbound_whatsapp' | 'inbound_email' | 'outbound' | 'referral' | 'website' | 'other'
                    created_at: string
                    updated_at: string
                    created_by: string | null
                    estimated_value: number | null
                    website: string | null
                    ai_description: string | null
                    services: string[] | null
                    last_interaction: string | null
                }
                Insert: {
                    id?: string
                    company_name: string
                    contact_name?: string | null
                    email?: string | null
                    phone?: string | null
                    tax_id?: string | null
                    tax_address?: string | null
                    status?: 'prospect' | 'qualified' | 'proposal' | 'won' | 'active' | 'maintenance' | 'lost'
                    pipeline_stage?: string
                    pain_points?: string[]
                    requirements?: string[]
                    notes?: string | null
                    assigned_to?: string | null
                    source?: 'inbound_whatsapp' | 'inbound_email' | 'outbound' | 'referral' | 'website' | 'other'
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                    estimated_value?: number | null
                    website?: string | null
                    ai_description?: string | null
                    services?: string[] | null
                    last_interaction?: string | null
                }
                Update: {
                    id?: string
                    company_name?: string
                    contact_name?: string | null
                    email?: string | null
                    phone?: string | null
                    tax_id?: string | null
                    tax_address?: string | null
                    status?: 'prospect' | 'qualified' | 'proposal' | 'won' | 'active' | 'maintenance' | 'lost'
                    pipeline_stage?: string
                    pain_points?: string[]
                    requirements?: string[]
                    notes?: string | null
                    assigned_to?: string | null
                    source?: 'inbound_whatsapp' | 'inbound_email' | 'outbound' | 'referral' | 'website' | 'other'
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                    estimated_value?: number | null
                    website?: string | null
                    ai_description?: string | null
                    services?: string[] | null
                    last_interaction?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "contacts_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "contacts_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            contact_emails: {
                Row: {
                    id: string
                    contact_id: string
                    message_id: string
                    subject: string | null
                    snippet: string | null
                    from_email: string | null
                    to_email: string | null
                    direction: 'inbound' | 'outbound'
                    is_read: boolean
                    received_at: string | null
                    created_at: string
                    body_text: string | null
                    body_html: string | null
                }
                Insert: {
                    id?: string
                    contact_id: string
                    message_id: string
                    subject?: string | null
                    snippet?: string | null
                    from_email?: string | null
                    to_email?: string | null
                    direction?: 'inbound' | 'outbound'
                    is_read?: boolean
                    received_at?: string | null
                    created_at?: string
                    body_text?: string | null
                    body_html?: string | null
                }
                Update: {
                    id?: string
                    contact_id?: string
                    message_id?: string
                    subject?: string | null
                    snippet?: string | null
                    from_email?: string | null
                    to_email?: string | null
                    direction?: 'inbound' | 'outbound'
                    is_read?: boolean
                    received_at?: string | null
                    created_at?: string
                    body_text?: string | null
                    body_html?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "contact_emails_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            projects: {
                Row: {
                    id: string
                    contact_id: string
                    name: string
                    description: string | null
                    status: 'pending' | 'active' | 'on_hold' | 'completed' | 'cancelled'
                    start_date: string | null
                    deadline: string | null
                    completed_at: string | null
                    budget: number | null
                    initial_payment: number | null
                    initial_payment_date: string | null
                    final_payment: number | null
                    final_payment_date: string | null
                    created_at: string
                    updated_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    contact_id: string
                    name: string
                    description?: string | null
                    status?: 'pending' | 'active' | 'on_hold' | 'completed' | 'cancelled'
                    start_date?: string | null
                    deadline?: string | null
                    completed_at?: string | null
                    budget?: number | null
                    initial_payment?: number | null
                    initial_payment_date?: string | null
                    final_payment?: number | null
                    final_payment_date?: string | null
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    contact_id?: string
                    name?: string
                    description?: string | null
                    status?: 'pending' | 'active' | 'on_hold' | 'completed' | 'cancelled'
                    start_date?: string | null
                    deadline?: string | null
                    completed_at?: string | null
                    budget?: number | null
                    initial_payment?: number | null
                    initial_payment_date?: string | null
                    final_payment?: number | null
                    final_payment_date?: string | null
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            tasks: {
                Row: {
                    id: string
                    project_id: string
                    title: string
                    description: string | null
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    status: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
                    is_completed: boolean
                    completed_at: string | null
                    assigned_to: string | null
                    contact_id: string | null
                    due_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    title: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
                    is_completed?: boolean
                    completed_at?: string | null
                    assigned_to?: string | null
                    contact_id?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
                    is_completed?: boolean
                    completed_at?: string | null
                    assigned_to?: string | null
                    contact_id?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            messages: {
                Row: {
                    id: string
                    contact_id: string
                    content: string | null
                    media_url: string | null
                    direction: 'inbound' | 'outbound'
                    status: 'sent' | 'delivered' | 'read' | 'failed'
                    whatsapp_message_id: string | null
                    sender_name: string | null
                    sent_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    contact_id: string
                    content?: string | null
                    media_url?: string | null
                    direction: 'inbound' | 'outbound'
                    status: 'sent' | 'delivered' | 'read' | 'failed'
                    whatsapp_message_id?: string | null
                    sender_name?: string | null
                    sent_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    contact_id?: string
                    content?: string | null
                    media_url?: string | null
                    direction?: 'inbound' | 'outbound'
                    status?: 'sent' | 'delivered' | 'read' | 'failed'
                    whatsapp_message_id?: string | null
                    sender_name?: string | null
                    sent_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_sent_by_fkey"
                        columns: ["sent_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invoices: {
                Row: {
                    id: string
                    contact_id: string
                    project_id: string | null
                    invoice_number: string | null
                    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    issue_date: string
                    due_date: string | null
                    paid_date: string | null
                    currency: string
                    notes: string | null
                    subtotal: number
                    tax_rate: number
                    tax_amount: number
                    total: number
                    created_at: string
                    updated_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    contact_id: string
                    project_id?: string | null
                    invoice_number?: string | null
                    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    issue_date?: string
                    due_date?: string | null
                    paid_date?: string | null
                    currency?: string
                    notes?: string | null
                    subtotal?: number
                    tax_rate?: number
                    tax_amount?: number
                    total?: number
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    contact_id?: string
                    project_id?: string | null
                    invoice_number?: string | null
                    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    issue_date?: string
                    due_date?: string | null
                    paid_date?: string | null
                    currency?: string
                    notes?: string | null
                    subtotal?: number
                    tax_rate?: number
                    tax_amount?: number
                    total?: number
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            // ... more tables
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            contact_source: 'inbound_whatsapp' | 'inbound_email' | 'outbound' | 'referral' | 'website' | 'other'
            contact_status: 'prospect' | 'qualified' | 'proposal' | 'won' | 'active' | 'maintenance' | 'lost'
            invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
            message_direction: 'inbound' | 'outbound'
            message_status: 'sent' | 'delivered' | 'read' | 'failed'
            project_status: 'pending' | 'active' | 'on_hold' | 'completed' | 'cancelled'
            task_priority: 'low' | 'medium' | 'high' | 'urgent'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
