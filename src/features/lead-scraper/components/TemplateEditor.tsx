/**
 * TemplateEditor
 * 
 * Editor visual de plantillas de email.
 * El usuario diseña el HTML con estilo, y define huecos {{variable}}
 * donde la IA insertará el texto personalizado.
 */

'use client'

import { useState, useEffect } from 'react'

// Variables que la IA puede rellenar
const AI_VARIABLES = [
    { name: 'nombre', description: 'Nombre del negocio', example: 'Restaurante El Buen Sabor' },
    { name: 'parrafo_problema', description: 'Problema identificado específico del negocio', example: 'Seguro que gestionar las reservas y coordinar a tantos camareros es un lío constante que os quita tiempo de lo importante.' },
    { name: 'parrafo_oferta', description: 'Propuesta de valor con la oferta', example: 'Vengo a darte una buena noticia: ha salido el <span style="color: #8b5cf6;">Decreto 173/2025</span> que os paga el <span style="color: #8b5cf6;">85%</span> para automatizar vuestros procesos. <span style="color: #8b5cf6;">Tu Empresa solo tendría que poner el 15%</span>.' },
    { name: 'parrafo_cierre', description: 'Disclaimer y call to action', example: '<strong>Ojo, esto es solo un ejemplo</strong> de lo que me he imaginado que os vendría bien. Te propongo una consultoría con mi equipo (los humanos de AURIE) para analizar vuestro caso real.' },
]

// Template HTML por defecto - Estilo AURIE/Aura
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');</style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; color: #fff; font-family: 'Inter', sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"
    style="max-width: 600px; background-color: #0d0a1b; color: #fff; border-radius: 20px; margin: 20px auto; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
    <tr>
      <td style="padding: 50px 40px; background: linear-gradient(135deg, #0d0a1b 0%, #1a1535 100%);">
        <!-- Header con Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <a href="{{web_url}}"><img src="{{logo_url}}" style="width: 140px; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3));" alt="Logo"></a>
        </div>

        <!-- Contenido -->
        <div style="font-size: 16px; line-height: 1.8; color: #ececec; letter-spacing: -0.01em;">
          <p style="font-size: 20px; font-weight: 700; margin-bottom: 25px; color: #fff;">Hola,</p>
          <p>Soy <strong>{{nombre_remitente}}</strong>, Senior AI Advisor en {{empresa_remitente}}.</p>
          <p>He estado analizando vuestra presencia digital y he identificado una oportunidad estratégica que vuestra competencia ya está empezando a explotar.</p>
          <div style="margin: 30px 0; padding: 25px; background: rgba(139, 92, 246, 0.05); border-left: 4px solid #8b5cf6; border-radius: 8px;">
            <p style="margin: 0;">{{parrafo_problema}}</p>
          </div>
          <p>{{parrafo_oferta}}</p>
          <p>{{parrafo_cierre}}</p>
        </div>

        <!-- Link informativo -->
        <p style="text-align: center; margin-top: 35px; font-size: 14px;">
          <a href="{{info_url}}" style="color: #a78bfa; text-decoration: none; font-weight: 600;">{{info_texto}} →</a>
        </p>

        <!-- CTAs -->
        <div style="text-align: center; margin: 45px 0;">
          <a href="mailto:{{email_respuesta}}?subject={{email_subject}}&body=Hola, me interesa saber más."
            style="background-color: #8b5cf6; color: #ffffff; padding: 20px 35px; text-decoration: none; font-weight: 800; border-radius: 12px; display: inline-block; margin: 10px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);">
            AGENDAR CONSULTORÍA
          </a>
          <div style="margin-top: 15px;">
            <a href="{{web_url}}"
              style="color: #a78bfa; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">
              O VISITA NUESTRA WEB
            </a>
          </div>
        </div>

        <!-- Footer / Firma -->
        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 35px; margin-top: 40px; display: flex; align-items: center; gap: 15px;">
          <div>
            <p style="font-size: 17px; margin: 0; font-weight: 800; color: #fff;">{{nombre_remitente}}</p>
            <p style="font-size: 13px; margin: 5px 0 0; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">AI Solutions Director | <strong>{{empresa_remitente}}</strong></p>
          </div>
        </div>
      </td>
    </tr>
  </table>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    Si no deseas recibir más correos, puedes <a href="{{unsubscribe_url}}" style="color: #999;">darte de baja aquí</a>.
  </div>
