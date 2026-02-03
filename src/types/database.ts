export type Profile = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
    height?: number | null
    weight?: number | null
    gender?: string | null
    birth_date?: string | null
    level?: string | null
    main_styles?: string[] | null
    personal_records?: any | null
    billing_name?: string | null
    billing_tax_id?: string | null
    billing_address?: string | null
    invoice_prefix?: string | null
    next_invoice_number?: number | null
    billing_email?: string | null
    billing_phone?: string | null
    billing_iban?: string | null
    professional_role?: string | null
    professional_description?: string | null
}

// Enums de Contact
export type ContactStatus =
    | 'prospect'
    | 'qualified'
    | 'proposal'
    | 'won'
    | 'active'
    | 'maintenance'
    | 'lost'

export type ContactSource =
    | 'inbound_whatsapp'
    | 'inbound_email'
    | 'outbound'
    | 'referral'
    | 'website'
    | 'other'

// Contact interface
export interface Contact {
    id: string
    company_name: string
    contact_name: string | null
    email: string | null
    phone: string | null
    tax_id: string | null
    tax_address: string | null
    status: ContactStatus
    pipeline_stage: string
    pain_points: string[]
    requirements: string[]
    notes: string | null
    assigned_to: string | null
    source: ContactSource
    created_at: string
    updated_at: string
    created_by: string | null
    estimated_value: number | null
    website: string | null
    ai_description: string | null
    services: string[] | null
    last_interaction: string | null
    probability_close: number | null
    inactivity_status: 'active' | 'warning' | 'inactive' | null
    ai_suggestions: any[] | null // JSONB
    last_analyzed_at: string | null
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'created_at'>>

// Pipeline stages para el Kanban
export const PIPELINE_STAGES = [
    { id: 'nuevo', label: 'Nuevo', color: 'gray' },
    { id: 'cualificacion', label: 'Cualificación', color: 'blue' },
    { id: 'propuesta', label: 'Preparando Propuesta', color: 'purple' },
    { id: 'enviada', label: 'Propuesta Enviada', color: 'amber' },
    { id: 'ganado', label: 'Ganado', color: 'lime' },
    { id: 'perdido', label: 'Perdido', color: 'red' },
] as const

export type PipelineStageId = typeof PIPELINE_STAGES[number]['id']

// ============================================
// Contact Emails Types
// ============================================

export type EmailDirection = 'inbound' | 'outbound'

export interface ContactEmail {
    id: string
    contact_id: string
    message_id: string
    subject: string | null
    snippet: string | null
    from_email: string | null
    to_email: string | null
    direction: EmailDirection
    is_read: boolean
    received_at: string | null
    created_at: string
    body_text: string | null
    body_html: string | null
}

export type ContactEmailInsert = Omit<ContactEmail, 'id' | 'created_at'>
export type ContactEmailUpdate = Partial<Omit<ContactEmail, 'id' | 'created_at'>>

// ============================================
// Contact Files Types
// ============================================

export interface ContactFile {
    id: string
    contact_id: string
    name: string
    file_path: string
    file_size: number | null
    content_type: string | null
    created_at: string
    created_by: string | null
}

export type ContactFileInsert = Omit<ContactFile, 'id' | 'created_at'>
export type ContactFileUpdate = Partial<Omit<ContactFile, 'id' | 'created_at'>>

// ============================================
// Project Types
// ============================================

export type ProjectStatus =
    | 'pending'
    | 'active'
    | 'on_hold'
    | 'completed'
    | 'cancelled'

export interface Project {
    id: string
    contact_id: string
    name: string
    description: string | null
    status: ProjectStatus
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

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'created_at'>>

// Project con datos del cliente (para joins)
export interface ProjectWithContact extends Project {
    contacts: Pick<Contact, 'id' | 'company_name' | 'contact_name'>
}

// ============================================
// Task Types
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'

export interface Task {
    id: string
    project_id: string | null
    title: string
    description: string | null
    priority: TaskPriority
    status: TaskStatus
    is_completed: boolean  // Legacy, use status === 'done'
    completed_at: string | null
    assigned_to: string | null  // Legacy single assignee
    contact_id: string | null  // Direct client association
    due_date: string | null
    created_at: string
    updated_at: string
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at'>>

// Task con datos del proyecto y cliente (para joins)
export interface TaskWithProject extends Task {
    projects: (Pick<Project, 'id' | 'name' | 'contact_id'> & {
        contacts: Pick<Contact, 'id' | 'company_name'>
    }) | null
}

// Task con asignado (para joins)
export interface TaskWithAssignee extends Task {
    profiles: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}

// Priority labels y colores
export const TASK_PRIORITIES = [
    { id: 'low', label: 'Baja', color: 'gray' },
    { id: 'medium', label: 'Media', color: 'blue' },
    { id: 'high', label: 'Alta', color: 'amber' },
    { id: 'urgent', label: 'Urgente', color: 'red' },
] as const

// Status labels y colores
export const TASK_STATUSES = [
    { id: 'todo', label: 'Por hacer', color: 'gray', icon: '⏳' },
    { id: 'in_progress', label: 'En progreso', color: 'blue', icon: '▶️' },
    { id: 'in_review', label: 'En revisión', color: 'purple', icon: '👁️' },
    { id: 'blocked', label: 'Bloqueado', color: 'red', icon: '🚫' },
    { id: 'done', label: 'Completado', color: 'lime', icon: '✅' },
] as const

// Task Comment
export interface TaskComment {
    id: string
    task_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
}

export type TaskCommentInsert = Omit<TaskComment, 'id' | 'created_at' | 'updated_at'>
export type TaskCommentUpdate = Partial<Pick<TaskComment, 'content'>>

// Task Assignee (many-to-many)
export interface TaskAssignee {
    id: string
    task_id: string
    user_id: string
    created_at: string
}

// Task with assignees and comments
export interface TaskWithDetails extends Task {
    projects: (Pick<Project, 'id' | 'name' | 'contact_id'> & {
        contacts: Pick<Contact, 'id' | 'company_name'>
    }) | null
    task_assignees: (TaskAssignee & {
        profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
    })[]
    task_comments?: TaskComment[]
    contacts?: Pick<Contact, 'id' | 'company_name'> | null
}

// ============================================
// Message Types (Evolution API)
// ============================================

export type MessageDirection = 'inbound' | 'outbound'

export type MessageStatus =
    | 'sent'
    | 'delivered'
    | 'read'
    | 'failed'

export interface Message {
    id: string
    contact_id: string
    content: string | null
    media_url: string | null
    direction: MessageDirection
    status: MessageStatus
    whatsapp_message_id: string | null
    sender_name: string | null
    sent_by: string | null
    created_at: string
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'>
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at'>>

// ============================================
// Invoice Types
// ============================================

export type InvoiceStatus =
    | 'draft'
    | 'sent'
    | 'paid'
    | 'overdue'
    | 'cancelled'

export interface Invoice {
    id: string
    contact_id: string
    project_id: string | null
    invoice_number: string | null
    status: InvoiceStatus
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
    issuer_profile_id: string | null
    template_id: string | null
    config: InvoiceTemplateConfig | null
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
export type InvoiceUpdate = Partial<Omit<Invoice, 'id' | 'created_at'>>

export interface InvoiceItem {
    id: string
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    created_at: string
}

export type InvoiceItemInsert = Omit<InvoiceItem, 'id' | 'created_at'>
export type InvoiceItemUpdate = Partial<Omit<InvoiceItem, 'id' | 'created_at'>>

// Invoice con items y contacto (para detalle)
export interface InvoiceWithDetails extends Invoice {
    contacts: Pick<Contact, 'id' | 'company_name' | 'contact_name' | 'tax_id' | 'tax_address' | 'email' | 'phone'>
    invoice_items: InvoiceItem[]
}

// ============================================
// Settings Types
// ============================================

export interface Settings {
    id: string
    company_name: string | null
    tax_id: string | null
    address: string | null
    email: string | null
    phone: string | null
    website: string | null
    logo_url: string | null
    default_tax_rate: number
    currency: string
    created_at: string
    updated_at: string
}

export type SettingsInsert = Omit<Settings, 'id' | 'created_at' | 'updated_at'>
export type SettingsUpdate = Partial<Omit<Settings, 'id' | 'created_at'>>

// ============================================
// Invoice Template Types
// ============================================

export interface InvoiceElement {
    id: string
    type: 'text' | 'title' | 'image' | 'table' | 'issuer' | 'recipient' | 'total' | 'invoice_number' | 'date'
    x: number // positions in mm
    y: number
    width?: number
    height?: number
    content?: string
    fontSize?: number
    fontWeight?: string
    color?: string
    align?: 'left' | 'center' | 'right'
    fontFamily?: string
    src?: string // for images
    opacity?: number
    zIndex?: number
}

export interface InvoiceTemplateConfig {
    elements: InvoiceElement[]
    background_url?: string | null
    global_font?: string
}

export interface InvoiceTemplate {
    id: string
    name: string
    description: string | null
    config: InvoiceTemplateConfig
    max_items: number
    background_url: string | null
    is_default: boolean
    profile_id: string | null
    created_at: string
    updated_at: string
}

// ============================================
// Team Chat Types
// ============================================

export interface TeamChat {
    id: string
    created_at: string
    updated_at: string
    last_message_preview: string | null
    is_group: boolean
}

export interface TeamChatParticipant {
    chat_id: string
    user_id: string
    joined_at: string
}

export interface TeamMessage {
    id: string
    chat_id: string
    sender_id: string | null
    content: string
    created_at: string
    read_at: string | null
}

export interface TeamChatWithMembers extends TeamChat {
    participants: {
        profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
    }[]
}

// Database type para Supabase
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    height?: number | null
                    weight?: number | null
                    gender?: string | null
                    birth_date?: string | null
                    level?: string | null
                    main_styles?: string[] | null
                    personal_records?: any | null
                    billing_name?: string | null
                    billing_tax_id?: string | null
                    billing_address?: string | null
                    invoice_prefix?: string | null
                    next_invoice_number?: number | null
                    billing_email?: string | null
                    billing_phone?: string | null
                    billing_iban?: string | null
                    professional_role?: string | null
                    professional_description?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    height?: number | null
                    weight?: number | null
                    gender?: string | null
                    birth_date?: string | null
                    level?: string | null
                    main_styles?: string[] | null
                    personal_records?: any | null
                    billing_name?: string | null
                    billing_tax_id?: string | null
                    billing_address?: string | null
                    invoice_prefix?: string | null
                    next_invoice_number?: number | null
                    billing_email?: string | null
                    billing_phone?: string | null
                    billing_iban?: string | null
                    professional_role?: string | null
                    professional_description?: string | null
                }
                Relationships: []
            }
            contacts: {
                Row: Contact
                Insert: ContactInsert
                Update: ContactUpdate
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
                Row: ContactEmail
                Insert: ContactEmailInsert
                Update: ContactEmailUpdate
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
                Row: Project
                Insert: ProjectInsert
                Update: ProjectUpdate
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
                Row: Task
                Insert: TaskInsert
                Update: TaskUpdate
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
                Row: Message
                Insert: MessageInsert
                Update: MessageUpdate
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
            contact_files: {
                Row: ContactFile
                Insert: ContactFileInsert
                Update: ContactFileUpdate
                Relationships: [
                    {
                        foreignKeyName: "contact_files_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "contact_files_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invoices: {
                Row: Invoice
                Insert: InvoiceInsert & { issuer_profile_id?: string | null }
                Update: InvoiceUpdate & { issuer_profile_id?: string | null }
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
            invoice_items: {
                Row: InvoiceItem
                Insert: InvoiceItemInsert
                Update: InvoiceItemUpdate
                Relationships: [
                    {
                        foreignKeyName: "invoice_items_invoice_id_fkey"
                        columns: ["invoice_id"]
                        isOneToOne: false
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    }
                ]
            }
            settings: {
                Row: Settings
                Insert: SettingsInsert
                Update: SettingsUpdate
            }
            invoice_templates: {
                Row: InvoiceTemplate
                Insert: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>>
                Relationships: [
                    {
                        foreignKeyName: "invoice_templates_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            // Scraper Tables
            email_templates: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    html_content: string
                    description: string | null
                    is_default: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    name: string
                    html_content: string
                    description?: string | null
                    is_default?: boolean
                }
                Update: {
                    name?: string
                    html_content?: string
                    description?: string | null
                    is_default?: boolean
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "email_templates_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            scraper_campaigns: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    status: string
                    search_config: any
                    template_id: string | null
                    leads_count: number
                    emails_sent: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    name: string
                    status: string
                    search_config: any
                    template_id?: string | null
                    leads_count?: number
                    emails_sent?: number
                }
                Update: {
                    name?: string
                    status?: string
                    template_id?: string | null
                    leads_count?: number
                    emails_sent?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "scraper_campaigns_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            scraper_leads: {
                Row: {
                    id: string
                    campaign_id: string
                    nombre: string
                    categoria: string | null
                    direccion: string | null
                    ubicacion: string | null
                    telefono: string | null
                    email: string | null
                    website: string | null
                    rating: number | null
                    total_reviews: number | null
                    place_id: string | null
                    email_subject: string | null
                    email_html: string | null
                    email_status: 'pending' | 'generated' | 'sent' | 'error'
                    sent_at: string | null
                    created_at: string
                }
                Insert: {
                    campaign_id: string
                    nombre: string
                    categoria?: string | null
                    direccion?: string | null
                    ubicacion?: string | null
                    telefono?: string | null
                    email?: string | null
                    website?: string | null
                    rating?: number | null
                    total_reviews?: number | null
                    place_id?: string | null
                    email_status?: 'pending' | 'generated' | 'sent' | 'error'
                }
                Update: {
                    email_subject?: string | null
                    email_html?: string | null
                    email_status?: 'pending' | 'generated' | 'sent' | 'error'
                    sent_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "scraper_leads_campaign_id_fkey"
                        columns: ["campaign_id"]
                        isOneToOne: false
                        referencedRelation: "scraper_campaigns"
                        referencedColumns: ["id"]
                    }
                ]
            }
            team_chats: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    last_message_preview: string | null
                    is_group: boolean
                }
                Insert: {
                    last_message_preview?: string | null
                    is_group?: boolean
                }
                Update: {
                    updated_at?: string
                    last_message_preview?: string | null
                    is_group?: boolean
                }
            }
            team_chat_participants: {
                Row: {
                    chat_id: string
                    user_id: string
                    joined_at: string
                }
                Insert: {
                    chat_id: string
                    user_id: string
                }
                Update: {
                    joined_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_chat_participants_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "team_chats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_chat_participants_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            team_messages: {
                Row: {
                    id: string
                    chat_id: string
                    sender_id: string | null
                    content: string
                    created_at: string
                    read_at: string | null
                }
                Insert: {
                    chat_id: string
                    sender_id?: string | null
                    content: string
                    read_at?: string | null
                }
                Update: {
                    content?: string
                    read_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "team_messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "team_chats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
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
