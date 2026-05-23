import { useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Building2,
    CalendarDays,
    FileText,
    Hash,
    ImageIcon,
    Layers,
    Link2,
    Minus,
    Move,
    PanelRight,
    Pilcrow,
    Square,
    Table2,
    Trash2,
    Type,
    Upload,
    UserRound,
    WalletCards,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { InvoiceElement, InvoiceTemplate } from '@/types/database'
import { DEFAULT_INVOICE_FONT } from '@/features/invoices/lib/invoice-fonts'
import { FontSelector } from './FontSelector'
import { ColorPicker } from './ColorPicker'

interface Props {
    template: InvoiceTemplate
    selectedElementId: string | null
    onChange: (updates: Partial<InvoiceTemplate>) => void
}

interface InsertOption {
    type: InvoiceElement['type']
    label: string
    Icon: LucideIcon
}

const INSERT_OPTIONS: InsertOption[] = [
    { type: 'title', label: 'Título', Icon: Type },
    { type: 'text', label: 'Texto', Icon: Pilcrow },
    { type: 'image', label: 'Imagen', Icon: ImageIcon },
    { type: 'table', label: 'Tabla', Icon: Table2 },
    { type: 'issuer', label: 'Emisor', Icon: Building2 },
    { type: 'recipient', label: 'Cliente', Icon: UserRound },
    { type: 'invoice_number', label: 'Número', Icon: Hash },
    { type: 'date', label: 'Fecha', Icon: CalendarDays },
    { type: 'total', label: 'Totales', Icon: WalletCards },
    { type: 'square', label: 'Forma', Icon: Square },
    { type: 'line', label: 'Línea', Icon: Minus },
]

const WEIGHTS = [
    { value: '400', label: 'Normal' },
    { value: '600', label: 'Semi' },
    { value: '700', label: 'Bold' },
    { value: '900', label: 'Black' },
]

const ALIGN_OPTIONS = [
    { value: 'left', label: 'Izquierda', Icon: AlignLeft },
    { value: 'center', label: 'Centro', Icon: AlignCenter },
    { value: 'right', label: 'Derecha', Icon: AlignRight },
] as const

const inputClass = 'h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition-colors focus:border-brand'
const tinyLabelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500'

function numberValue(value: string, fallback = 0): number {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="border-t border-white/10 pt-4">
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{title}</h3>
            {children}
        </section>
    )
}