</body>
</html>`

interface TemplateEditorProps {
    onSave?: (template: { name: string; htmlContent: string }) => void
}

export function TemplateEditor({ onSave }: TemplateEditorProps) {
    const [templateName, setTemplateName] = useState('Mi Template de Ventas')
    const [htmlContent, setHtmlContent] = useState(DEFAULT_TEMPLATE)
    const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit')
    const [previewHtml, setPreviewHtml] = useState('')

    // Estados para generación con IA
    const [showAiPrompt, setShowAiPrompt] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiError, setAiError] = useState('')

    // Estados para guardar
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [saveError, setSaveError] = useState('')

    // Generar preview con variables de ejemplo
    useEffect(() => {
        let preview = htmlContent
        AI_VARIABLES.forEach(v => {
            const regex = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g')
            preview = preview.replace(regex, `<span style="background: #8b5cf6; color: #fff; padding: 2px 6px; border-radius: 4px;">${v.example}</span>`)
        })
        setPreviewHtml(preview)
    }, [htmlContent])

    const handleSave = async () => {
        if (!templateName.trim()) {
            setSaveError('El nombre del template es requerido')
            return
        }

        setIsSaving(true)
        setSaveError('')
        setSaveSuccess(false)

        try {
            const response = await fetch('/api/lead-scraper/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName,
                    htmlContent: htmlContent,
                    description: `Template creado el ${new Date().toLocaleDateString()}`,
                    isDefault: false
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar template')
            }

            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)

            if (onSave) {
                onSave({ name: templateName, htmlContent })
            }
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Error desconocido')
        } finally {
            setIsSaving(false)
        }
    }

    const insertVariable = (varName: string) => {
        setHtmlContent(prev => prev + `{{${varName}}}`)
    }

    // Generar template con IA
    const generateWithAi = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Describe cómo quieres el template')
            return
        }

        setIsGenerating(true)
        setAiError('')

        try {
            const response = await fetch('/api/lead-scraper/generate-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al generar template')
            }

            setHtmlContent(data.html)
            setShowAiPrompt(false)
            setAiPrompt('')
        } catch (error) {
            setAiError(error instanceof Error ? error.message : 'Error desconocido')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Editor de Template</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Diseña el HTML del email. La IA rellenará los textos en los huecos <code className="bg-white/10 px-1 rounded">{'{{variable}}'}</code>
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAiPrompt(!showAiPrompt)}
                            className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-semibold rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                            🤖 Generar con IA
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 font-bold rounded-lg transition-colors ${saveSuccess
                                ? 'bg-green-500 text-white'
                                : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                } disabled:opacity-50 disabled:cursor-wait`}
                        >
                            {isSaving ? '⏳ Guardando...' : saveSuccess ? '✅ Guardado' : '💾 Guardar Template'}
                        </button>
                    </div>
                    {saveError && (
                        <p className="text-red-400 text-sm">{saveError}</p>
                    )}
                </div>
            </div>

            {/* Panel de generación con IA */}
            {showAiPrompt && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <h3 className="text-lg font-semibold text-white">Generar Template con IA</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Describe cómo quieres tu email y la IA generará el HTML completo con el estilo oscuro y las variables preparadas.
                    </p>
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ej: Quiero un email para pitch de ventas de servicios de IA. Debe tener logo arriba, 3 párrafos de contenido, un botón de respuesta y otro para visitar la web. Estilo moderno con fondo oscuro y acentos en púrpura."
                        className="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                    />
                    {aiError && (
                        <p className="text-red-400 text-sm">{aiError}</p>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={generateWithAi}
                            disabled={isGenerating}
                            className="px-5 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isGenerating ? '⏳ Generando...' : '✨ Generar Template'}
                        </button>
                        <button
                            onClick={() => setShowAiPrompt(false)}
                            className="px-5 py-2 bg-white/5 text-gray-400 font-semibold rounded-lg hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Nombre del Template */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre del Template</label>
                <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Ej: Outreach Restaurantes"
                />
            </div>

            {/* Variables disponibles */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">📝 Variables disponibles (click para insertar)</h3>
                <div className="flex flex-wrap gap-2">
                    {AI_VARIABLES.map(v => (
                        <button
                            key={v.name}
                            onClick={() => insertVariable(v.name)}
                            className="group relative px-3 py-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg text-[#a78bfa] text-sm hover:bg-[#8b5cf6]/20 transition-colors"
                            title={v.description}
                        >
                            {`{{${v.name}}}`}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {v.description}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs Editar/Preview */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveView('edit')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === 'edit' || activeView === 'preview'
                        ? 'text-[#a78bfa] border-b-2 border-[#8b5cf6]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    ✏️ Editar HTML
                </button>
                <button
                    onClick={() => setActiveView('preview')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === 'preview'
                        ? 'text-[#a78bfa] border-b-2 border-[#8b5cf6]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    👁️ Vista Previa
                </button>
            </div>

            {/* Editor / Preview */}
            <div className="min-h-[500px]">
                {activeView === 'edit' ? (
                    <textarea
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="w-full h-[500px] bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-gray-300 font-mono text-sm focus:border-[#8b5cf6] focus:outline-none resize-none"
                        placeholder="Escribe el HTML de tu template aquí..."
                        spellCheck={false}
                    />
                ) : (
                    <div className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
                        <div className="text-xs text-gray-500 mb-2 text-center">
                            Los textos en púrpura son ejemplos de donde la IA insertará contenido personalizado.
                        </div>
                        <iframe
                            srcDoc={previewHtml}
                            className="w-full h-[480px] border-0 rounded-lg"
                            title="Email Preview"
                        />
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-blue-400 font-semibold mb-2">💡 Tips para un buen template</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Usa <code className="bg-white/10 px-1 rounded">{'{{nombre}}'}</code> para el nombre del negocio</li>
                    <li>• Deja <code className="bg-white/10 px-1 rounded">{'{{parrafo_problema}}'}</code>, <code className="bg-white/10 px-1 rounded">{'{{parrafo_beneficio}}'}</code>, <code className="bg-white/10 px-1 rounded">{'{{parrafo_cierre}}'}</code> para que la IA los personalice</li>
                    <li>• Mantén el diseño simple: tablas, estilos inline, max-width 600px</li>
                    <li>• El botón CTA debe destacar con color de acento</li>
                </ul>
            </div>
        </div>
    )
}
