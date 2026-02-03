import { DashboardContext, Recommendation } from '../lib/recommendation-engine'

const SYSTEM_PROMPT = `Eres un experto analista de negocios y productividad para agencias digitales.
Tu objetivo es analizar los KPIs y el contexto de un usuario en el CRM y generar recomendaciones accionales y breves.

FORMATO DE SALIDA (JSON ARRAY):
[
  {
    "id": "unique-id",
    "type": "success" | "warning" | "info" | "critical",
    "title": "Título corto (max 30 chars)",
    "message": "Mensaje directo y motivador (max 120 chars). Usa 'tú' o 'vosotros'.",
    "actionLabel": "Texto botón (opcional)",
    "actionUrl": "/ruta-interna (opcional)"
  }
]

REGLAS:
1. Genera máximo 3 recomendaciones más importantes.
2. Prioriza problemas críticos (beneficio negativo, tareas urgentes acumuladas).
3. Adapta el lenguaje al ROL del usuario.
   - CEO: Foco en rentabilidad, visión macro, finanzas.
   - Ventas: Foco en pipeline, cierre de leads, seguimiento.
   - Dev: Foco en entregas, eficiencia, bugs.
4. Si todo está bien, genera un mensaje de refuerzo positivo o sugerencia de crecimiento.
5. Sé específico con los números si hay datos relevantes (ej: "Tienes 3 facturas pendientes").
`

export class AIRecommendationsService {
    private apiKey: string

    constructor() {
        const key = process.env.OPENAI_API_KEY
        if (!key) {
            console.warn('OPENAI_API_KEY not configured for AIRecommendationsService')
            this.apiKey = ''
        } else {
            this.apiKey = key
        }
    }

    async generateRecommendations(context: DashboardContext): Promise<Recommendation[]> {
        if (!this.apiKey) return []

        const userContext = `
ROL: ${context.role || 'Usuario estándar'}
FECHA: ${new Date().toLocaleDateString('es-ES')}

KPIs ACTUALES (vs mes anterior):
- Ingresos: ${context.kpis.incomeThisMonth}€ (${this.formatTrend(context.kpis.trends?.income)})
- Beneficio: ${context.kpis.netProfit}€ (${this.formatTrend(context.kpis.trends?.netProfit)})
- Pipeline Potencial: ${context.kpis.pipelinePotential}€
- Proyectos Activos: ${context.kpis.activeProjects}
- Facturas Pendientes: ${context.kpis.pendingInvoices}€

CONTEXTO OPERATIVO:
- Leads recientes (30d): ${context.recentLeadsCount}
- Tareas Alta Prioridad: ${context.highPriorityTasksCount}
`

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userContext }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                }),
            })

            if (!response.ok) {
                console.error('AI Recommendations API error:', await response.text())
                return []
            }

            const data = await response.json()
            const content = data.choices[0]?.message?.content

            if (!content) return []

            const result = JSON.parse(content)
            // Handle both { recommendations: [...] } and plain [...] array formats
            const recommendations = Array.isArray(result) ? result : result.recommendations || []

            return recommendations.map((rec: any) => ({
                ...rec,
                id: rec.id || Math.random().toString(36).substring(7)
            }))

        } catch (error) {
            console.error('Error generating AI recommendations:', error)
            return []
        }
    }

    private formatTrend(trend?: number): string {
        if (trend === undefined) return '0%'
        return trend > 0 ? `+${trend}%` : `${trend}%`
    }
}

export const aiRecommendationsService = new AIRecommendationsService()
