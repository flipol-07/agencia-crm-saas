/**
 * Servicio de Templates de Email
 * 
 * CRUD de templates HTML para emails.
 * Los templates se guardan en Supabase.
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmailTemplate } from '../types/lead-scraper.types';

export class TemplateService {
  private supabase: any;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Obtiene todos los templates del usuario
   */
  async getAll(): Promise<EmailTemplate[]> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.mapFromDb(data || []);
  }

  /**
   * Obtiene un template por ID
   */
  async getById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapFromDb([data])[0];
  }

  /**
   * Obtiene el template por defecto
   */
  async getDefault(): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapFromDb([data])[0];
  }

  /**
   * Crea un nuevo template
   */
  async create(template: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('email_templates')
      .insert({
        user_id: user.id,
        name: template.name,
        html_content: template.htmlContent,
        description: template.description,
        is_default: template.isDefault,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb([data] as any[])[0];
  }

  /**
   * Actualiza un template
   */
  async update(id: string, template: Partial<Omit<EmailTemplate, 'id' | 'userId'>>): Promise<EmailTemplate> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (template.name !== undefined) updateData.name = template.name;
    if (template.htmlContent !== undefined) updateData.html_content = template.htmlContent;
    if (template.description !== undefined) updateData.description = template.description;
    if (template.isDefault !== undefined) updateData.is_default = template.isDefault;

    const { data, error } = await this.supabase
      .from('email_templates')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb([data] as any[])[0];
  }

  /**
   * Elimina un template
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Establece un template como default
   */
  async setDefault(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Quitar default de todos
    await this.supabase
      .from('email_templates')
      .update({ is_default: false } as any)
      .eq('user_id', user.id);

    // Poner default al seleccionado
    await this.supabase
      .from('email_templates')
      .update({ is_default: true } as any)
      .eq('id', id);
  }

  /**
   * Mapea datos de DB a tipo TypeScript
   */
  private mapFromDb(rows: Record<string, unknown>[]): EmailTemplate[] {
    return rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      htmlContent: row.html_content as string,
      description: row.description as string | undefined,
      isDefault: row.is_default as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  }
}

export function createTemplateService(): TemplateService {
  return new TemplateService();
}

// ============ DEFAULT TEMPLATE ============

export const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; color: #333; font-family: 'Inter', sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"
    style="max-width: 600px; background-color: #0d0a1b; color: #fff; border-radius: 12px; margin-top: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
    <tr>
      <td style="padding: 45px;">
        <!-- Header con Title (como fallback a logo) -->
        <div style="text-align: center; margin-bottom: 35px;">
           <h1 style="color: #fff; font-size: 24px; margin: 0;">SaaS Factory</h1>
        </div>

        <!-- Contenido -->
        <div style="font-size: 16px; line-height: 1.6; color: #ececec;">
          <p>Hola {{nombre}},</p>
          <p>{{parrafo_problema}}</p>
          <p>{{parrafo_beneficio}}</p>
          <p>{{parrafo_cierre}}</p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="#"
            style="background-color: #8b5cf6; color: #fff; padding: 18px 25px; text-decoration: none; font-weight: 900; border-radius: 6px; display: inline-block; text-transform: uppercase;">
            AGENDAR DEMO
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #2a254a; padding-top: 30px; margin-top: 20px;">
          <p style="font-size: 16px; margin: 0; font-weight: 700; color: #fff;">Antigravity Team</p>
          <p style="font-size: 13px; margin: 5px 0 0; color: #8b5cf6; font-weight: 700;">AI Automation Specialists</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
