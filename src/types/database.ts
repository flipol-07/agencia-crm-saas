export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
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
    project_id: string
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
    projects: Pick<Project, 'id' | 'name' | 'contact_id'> & {
        contacts: Pick<Contact, 'id' | 'company_name'>
    }
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
    projects: Pick<Project, 'id' | 'name' | 'contact_id'> & {
        contacts: Pick<Contact, 'id' | 'company_name'>
    }
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

// Database type para Supabase
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>
            }
            contacts: {
                Row: Contact
                Insert: ContactInsert
                Update: ContactUpdate
            }
            projects: {
                Row: Project
                Insert: ProjectInsert
                Update: ProjectUpdate
            }
            tasks: {
                Row: Task
                Insert: TaskInsert
                Update: TaskUpdate
            }
            messages: {
                Row: Message
                Insert: MessageInsert
                Update: MessageUpdate
            }
            invoices: {
                Row: Invoice
                Insert: InvoiceInsert
                Update: InvoiceUpdate
            }
            invoice_items: {
                Row: InvoiceItem
                Insert: InvoiceItemInsert
                Update: InvoiceItemUpdate
            }
        }
    }
}
