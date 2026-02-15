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
  default_irpf_rate?: number | null
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
  created_by: string | null
  issuer_profile_id: string | null
  template_id: string | null
  config: InvoiceTemplateConfig | null
  irpf_rate: number
  irpf_amount: number
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
  type: 'text' | 'title' | 'image' | 'table' | 'issuer' | 'recipient' | 'total' | 'invoice_number' | 'date' | 'square' | 'line'
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
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
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
  name?: string
  avatar_url?: string | null
  participants: {
    profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  }[]
}

// ============================================
// Event Types (Calendar)
// ============================================

export interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  all_day: boolean
  color: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>
export type EventUpdate = Partial<Omit<Event, 'id' | 'created_at'>>

// Database type para Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_knowledge_chunks: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          source_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          source_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          model: string | null
          reasoning_details: Json | null
          role: string
          tool_result: Json | null
          tool_used: string | null
          usage: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          reasoning_details?: Json | null
          role: string
          tool_result?: Json | null
          tool_used?: string | null
          usage?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          reasoning_details?: Json | null
          role?: string
          tool_result?: Json | null
          tool_used?: string | null
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      combined_images: {
        Row: {
          combination_prompt: string
          combination_session: string | null
          created_at: string | null
          id: string
          image_id: string
          model_used: string | null
          quality_score: number | null
          source_images: Json
          source_url: string
          storage_folder: string | null
          supabase_url: string | null
          tags: string[] | null
          webp_optimized: boolean | null
        }
        Insert: {
          combination_prompt: string
          combination_session?: string | null
          created_at?: string | null
          id?: string
          image_id: string
          model_used?: string | null
          quality_score?: number | null
          source_images?: Json
          source_url: string
          storage_folder?: string | null
          supabase_url?: string | null
          tags?: string[] | null
          webp_optimized?: boolean | null
        }
        Update: {
          combination_prompt?: string
          combination_session?: string | null
          created_at?: string | null
          id?: string
          image_id?: string
          model_used?: string | null
          quality_score?: number | null
          source_images?: Json
          source_url?: string
          storage_folder?: string | null
          supabase_url?: string | null
          tags?: string[] | null
          webp_optimized?: boolean | null
        }
        Relationships: []
      }
      competitions: {
        Row: {
          created_at: string | null
          date: string
          id: string
          location: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          location?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          location?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          contact_id: string | null
          created_at: string | null
          direction: string | null
          from_email: string | null
          id: string
          is_read: boolean | null
          message_id: string
          received_at: string | null
          snippet: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction?: string | null
          from_email?: string | null
          id?: string
          is_read?: boolean | null
          message_id: string
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction?: string | null
          from_email?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_files: {
        Row: {
          contact_id: string
          content_type: string | null
          created_at: string | null
          created_by: string | null
          file_path: string
          file_size: number | null
          id: string
          name: string
        }
        Insert: {
          contact_id: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          name: string
        }
        Update: {
          contact_id?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_scores: {
        Row: {
          computed_at: string | null
          contact_id: string | null
          id: string
          model_version: string | null
          score: number | null
        }
        Insert: {
          computed_at?: string | null
          contact_id?: string | null
          id?: string
          model_version?: string | null
          score?: number | null
        }
        Update: {
          computed_at?: string | null
          contact_id?: string | null
          id?: string
          model_version?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_scores_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_description: string | null
          ai_suggestions: Json | null
          assigned_to: string | null
          classification: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number | null
          id: string
          inactivity_status: string | null
          last_analyzed_at: string | null
          last_interaction: string | null
          lifetime_value: number | null
          notes: string | null
          pain_points: Json | null
          phone: string | null
          pipeline_stage: string
          probability_close: number | null
          requirements: Json | null
          services: string[] | null
          source: Database["public"]["Enums"]["contact_source"] | null
          status: Database["public"]["Enums"]["contact_status"]
          tax_address: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_description?: string | null
          ai_suggestions?: Json | null
          assigned_to?: string | null
          classification?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          inactivity_status?: string | null
          last_analyzed_at?: string | null
          last_interaction?: string | null
          lifetime_value?: number | null
          notes?: string | null
          pain_points?: Json | null
          phone?: string | null
          pipeline_stage?: string
          probability_close?: number | null
          requirements?: Json | null
          services?: string[] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          status?: Database["public"]["Enums"]["contact_status"]
          tax_address?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_description?: string | null
          ai_suggestions?: Json | null
          assigned_to?: string | null
          classification?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          inactivity_status?: string | null
          last_analyzed_at?: string | null
          last_interaction?: string | null
          lifetime_value?: number | null
          notes?: string | null
          pain_points?: Json | null
          phone?: string | null
          pipeline_stage?: string
          probability_close?: number | null
          requirements?: Json | null
          services?: string[] | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          status?: Database["public"]["Enums"]["contact_status"]
          tax_address?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
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
          },
        ]
      }
      conversation_images: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          image_id: string | null
          image_source: string | null
          original_url: string | null
          prompt: string | null
          quality_score: number | null
          supabase_url: string | null
          tags: string[] | null
          tool_used: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          image_id?: string | null
          image_source?: string | null
          original_url?: string | null
          prompt?: string | null
          quality_score?: number | null
          supabase_url?: string | null
          tags?: string[] | null
          tool_used?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          image_id?: string | null
          image_source?: string | null
          original_url?: string | null
          prompt?: string | null
          quality_score?: number | null
          supabase_url?: string | null
          tags?: string[] | null
          tool_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_images_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string | null
          date: string
          id: string
          recovery_score: number | null
          thermal_deficit: number | null
          total_calories_burned_active: number | null
          total_calories_in: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          recovery_score?: number | null
          thermal_deficit?: number | null
          total_calories_burned_active?: number | null
          total_calories_in?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          recovery_score?: number | null
          thermal_deficit?: number | null
          total_calories_burned_active?: number | null
          total_calories_in?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_insights: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          payload: Json | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          payload?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          payload?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          created_at: string | null
          email_id: string | null
          file_path: string | null
          file_type: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email_id?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email_id?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_reads: {
        Row: {
          email_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          email_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          email_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_reads_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "contact_emails"
            referencedColumns: ["message_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string | null
          from_address: string
          id: string
          processed: boolean | null
          raw_payload: Json | null
          subject: string | null
          to_address: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          from_address: string
          id?: string
          processed?: boolean | null
          raw_payload?: Json | null
          subject?: string | null
          to_address: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          from_address?: string
          id?: string
          processed?: boolean | null
          raw_payload?: Json | null
          subject?: string | null
          to_address?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          id: string
          is_personal: boolean
          linked_invoice_id: string | null
          receipt_url: string | null
          sector_id: string | null
          tax_amount: number | null
          tax_deductible: boolean | null
          tax_rate: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_personal?: boolean
          linked_invoice_id?: string | null
          receipt_url?: string | null
          sector_id?: string | null
          tax_amount?: number | null
          tax_deductible?: boolean | null
          tax_rate?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_personal?: boolean
          linked_invoice_id?: string | null
          receipt_url?: string | null
          sector_id?: string | null
          tax_amount?: number | null
          tax_deductible?: boolean | null
          tax_rate?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          calories_burned: number | null
          created_at: string | null
          duration_minutes: number
          id: string
          intensity: string | null
          user_id: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          intensity?: string | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          intensity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_images: {
        Row: {
          created_at: string | null
          id: string
          image_id: string
          original_url: string
          prompt: string
          saved_at: string | null
          supabase_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id: string
          original_url: string
          prompt: string
          saved_at?: string | null
          supabase_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string
          original_url?: string
          prompt?: string
          saved_at?: string | null
          supabase_url?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string | null
          generated_at: string | null
          generation_session: string | null
          id: string
          image_id: string
          model_parameters: Json | null
          model_version: string | null
          prompt: string
          quality_score: number | null
          replicate_url: string
          storage_folder: string | null
          supabase_url: string | null
          tags: string[] | null
          webp_optimized: boolean | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          generation_session?: string | null
          id?: string
          image_id: string
          model_parameters?: Json | null
          model_version?: string | null
          prompt: string
          quality_score?: number | null
          replicate_url: string
          storage_folder?: string | null
          supabase_url?: string | null
          tags?: string[] | null
          webp_optimized?: boolean | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          generation_session?: string | null
          id?: string
          image_id?: string
          model_parameters?: Json | null
          model_version?: string | null
          prompt?: string
          quality_score?: number | null
          replicate_url?: string
          storage_folder?: string | null
          supabase_url?: string | null
          tags?: string[] | null
          webp_optimized?: boolean | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string | null
          direction: string
          id: string
          metadata: Json | null
          occurred_at: string | null
          project_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          project_id?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          project_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          background_url: string | null
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          max_items: number
          name: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          background_url?: string | null
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          max_items?: number
          name: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          background_url?: string | null
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          max_items?: number
          name?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          config: Json | null
          contact_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string | null
          irpf_amount: number | null
          irpf_rate: number | null
          issue_date: string
          issuer_profile_id: string | null
          notes: string | null
          paid_date: string | null
          project_id: string | null
          sector_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          template_id: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          irpf_amount?: number | null
          irpf_rate?: number | null
          issue_date?: string
          issuer_profile_id?: string | null
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          sector_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          irpf_amount?: number | null
          irpf_rate?: number | null
          issue_date?: string
          issuer_profile_id?: string | null
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          sector_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total?: number | null
          updated_at?: string
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
            foreignKeyName: "invoices_issuer_profile_id_fkey"
            columns: ["issuer_profile_id"]
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
          },
          {
            foreignKeyName: "invoices_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: Json | null
          conclusions: Json | null
          contact_id: string | null
          created_at: string | null
          date: string
          external_id: string | null
          feedback: Json | null
          id: string
          key_points: Json | null
          meeting_url: string | null
          status: string | null
          summary: string | null
          title: string
          transcription: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attendees?: Json | null
          conclusions?: Json | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          external_id?: string | null
          feedback?: Json | null
          id?: string
          key_points?: Json | null
          meeting_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          transcription?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attendees?: Json | null
          conclusions?: Json | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          external_id?: string | null
          feedback?: Json | null
          id?: string
          key_points?: Json | null
          meeting_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          transcription?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_url: string | null
          sender_name: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id: string | null
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          sender_name?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id?: string | null
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          sender_name?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id?: string | null
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
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          created_at: string | null
          estimated_calories: number | null
          estimated_carbs: number | null
          estimated_fat: number | null
          estimated_protein: number | null
          id: string
          image_url: string | null
          meal_type: string | null
          notes: string | null
          user_id: string
          verified_by_user: boolean | null
        }
        Insert: {
          created_at?: string | null
          estimated_calories?: number | null
          estimated_carbs?: number | null
          estimated_fat?: number | null
          estimated_protein?: number | null
          id?: string
          image_url?: string | null
          meal_type?: string | null
          notes?: string | null
          user_id: string
          verified_by_user?: boolean | null
        }
        Update: {
          created_at?: string | null
          estimated_calories?: number | null
          estimated_carbs?: number | null
          estimated_fat?: number | null
          estimated_protein?: number | null
          id?: string
          image_url?: string | null
          meal_type?: string | null
          notes?: string | null
          user_id?: string
          verified_by_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          created_at: string | null
          id: string
          meals: Json
          scheduled_for: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meals?: Json
          scheduled_for?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meals?: Json
          scheduled_for?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_address: string | null
          billing_email: string | null
          billing_iban: string | null
          billing_name: string | null
          billing_phone: string | null
          billing_tax_id: string | null
          birth_date: string | null
          created_at: string
          default_irpf_rate: number | null
          email: string
          full_name: string | null
          gender: string | null
          height: number | null
          id: string
          invoice_prefix: string | null
          level: string | null
          main_styles: string[] | null
          next_invoice_number: number | null
          personal_records: Json | null
          professional_description: string | null
          professional_role: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_iban?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_tax_id?: string | null
          birth_date?: string | null
          created_at?: string
          default_irpf_rate?: number | null
          email: string
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id: string
          invoice_prefix?: string | null
          level?: string | null
          main_styles?: string[] | null
          next_invoice_number?: number | null
          personal_records?: Json | null
          professional_description?: string | null
          professional_role?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_iban?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_tax_id?: string | null
          birth_date?: string | null
          created_at?: string
          default_irpf_rate?: number | null
          email?: string
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          invoice_prefix?: string | null
          level?: string | null
          main_styles?: string[] | null
          next_invoice_number?: number | null
          personal_records?: Json | null
          professional_description?: string | null
          professional_role?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          completed_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          final_payment: number | null
          final_payment_date: string | null
          id: string
          initial_payment: number | null
          initial_payment_date: string | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          completed_at?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          final_payment?: number | null
          final_payment_date?: string | null
          id?: string
          initial_payment?: number | null
          initial_payment_date?: string | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          final_payment?: number | null
          final_payment_date?: string | null
          id?: string
          initial_payment?: number | null
          initial_payment_date?: string | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
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
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      race_results: {
        Row: {
          competition_id: string | null
          created_at: string | null
          distance_meters: number
          event_name: string
          id: string
          is_pb: boolean | null
          official_time_seconds: number
          splits: Json | null
          style: string
          user_id: string | null
        }
        Insert: {
          competition_id?: string | null
          created_at?: string | null
          distance_meters: number
          event_name: string
          id?: string
          is_pb?: boolean | null
          official_time_seconds: number
          splits?: Json | null
          style: string
          user_id?: string | null
        }
        Update: {
          competition_id?: string | null
          created_at?: string | null
          distance_meters?: number
          event_name?: string
          id?: string
          is_pb?: boolean | null
          official_time_seconds?: number
          splits?: Json | null
          style?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          expire_at: number | null
          key: string
          points: number | null
        }
        Insert: {
          expire_at?: number | null
          key: string
          points?: number | null
        }
        Update: {
          expire_at?: number | null
          key?: string
          points?: number | null
        }
        Relationships: []
      }
      saved_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          name: string
          prompt: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          prompt: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          prompt?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      scraper_campaigns: {
        Row: {
          created_at: string | null
          emails_sent: number | null
          id: string
          leads_count: number | null
          name: string
          search_config: Json | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_count?: number | null
          name: string
          search_config?: Json | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          leads_count?: number | null
          name?: string
          search_config?: Json | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_leads: {
        Row: {
          campaign_id: string | null
          categoria: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          email_html: string | null
          email_status: string | null
          email_subject: string | null
          id: string
          nombre: string
          place_id: string | null
          rating: number | null
          sent_at: string | null
          telefono: string | null
          total_reviews: number | null
          ubicacion: string | null
          website: string | null
        }
        Insert: {
          campaign_id?: string | null
          categoria?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          email_html?: string | null
          email_status?: string | null
          email_subject?: string | null
          id?: string
          nombre: string
          place_id?: string | null
          rating?: number | null
          sent_at?: string | null
          telefono?: string | null
          total_reviews?: number | null
          ubicacion?: string | null
          website?: string | null
        }
        Update: {
          campaign_id?: string | null
          categoria?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          email_html?: string | null
          email_status?: string | null
          email_subject?: string | null
          id?: string
          nombre?: string
          place_id?: string | null
          rating?: number | null
          sent_at?: string | null
          telefono?: string | null
          total_reviews?: number | null
          ubicacion?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "scraper_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          default_tax_rate: number | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          default_tax_rate?: number | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          default_tax_rate?: number | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          meeting_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          meeting_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          meeting_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: string | null
          title?: string
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
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_participants: {
        Row: {
          chat_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
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
          },
        ]
      }
      team_chats: {
        Row: {
          created_at: string | null
          id: string
          is_group: boolean | null
          last_message_preview: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message_preview?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message_preview?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string | null
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
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          scheduled_for: string | null
          sets: Json
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_for?: string | null
          sets?: Json
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_for?: string | null
          sets?: Json
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_uploads: {
        Row: {
          description: string | null
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          original_dimensions: Json | null
          public_url: string
          storage_path: string
          tags: string[] | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          description?: string | null
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          original_dimensions?: Json | null
          public_url: string
          storage_path: string
          tags?: string[] | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          description?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          original_dimensions?: Json | null
          public_url?: string
          storage_path?: string
          tags?: string[] | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string | null
          distance_meters: number | null
          id: string
          rep_order: number | null
          stroke_count: number | null
          style: string | null
          time_seconds: number | null
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          distance_meters?: number | null
          id?: string
          rep_order?: number | null
          stroke_count?: number | null
          style?: string | null
          time_seconds?: number | null
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          distance_meters?: number | null
          id?: string
          rep_order?: number | null
          stroke_count?: number | null
          style?: string | null
          time_seconds?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          average_heart_rate: number | null
          created_at: string | null
          id: string
          pool_length_meters: number | null
          rpe: number | null
          sensations: string | null
          source: string | null
          total_distance_meters: number | null
          total_time_seconds: number | null
          user_id: string
          water_temperature: number | null
          workout_date: string | null
        }
        Insert: {
          average_heart_rate?: number | null
          created_at?: string | null
          id?: string
          pool_length_meters?: number | null
          rpe?: number | null
          sensations?: string | null
          source?: string | null
          total_distance_meters?: number | null
          total_time_seconds?: number | null
          user_id: string
          water_temperature?: number | null
          workout_date?: string | null
        }
        Update: {
          average_heart_rate?: number | null
          created_at?: string | null
          id?: string
          pool_length_meters?: number | null
          rpe?: number | null
          sensations?: string | null
          source?: string | null
          total_distance_meters?: number | null
          total_time_seconds?: number | null
          user_id?: string
          water_temperature?: number | null
          workout_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_conversation: { Args: { target_user_id: string }; Returns: string }
      get_dashboard_engine_metrics: { Args: never; Returns: Json }
      get_my_unread_counts: {
        Args: never
        Returns: {
          company_name: string
          contact_id: string
          contact_name: string
          count: number
        }[]
      }
      get_team_unread_count: { Args: never; Returns: number }
      increment_rate_limit: { Args: { row_key: string }; Returns: undefined }
      is_chat_member: { Args: { _chat_id: string }; Returns: boolean }
      mark_messages_read: { Args: { p_chat_id: string }; Returns: boolean }
      match_ai_knowledge: {
        Args: {
          category_filter?: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_embeddings: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          entity_id: string
          entity_type: string
          id: string
          similarity: number
        }[]
      }
      set_default_template: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      create_group_chat: {
        Args: {
          group_name: string
          participant_ids: string[]
        }
        Returns: string
      }
    }
    Enums: {
      contact_source:
      | "inbound_whatsapp"
      | "inbound_email"
      | "outbound"
      | "referral"
      | "website"
      | "other"
      contact_status:
      | "prospect"
      | "qualified"
      | "proposal"
      | "won"
      | "active"
      | "maintenance"
      | "lost"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      message_direction: "inbound" | "outbound"
      message_status: "sent" | "delivered" | "read" | "failed"
      project_status:
      | "pending"
      | "active"
      | "on_hold"
      | "completed"
      | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      contact_source: [
        "inbound_whatsapp",
        "inbound_email",
        "outbound",
        "referral",
        "website",
        "other",
      ],
      contact_status: [
        "prospect",
        "qualified",
        "proposal",
        "won",
        "active",
        "maintenance",
        "lost",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      message_direction: ["inbound", "outbound"],
      message_status: ["sent", "delivered", "read", "failed"],
      project_status: [
        "pending",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
    },
  },
} as const



