/**
 * Tipos para el sistema Lead Scraper
 */

// ============ LEADS ============

export interface Lead {
  id: string;
  campaignId?: string;
  nombre: string;
  categoria: string;
  direccion: string;
  ubicacion: string;
  telefono?: string;
  email?: string;
  website?: string;
  rating?: number;
  totalReviews?: number;
  placeId?: string;
  // Campos de email generado
  emailSubject?: string;
  emailHtml?: string;
  emailStatus: 'pending' | 'generated' | 'sent' | 'error';
  sentAt?: string;
  createdAt: string;
}

// ============ CAMPAIGNS ============

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'scraping' | 'finding_emails' | 'ready' | 'generating' | 'sending' | 'completed';
  searchConfig: SearchConfig;
  templateId?: string;
  leadsCount?: number;
  emailsSent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchConfig {
  sector: string;
  ubicacion: string;
  cantidad: number;
  filtros: SearchFilters;
}

export interface SearchFilters {
  requiereWebsite: boolean;
  requiereEmail: boolean;
  ratingMinimo?: number;
}

// ============ TEMPLATES ============

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  htmlContent: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AITemplateRequest {
  logoUrl?: string;
  paragraphs: string[];
  style: 'profesional' | 'moderno' | 'minimalista';
  primaryColor?: string;
}

// ============ SCRAPING ============

export interface ScrapingProgress {
  phase: 'places' | 'emails' | 'generating' | 'sending';
  current: number;
  total: number;
  message: string;
  startedAt: string;
}

export interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  location?: { latitude: number; longitude: number };
}

export interface TextSearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

// ============ EMAIL GENERATION ============

export interface EmailGenerationRequest {
  lead: Lead;
  template: EmailTemplate;
  useWebAnalysis: boolean;
}

export interface GeneratedEmail {
  subject: string;
  htmlContent: string;
  leadId: string;
}

// ============ SENDING ============

export interface SendingProgress {
  total: number;
  sent: number;
  failed: number;
  currentLead?: string;
  estimatedTimeRemaining?: number;
}

export interface SendingConfig {
  delayBetweenEmails: number; // segundos
  dailyLimit: number;
  testMode: boolean;
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