export function TemplateEditor({ template, selectedElementId, onChange }: Props) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bgPickerRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const config = template.config || { elements: [] }
    const elements = config.elements || []
    const selectedElement = elements.find(el => el.id === selectedElementId)
    const selectedLabel = selectedElement ? INSERT_OPTIONS.find(item => item.type === selectedElement.type)?.label || selectedElement.type : null

    const updateConfig = (updates: Partial<typeof config>) => {
        onChange({ config: { ...config, ...updates } })
    }

    const updateElements = (nextElements: InvoiceElement[]) => {
        updateConfig({ elements: nextElements })
    }

    const addElement = (type: InvoiceElement['type']) => {
        const isLine = type === 'line'
        const isImage = type === 'image'
        const isTable = type === 'table'
        const newElement: InvoiceElement = {
            id: `el-${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: isTable ? 150 : isImage ? 40 : isLine ? 100 : 100,
            height: isTable ? 100 : isImage ? 40 : isLine ? 1 : 10,
            content: type === 'title' ? 'Nuevo título' : type === 'text' ? 'Nuevo texto' : '',
            fontSize: type === 'title' ? 24 : 10,
            fontWeight: type === 'title' ? '700' : '400',
            fontFamily: config.global_font || DEFAULT_INVOICE_FONT,
            color: '#111827',
            align: 'left',
            opacity: 1,
            zIndex: elements.length ? Math.max(...elements.map(element => element.zIndex || 1)) + 1 : 1
        }
        updateElements([...elements, newElement])
    }

    const deleteElement = (id: string) => {
        updateElements(elements.filter(el => el.id !== id))
    }

    const updateSelected = (updates: Partial<InvoiceElement>) => {
        if (!selectedElementId) return
        updateElements(elements.map(el =>
            el.id === selectedElementId ? { ...el, ...updates } : el
        ))
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isBackground = false) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('invoice-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('invoice-assets')
                .getPublicUrl(filePath)

            if (isBackground) {
                updateConfig({ background_url: publicUrl })
            } else {
                updateSelected({ src: publicUrl })
            }
        } catch (error) {
            console.error('Error uploading:', error)
            alert('Error al subir la imagen. Revisa el bucket "invoice-assets".')
        } finally {
            setUploading(false)
            event.target.value = ''
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-950/80 text-white">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand">Diseñador</p>
                        <h2 className="truncate text-sm font-semibold text-white">Editor de factura</h2>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-gray-400">
                        <PanelRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-4">
                <Section title="Insertar">
                    <div className="grid grid-cols-3 gap-2">
                        {INSERT_OPTIONS.map(({ type, label, Icon }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => addElement(type)}
                                className="flex h-[58px] flex-col items-center justify-center gap-1 rounded-md border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-gray-300 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-white"
                                title={`Insertar ${label}`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                {selectedElement ? (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="rounded-lg border border-brand/25 bg-brand/10 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Seleccionado</p>
                                    <p className="truncate text-sm font-semibold text-white">{selectedLabel}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => deleteElement(selectedElement.id)}
                                    className="flex h-9 w-9 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                                    title="Eliminar elemento"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {(selectedElement.type === 'title' || selectedElement.type === 'text') && (
                            <Section title="Contenido">
                                <textarea
                                    value={selectedElement.content || ''}
                                    onChange={(event) => updateSelected({ content: event.target.value })}
                                    className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-black/30 p-3 text-sm text-white outline-none transition-colors focus:border-brand"
                                />
                            </Section>
                        )}

                        {selectedElement.type === 'image' && (
                            <Section title="Imagen">
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-brand/30 bg-brand/10 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {uploading ? 'Subiendo' : 'Subir imagen'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(event) => handleFileUpload(event)}
                                    />
                                    <div className="relative">
                                        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={selectedElement.src || ''}
                                            onChange={(event) => updateSelected({ src: event.target.value })}
                                            className={`${inputClass} pl-9`}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        <Section title="Texto">
                            <div className="space-y-3">
                                <div>
                                    <label className={tinyLabelClass}>Tipografía</label>
                                    <FontSelector
                                        value={selectedElement.fontFamily || config.global_font || DEFAULT_INVOICE_FONT}
                                        onChange={(font) => updateSelected({ fontFamily: font })}
                                    />
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <div>
                                        <label className={tinyLabelClass}>Tamaño</label>
                                        <input
                                            type="number"
                                            min="4"
                                            max="96"
                                            value={selectedElement.fontSize || 10}
                                            onChange={(event) => updateSelected({ fontSize: numberValue(event.target.value, 10) })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={tinyLabelClass}>Peso</label>
                                        <div className="flex h-10 overflow-hidden rounded-md border border-white/10 bg-black/30">
                                            {WEIGHTS.map(weight => (
                                                <button
                                                    key={weight.value}
                                                    type="button"
                                                    onClick={() => updateSelected({ fontWeight: weight.value })}
                                                    className={`min-w-12 px-2 text-[10px] font-bold transition-colors ${String(selectedElement.fontWeight || '400') === weight.value ? 'bg-brand text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                    title={weight.label}
                                                >
                                                    {weight.value === '700' ? <Bold className="mx-auto h-4 w-4" /> : weight.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={tinyLabelClass}>Alineación</label>
                                    <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10 bg-black/30">
                                        {ALIGN_OPTIONS.map(({ value, label, Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => updateSelected({ align: value })}
                                                className={`flex h-10 items-center justify-center transition-colors ${selectedElement.align === value ? 'bg-brand text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                title={label}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Color">
                            <div className="grid grid-cols-1 gap-3">
                                <ColorPicker
                                    label="Texto y borde"
                                    value={selectedElement.borderColor || selectedElement.color}
                                    onChange={(color) => updateSelected({ borderColor: color, color })}
                                />
                                <ColorPicker
                                    label="Fondo"
                                    value={selectedElement.backgroundColor || 'transparent'}
                                    onChange={(color) => updateSelected({ backgroundColor: color })}
                                    allowTransparent
                                />
                            </div>
                        </Section>

                        <Section title="Apariencia">
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Opacidad</label>
                                        <span className="text-[10px] font-semibold text-gray-400">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={selectedElement.opacity || 1}
                                        onChange={(event) => updateSelected({ opacity: numberValue(event.target.value, 1) })}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-brand"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Borde</label>
                                        <span className="text-[10px] font-semibold text-gray-400">{selectedElement.borderWidth || 0}mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        value={selectedElement.borderWidth || 0}
                                        onChange={(event) => updateSelected({ borderWidth: numberValue(event.target.value, 0) })}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-brand"
                                    />
                                </div>
                                <div>
                                    <label className={tinyLabelClass}>Capa</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateSelected({ zIndex: Math.max(0, (selectedElement.zIndex || 1) - 1) })}
                                            className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                        >
                                            <Layers className="h-4 w-4" />
                                            Bajar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSelected({ zIndex: (selectedElement.zIndex || 1) + 1 })}
                                            className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                        >
                                            <Layers className="h-4 w-4" />
                                            Subir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Posición">
                            <div className="grid grid-cols-2 gap-3">
                                <label>
                                    <span className={tinyLabelClass}>X</span>
                                    <input type="number" step="0.1" value={selectedElement.x ?? 0} onChange={(event) => updateSelected({ x: numberValue(event.target.value) })} className={inputClass} />
                                </label>
                                <label>
                                    <span className={tinyLabelClass}>Y</span>
                                    <input type="number" step="0.1" value={selectedElement.y ?? 0} onChange={(event) => updateSelected({ y: numberValue(event.target.value) })} className={inputClass} />
                                </label>
                                <label>
                                    <span className={tinyLabelClass}>Ancho</span>
                                    <input type="number" step="0.1" value={selectedElement.width ?? 0} onChange={(event) => updateSelected({ width: numberValue(event.target.value) })} className={inputClass} />
                                </label>
                                <label>
                                    <span className={tinyLabelClass}>Alto</span>
                                    <input type="number" step="0.1" value={selectedElement.height ?? 0} onChange={(event) => updateSelected({ height: numberValue(event.target.value) })} className={inputClass} />
                                </label>
                            </div>
                        </Section>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
                        <Move className="mx-auto mb-3 h-5 w-5 text-gray-600" />
                        <h3 className="text-sm font-semibold text-white">Sin selección</h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">Elige un elemento del lienzo para editar tipografía, color, posición y capas.</p>
                    </div>
                )}

                <Section title="Página">
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => bgPickerRef.current?.click()}
                            disabled={uploading}
                            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] text-xs font-bold uppercase tracking-wider text-gray-200 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4" />
                            {uploading ? 'Subiendo fondo' : 'Subir fondo A4'}
                        </button>
                        <input
                            type="file"
                            ref={bgPickerRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(event) => handleFileUpload(event, true)}
                        />
                        <div className="relative">
                            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="URL de fondo"
                                value={template.config?.background_url || ''}
                                onChange={(event) => updateConfig({ background_url: event.target.value })}
                                className={`${inputClass} pl-9`}
                            />
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    )
}
