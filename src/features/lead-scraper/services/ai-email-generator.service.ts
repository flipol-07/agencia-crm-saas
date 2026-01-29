/**
 * Servicio de Generación de Emails con IA
 * 
 * Usa OpenAI para generar emails personalizados basados en:
 * 1. Análisis de la web del lead (opcional, usando Perplexity)
 * 2. Template HTML del usuario
 * 3. Datos del lead (nombre, categoría, ubicación)
 */

import type { Lead, EmailTemplate, GeneratedEmail, AITemplateRequest } from '../types/lead-scraper.types';

// Color de acento para highlights
const HIGHLIGHT_COLOR = '#bfff00';

// ============ PROMPTS ============

const TEMPLATE_GENERATION_PROMPT = `Eres un experto diseñador de emails HTML. Genera un email profesional y moderno.

REQUISITOS:
1. El HTML debe ser compatible con clientes de email (tablas, estilos inline)
2. Diseño responsive (max-width: 600px)
3. Fondo oscuro (#0d0a1b) con texto claro (#fff)
4. Color de acento: ${HIGHLIGHT_COLOR}
5. Incluir el logo en la cabecera
6. Tipografía Inter o sans-serif

ESTRUCTURA:
- Header con logo
- Contenido principal con los párrafos
- Botón CTA destacado
- Footer con firma

RESPONDE SOLO CON EL HTML, sin explicaciones.`;

const EMAIL_PERSONALIZATION_PROMPT = `Eres Pol, un experto en IA que escribe emails de ventas personalizados para AURIE.

CONTEXTO:
- Eres un profesional que ofrece servicios de automatización con IA
- Tu tono es profesional pero cercano, como un consultor de confianza
- Usas "vosotros/os" y demuestras que has analizado su web/negocio
- Destacas datos importantes con <span style="color: #bfff00;">texto</span>

ENTRADA:
- Información del lead (nombre del negocio, categoría, ubicación)
- Análisis de su web (si disponible)

SALIDA (JSON estricto):
{
  "subject": "Asunto profesional y específico al negocio (máx 50 chars)",
  "parrafo_problema": "2-3 frases identificando UN problema o reto específico de su sector. Demuestra conocimiento de su industria. Ejemplo: 'Gestionar certificaciones ISO y mantener toda la documentación actualizada consume recursos valiosos de vuestro equipo.'",
  "parrafo_oferta": "La propuesta comercial profesional. Menciona el nombre de la empresa. Usa highlights con <span style='color: #bfff00;'>texto</span>. Ejemplo: 'Existe una oportunidad con el <span style=\"color: #bfff00;\">Decreto 173/2025</span> que cubre el <span style=\"color: #bfff00;\">85%</span> del coste de implementar IA en vuestros procesos. <span style=\"color: #bfff00;\">{{nombre}} solo aportaría el 15%</span>.'",
  "parrafo_cierre": "Cierre profesional. Reconoce que es una hipótesis basada en tu análisis y propón una consultoría para validar. Ejemplo: 'Esta es una primera valoración basada en lo que he observado. Os propongo una breve consultoría con mi equipo para analizar vuestro caso concreto y ver si realmente podemos aportaros valor.'"
}

REGLAS:
- El parrafo_problema debe ser ESPECÍFICO al sector del negocio
- Tono profesional de consultor, NO de vendedor agresivo
- Usa datos reales si los tienes del análisis web
- Máximo 200 palabras total entre los 3 párrafos
- NO uses frases tipo "estamos para ayudarte" o demasiado comerciales
- SÉ ESPECÍFICO al sector - demuestra que entiendes su negocio`;

export class AIEmailGeneratorService {
    private openaiApiKey: string;
    private perplexityApiKey?: string;

