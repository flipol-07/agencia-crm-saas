import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InvoiceTemplate, InvoiceElement } from '@/types/database'
import { FontSelector } from './FontSelector'
import { ColorPicker } from './ColorPicker'

interface Props {
    template: InvoiceTemplate
    selectedElementId: string | null
    onChange: (updates: Partial<InvoiceTemplate>) => void
}

export function TemplateEditor({ template, selectedElementId, onChange }: Props) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bgPickerRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const config = template.config || { elements: [] }
    const selectedElement = config.elements?.find(el => el.id === selectedElementId)

    const updateElements = (elements: InvoiceElement[]) => {
        onChange({ config: { ...config, elements } })
    }

    const addElement = (type: InvoiceElement['type']) => {
        const newElement: InvoiceElement = {
            id: `el-${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: type === 'table' ? 150 : (type === 'image' ? 40 : 100),
            height: type === 'table' ? 100 : (type === 'image' ? 40 : 10),
            content: type === 'title' ? 'NUEVO TITULO' : type === 'text' ? 'Nuevo bloque de texto...' : '',
            fontSize: type === 'title' ? 24 : 10,
            fontWeight: type === 'title' ? '700' : '400',
            color: '#000000',
            align: 'left',
            opacity: 1,
            zIndex: config.elements?.length ? Math.max(...config.elements.map(e => e.zIndex || 1)) + 1 : 1
        }
        updateElements([...(config.elements || []), newElement])
    }

    const deleteElement = (id: string) => {
        updateElements((config.elements || []).filter(el => el.id !== id))
    }

    const updateSelected = (updates: Partial<InvoiceElement>) => {
        if (!selectedElementId) return
        updateElements((config.elements || []).map(el =>
            el.id === selectedElementId ? { ...el, ...updates } : el
        ))
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBackground = false) => {
        const file = e.target.files?.[0]
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
                onChange({ config: { ...config, background_url: publicUrl } })
            } else {
                updateSelected({ src: publicUrl })
            }
        } catch (error) {
            console.error('Error uploading:', error)
            alert('Error al subir la imagen. Asegúrate de que el bucket "invoice-assets" exista.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="h-full p-4 overflow-y-auto w-full transition-all duration-300">
            <h2 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <span className="text-lime-400">⚡</span> Propiedades de Diseño
            </h2>

            {/* ELEMENTS ADDER */}
            <div className="mb-10">
                <h3 className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-4">Añadir Bloques</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => addElement('title')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Título</button>
                    <button onClick={() => addElement('text')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Texto</button>
                    <button onClick={() => addElement('image')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Imagen</button>
                    <button onClick={() => addElement('table')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Tabla Items</button>
                    <button onClick={() => addElement('issuer')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Mis Datos</button>
                    <button onClick={() => addElement('recipient')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Cliente</button>
                    <button onClick={() => addElement('invoice_number')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Nº Factura</button>
                    <button onClick={() => addElement('total')} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 text-white">+ Totales</button>
                </div>
            </div>

            {/* SELECTED ELEMENT PROPERTIES */}
            {selectedElement ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h3 className="text-lime-400 font-bold uppercase text-xs">Propiedades ({selectedElement.type})</h3>
                        <button onClick={() => deleteElement(selectedElement.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">Eliminar</button>
                    </div>

                    <div className="space-y-4">
                        {/* Content (Conditional) */}
                        {(selectedElement.type === 'title' || selectedElement.type === 'text') && (
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Contenido</label>
                                <textarea
                                    value={selectedElement.content || ''}
                                    onChange={(e) => updateSelected({ content: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-lime-400 outline-none h-24"
                                />
                            </div>
                        )}

                        {/* Image Source & Upload */}
                        {selectedElement.type === 'image' && (
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Gestión de Imagen</label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full bg-lime-400/10 border border-lime-400/30 text-lime-400 py-2 rounded-lg text-xs font-black hover:bg-lime-400/20 transition-all uppercase"
                                    >
                                        {uploading ? 'SUBIENDO...' : 'ELegir de Galería / Subir'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="h-[1px] bg-white/10 flex-1" />
                                        <span className="text-[10px] text-gray-500 font-bold">O URL</span>
                                        <div className="h-[1px] bg-white/10 flex-1" />
                                    </div>
                                    <input
                                        type="text"
                                        value={selectedElement.src || ''}
                                        onChange={(e) => updateSelected({ src: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Styling */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tamaño Fuente</label>
                                <input
                                    type="number"
                                    value={selectedElement.fontSize || 10}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value)
                                        updateSelected({ fontSize: isNaN(val) ? 10 : val })
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Peso</label>
                                <select
                                    value={selectedElement.fontWeight || '400'}
                                    onChange={(e) => updateSelected({ fontWeight: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-lime-400 [&>option]:bg-black"
                                >
                                    <option value="400">Normal</option>
                                    <option value="600">Semibold</option>
                                    <option value="700">Bold</option>
                                    <option value="900">Black</option>
                                </select>
                            </div>
                        </div>

                        {/* Font Selector Integration */}
                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tipografía</label>
                            <FontSelector
                                value={selectedElement.fontFamily || 'Inter'}
                                onChange={(font) => updateSelected({ fontFamily: font })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Opacidad ({Math.round((selectedElement.opacity || 1) * 100)}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={selectedElement.opacity || 1}
                                    onChange={(e) => updateSelected({ opacity: parseFloat(e.target.value) })}
                                    className="w-full accent-lime-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Capa (Z-Index)</label>
                                <div className="flex gap-2">
                                    <button onClick={() => updateSelected({ zIndex: Math.max(0, (selectedElement.zIndex || 1) - 1) })} className="flex-1 bg-white/5 border border-white/10 rounded py-2 text-[10px] font-bold text-gray-400 hover:text-white">BAJAR</button>
                                    <button onClick={() => updateSelected({ zIndex: (selectedElement.zIndex || 1) + 1 })} className="flex-1 bg-white/5 border border-white/10 rounded py-2 text-[10px] font-bold text-gray-400 hover:text-white">SUBIR</button>
                                </div>
                            </div>
                        </div>

                        <ColorPicker
                            label="Color del Texto / Borde"
                            value={selectedElement.color}
                            onChange={(color) => updateSelected({ color })}
                        />

                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Alineación</label>
                            <div className="flex gap-1">
                                {['left', 'center', 'right'].map(align => (
                                    <button
                                        key={align}
                                        onClick={() => updateSelected({ align: align as any })}
                                        className={`flex-1 py-2 text-xs font-bold rounded capitalize tracking-widest transition-all ${selectedElement.align === align ? 'bg-lime-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dimensions & Position */}
                        <div className="pt-4 border-t border-white/5">
                            <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Posición y Tamaño (mm)</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div>
                                    <label className="text-[8px] text-gray-600 font-bold uppercase mb-1 block">X</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.x) || 0}
                                        onChange={(e) => updateSelected({ x: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] text-gray-600 font-bold uppercase mb-1 block">Y</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.y) || 0}
                                        onChange={(e) => updateSelected({ y: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] text-gray-600 font-bold uppercase mb-1 block">Ancho</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.width || 0)}
                                        onChange={(e) => updateSelected({ width: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] text-gray-600 font-bold uppercase mb-1 block">Alto</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.height || 0)}
                                        onChange={(e) => updateSelected({ height: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl p-6">
                    <p className="text-gray-500 text-sm mb-2 font-medium">Selecciona un elemento en el lienzo para editar sus propiedades</p>
                    <span className="text-2xl opacity-20">🖱️</span>
                </div>
            )}

            {/* CANVAS BACKGROUND (IMAGE UPLOAD) */}
            <div className="mt-12 pt-8 border-t border-white/10 pb-10">
                <h3 className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-4">Diseño Base de Canva</h3>
                <div className="space-y-4">
                    <button
                        onClick={() => bgPickerRef.current?.click()}
                        disabled={uploading}
                        className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                        {uploading ? 'SUBIENDO FONDO...' : 'Subir Imagen de Canva (Fondo)'}
                    </button>
                    <input
                        type="file"
                        ref={bgPickerRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                    />

                    <div className="flex items-center gap-2 py-1">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <span className="text-[8px] text-gray-500 font-black">O PEGA EL LINK ABAJO</span>
                        <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    <input
                        type="text"
                        placeholder="URL de Imagen de Fondo..."
                        value={template.config?.background_url || ''}
                        onChange={(e) => onChange({ config: { ...template.config, background_url: e.target.value } })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-lime-400"
                    />

                    <div className="p-4 bg-lime-400/5 border border-lime-400/10 rounded-xl">
                        <p className="text-[10px] text-lime-400 font-bold uppercase mb-1">Tip de Diseño:</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">Para mejores resultados, exporta tu diseño de Canva en formato A4 y súbelo aquí. Usa Aurie para añadir los datos dinámicos encima.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