    constructor() {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY no está configurada');
        }
        this.openaiApiKey = openaiKey;
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    }

    /**
     * Genera un template HTML con IA
     */
    async generateTemplate(request: AITemplateRequest): Promise<string> {
        const prompt = `${TEMPLATE_GENERATION_PROMPT}

PARÁMETROS:
- Logo URL: ${request.logoUrl || 'Sin logo'}
- Estilo: ${request.style}
- Color primario: ${request.primaryColor || HIGHLIGHT_COLOR}

CONTENIDO:
${request.paragraphs.map((p, i) => `Párrafo ${i + 1}: ${p}`).join('\n')}

Genera el HTML completo del email.`;

        const response = await this.callOpenAI(prompt, 'gpt-4o-mini', 2000);

        // Limpiar posibles markdown code blocks
        let html = response;
        if (html.includes('```html')) {
            html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        }

        return html.trim();
    }

    /**
     * Genera un template HTML completo basándose en un prompt descriptivo del usuario
     */
    async generateTemplateFromPrompt(userPrompt: string, config?: {
        logoUrl?: string;
        webUrl?: string;
        emailRespuesta?: string;
        nombreRemitente?: string;
        empresaRemitente?: string;
        infoUrl?: string;
        infoTexto?: string;
    }): Promise<string> {
        const systemPrompt = `Eres un experto diseñador de emails HTML. Generas templates de email profesionales y modernos.

ESTILO BASE:
- Fondo oscuro (#0d0a1b) con texto claro (#ececec)
- Color de acento: #bfff00 (verde lima neón)
- Fuente: Inter (Google Fonts)
- Max-width: 600px, con border-radius y sombras sutiles
- Diseño centrado en tablas (compatibilidad email)

VARIABLES DISPONIBLES (el usuario puede usar estas en el contenido):
- {{nombre}} - Nombre del negocio destinatario
- {{parrafo_problema}} - Texto generado por IA sobre el problema
- {{parrafo_oferta}} - Texto generado por IA con la propuesta
- {{parrafo_cierre}} - Texto generado por IA de cierre

CONFIGURACIÓN DEL REMITENTE:
- Logo: ${config?.logoUrl || '{{logo_url}}'}
- Web: ${config?.webUrl || '{{web_url}}'}
- Email respuesta: ${config?.emailRespuesta || '{{email_respuesta}}'}
- Nombre remitente: ${config?.nombreRemitente || '{{nombre_remitente}}'}
- Empresa remitente: ${config?.empresaRemitente || '{{empresa_remitente}}'}
- Link info: ${config?.infoUrl || '{{info_url}}'} con texto: ${config?.infoTexto || '{{info_texto}}'}

REGLAS:
1. Genera HTML inline styles (no CSS externo excepto Google Fonts import)
2. Usa tables para layout (compatibilidad con clientes de email)
3. Incluye CTAs con botones llamativos
4. Incluye firma/footer profesional
5. Mantén el código limpio y bien estructurado

RESPONDE SOLO CON EL CÓDIGO HTML, sin explicaciones ni markdown code blocks.`;

        const response = await this.callOpenAI(
            `${systemPrompt}\n\nSOLICITUD DEL USUARIO:\n${userPrompt}`,
            'gpt-4o',
            4000
        );

        // Limpiar posibles markdown code blocks
        let html = response;
        if (html.includes('```')) {
            html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        }

        return html.trim();
    }

    /**
     * Analiza la web de un lead con Perplexity
     */
    async analyzeWebsite(website: string, empresa: string, categoria: string): Promise<string> {
        if (!website || !this.perplexityApiKey) {
            return `${empresa} opera en el sector de ${categoria}.`;
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un analista de negocios. Analiza la web y responde en máximo 80 palabras: qué hace la empresa, qué servicios ofrece, y qué tareas podrían automatizarse.'
                        },
                        {
                            role: 'user',
                            content: `Analiza: ${empresa} (${categoria}). Web: ${website}`
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.3,
                }),
            });

            if (!response.ok) {
                console.warn(`Perplexity falló para ${empresa}`);
                return `${empresa} opera en el sector de ${categoria}.`;
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || `${empresa} opera en ${categoria}.`;
        } catch (error) {
            console.warn(`Error analizando web de ${empresa}`);
            return `${empresa} opera en el sector de ${categoria}.`;
        }
    }

    /**
     * Genera un email personalizado para un lead
     */
    async generatePersonalizedEmail(
        lead: Lead,
        template: EmailTemplate,
        useWebAnalysis: boolean = true
    ): Promise<GeneratedEmail> {
        // Paso 1: Analizar web si está habilitado
        let webAnalysis = '';
        if (useWebAnalysis && lead.website) {
            webAnalysis = await this.analyzeWebsite(lead.website, lead.nombre, lead.categoria);
        }

        // Paso 2: Generar textos personalizados
        const prompt = `${EMAIL_PERSONALIZATION_PROMPT}

LEAD:
- Empresa: ${lead.nombre}
- Categoría: ${lead.categoria}
- Ubicación: ${lead.ubicacion}
- Website: ${lead.website || 'No disponible'}
${webAnalysis ? `- Análisis web: ${webAnalysis}` : ''}

TEMPLATE VARIABLES DISPONIBLES:
{{nombre}}, {{categoria}}, {{ubicacion}}, {{parrafo_problema}}, {{parrafo_beneficio}}, {{parrafo_cierre}}

Genera el JSON con asunto y variables personalizadas.`;

        const response = await this.callOpenAI(prompt, 'gpt-4o-mini', 1000, true);

        try {
            const parsed = JSON.parse(response);

            // Paso 3: Reemplazar variables en el template
            let htmlContent = template.htmlContent;

            // Variables básicas
            htmlContent = htmlContent.replace(/\{\{nombre\}\}/g, lead.nombre);
            htmlContent = htmlContent.replace(/\{\{categoria\}\}/g, lead.categoria);
            htmlContent = htmlContent.replace(/\{\{ubicacion\}\}/g, lead.ubicacion);

            // Variables generadas por IA
            if (parsed.variables) {
                for (const [key, value] of Object.entries(parsed.variables)) {
                    htmlContent = htmlContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
                }
            }

            return {
                subject: parsed.subject || `Propuesta para ${lead.nombre}`,
                htmlContent,
                leadId: lead.id,
            };
        } catch (error) {
            console.error('Error parseando respuesta de OpenAI:', error);

            // Fallback con valores básicos
            let htmlContent = template.htmlContent;
            htmlContent = htmlContent.replace(/\{\{nombre\}\}/g, lead.nombre);
            htmlContent = htmlContent.replace(/\{\{categoria\}\}/g, lead.categoria);
            htmlContent = htmlContent.replace(/\{\{ubicacion\}\}/g, lead.ubicacion);

            return {
                subject: `Propuesta para ${lead.nombre}`,
                htmlContent,
                leadId: lead.id,
            };
        }
    }

    /**
     * Genera emails para múltiples leads
     */
    async generateBatch(
        leads: Lead[],
        template: EmailTemplate,
        onProgress?: (current: number, total: number) => void
    ): Promise<GeneratedEmail[]> {
        const results: GeneratedEmail[] = [];

        for (let i = 0; i < leads.length; i++) {
            if (onProgress) {
                onProgress(i + 1, leads.length);
            }

            const email = await this.generatePersonalizedEmail(leads[i], template);
            results.push(email);

            // Pequeña pausa para rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    }

    /**
     * Llamada a OpenAI
     */
    private async callOpenAI(
        prompt: string,
        model: string = 'gpt-4o-mini',
        maxTokens: number = 1000,
        jsonMode: boolean = false
    ): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7,
                ...(jsonMode && { response_format: { type: 'json_object' } }),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI error: ${error}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
}

export function createAIEmailGenerator(): AIEmailGeneratorService {
    return new AIEmailGeneratorService();
}
