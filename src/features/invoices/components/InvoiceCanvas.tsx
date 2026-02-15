'use client'

import { useRef, useState, useEffect } from 'react'
import type { InvoiceTemplate, InvoiceWithDetails, Settings, InvoiceElement } from '@/types/database'
import { AlignmentGuides } from './builder/AlignmentGuides'
import { useElementSnapping } from '../hooks/useElementSnapping'

interface Props {
    template: InvoiceTemplate
    invoice: InvoiceWithDetails
    settings: Settings | null
    editable?: boolean
    selectedElementId?: string | null
    onSelectElement?: (id: string | null) => void
    onUpdateTemplate?: (updates: Partial<InvoiceTemplate>) => void
    onUpdateItem?: (itemId: string, updates: any) => void
    onUpdateInvoice?: (updates: any) => void
    items: any[] // We pass items separately because they might be stateful in the parent
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export function InvoiceCanvas({
    template,
    invoice,
    settings,
    items,
    editable = false,
    selectedElementId,
    onSelectElement,
    onUpdateTemplate,
    onUpdateItem,
    onUpdateInvoice
}: Props) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isResizing, setIsResizing] = useState<string | null>(null) // handle direction e.g. 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elX: 0, elY: 0 })

    const { getSnappedPosition, snapLines, clearSnapLines } = useElementSnapping({
        elements: template.config?.elements || [],
        canvasWidth: A4_WIDTH_MM,
        canvasHeight: A4_HEIGHT_MM,
        snapThreshold: 3
    })

    const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
        if (!editable || isResizing) return

        // Prevent drag if we are clicking inside a contentEditable
        const target = e.target as HTMLElement
        if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'INPUT') {
            return
        }

        e.preventDefault()
        e.stopPropagation()
        onSelectElement?.(elementId)

        const element = template.config?.elements.find(el => el.id === elementId)
        if (!element || !canvasRef.current) return

        const canvasRect = canvasRef.current.getBoundingClientRect()
        const scale = canvasRect.width / A4_WIDTH_MM

        const startX = e.clientX
        const startY = e.clientY

        setIsDragging(true)
        setDragOffset({ x: (startX / scale) - element.x, y: (startY / scale) - element.y })
    }

    const handleResizeMouseDown = (e: React.MouseEvent, direction: string, elementId: string) => {
        if (!editable) return
        e.preventDefault()
        e.stopPropagation()

        const element = template.config?.elements.find(el => el.id === elementId)
        if (!element || !canvasRef.current) return

        const canvasRect = canvasRef.current.getBoundingClientRect()
        const scale = canvasRect.width / A4_WIDTH_MM

        setIsResizing(direction)
        setResizeStart({
            x: e.clientX / scale,
            y: e.clientY / scale,
            width: element.width || 50,
            height: element.height || 20,
            elX: element.x,
            elY: element.y
        })
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!template || !canvasRef.current || !onUpdateTemplate) return
            const canvasRect = canvasRef.current.getBoundingClientRect()
            const scale = canvasRect.width / A4_WIDTH_MM

            if (isDragging && selectedElementId) {
                // Calculate raw position
                const rawX = (e.clientX / scale) - dragOffset.x
                const rawY = (e.clientY / scale) - dragOffset.y

                // Apply Snapping
                const { x: snappedX, y: snappedY } = getSnappedPosition(selectedElementId, rawX, rawY)

                // Constrain to A4
                const clampedX = Math.max(0, Math.min(snappedX, A4_WIDTH_MM - 10))
                const clampedY = Math.max(0, Math.min(snappedY, A4_HEIGHT_MM - 10))

                const newElements = template.config.elements.map(el =>
                    el.id === selectedElementId ? { ...el, x: clampedX, y: clampedY } : el
                )

                onUpdateTemplate({ config: { ...template.config, elements: newElements } })
            } else if (isResizing && selectedElementId) {
                const element = template.config.elements.find(el => el.id === selectedElementId)
                if (!element) return

                const currentX = e.clientX / scale
                const currentY = e.clientY / scale
                const dx = currentX - resizeStart.x
                const dy = currentY - resizeStart.y

                let newX = element.x
                let newY = element.y
                let newWidth = element.width || 50
                let newHeight = element.height || 20

                if (isResizing.includes('e')) newWidth = Math.max(5, resizeStart.width + dx)
                if (isResizing.includes('s')) newHeight = Math.max(5, resizeStart.height + dy)
                if (isResizing.includes('w')) {
                    const deltaX = Math.min(dx, resizeStart.width - 5)
                    newX = resizeStart.elX + deltaX
                    newWidth = resizeStart.width - deltaX
                }
                if (isResizing.includes('n')) {
                    const deltaY = Math.min(dy, resizeStart.height - 5)
                    newY = resizeStart.elY + deltaY
                    newHeight = resizeStart.height - deltaY
                }

                // Page boundaries
                newX = Math.max(0, Math.min(newX, A4_WIDTH_MM - 5))
                newY = Math.max(0, Math.min(newY, A4_HEIGHT_MM - 5))
                newWidth = Math.min(newWidth, A4_WIDTH_MM - newX)
                newHeight = Math.min(newHeight, A4_HEIGHT_MM - newY)

                const newElements = template.config.elements.map(el =>
                    el.id === selectedElementId ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight } : el
                )

                onUpdateTemplate({ config: { ...template.config, elements: newElements } })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(null)
            clearSnapLines()
        }

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, isResizing, selectedElementId, template, dragOffset, resizeStart, onUpdateTemplate, getSnappedPosition, clearSnapLines])

    const client = invoice.contacts

    const handleContentEdit = (id: string, newContent: string) => {
        if (!onUpdateTemplate) return
        const newElements = template.config.elements.map(el =>
            el.id === id ? { ...el, content: newContent } : el
        )
        onUpdateTemplate({ config: { ...template.config, elements: newElements } })
    }

    const getElementStyles = (el: InvoiceElement) => ({
        left: `${el.x}mm`,
        top: `${el.y}mm`,
        width: el.width ? `${el.width}mm` : 'auto',
        height: el.height ? `${el.height}mm` : 'auto',
        color: el.color || 'black',
        fontFamily: el.fontFamily || 'Inter',
        fontSize: el.fontSize ? `${el.fontSize}pt` : '10pt',
        fontWeight: el.fontWeight || 'normal',
        textAlign: el.align as any || 'left',
        opacity: el.opacity !== undefined ? el.opacity : 1,
        backgroundColor: el.backgroundColor || 'transparent',
        border: el.borderWidth ? `${el.borderWidth}mm solid ${el.borderColor || el.color || '#000'}` : 'none',
        boxSizing: 'border-box' as const,
        borderRadius: el.type === 'total' || el.id.includes('box') || el.type === 'square' ? (el.type === 'square' ? '0px' : '4px') : '0px',
        display: el.type === 'line' ? 'block' : 'initial',
        zIndex: el.zIndex || 1
    })

    return (
        <div
            ref={canvasRef}
            onClick={() => !isDragging && !isResizing && onSelectElement?.(null)}
            className="invoice-print-container bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex-shrink-0 transition-shadow duration-500 origin-top print:shadow-none print:m-0 print:p-0 print:fixed print:top-0 print:left-0"
            style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: '#ffffff',
                backgroundImage: template.config?.background_url ? `url(${template.config.background_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {editable && <AlignmentGuides lines={snapLines} />}

            {template.config?.elements?.map((el) => {
                const isSelected = selectedElementId === el.id && editable

                return (
                    <div
                        key={el.id}
                        onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                        className={`absolute ${editable ? 'cursor-move group' : ''} transition-all duration-200 ease-out ${isSelected ? 'ring-1 ring-brand ring-offset-0 z-50 shadow-[0_0_30px_rgba(139,92,246,0.3)]' : ''}`}
                        style={getElementStyles(el)}
                    >
                        {el.type === 'title' && (
                            <h1
                                contentEditable={editable}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit(el.id, e.currentTarget.innerText)}
                                className="m-0 p-0 leading-tight focus:outline-none focus:bg-brand/5 focus:ring-2 focus:ring-brand/20 rounded px-1 transition-all"
                                style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                            >
                                {el.content || 'TITULO'}
                            </h1>
                        )}
                        {el.type === 'text' && (
                            <div
                                contentEditable={editable}
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentEdit(el.id, e.currentTarget.innerText)}
                                className="m-0 p-0 leading-normal whitespace-pre-line focus:outline-none focus:bg-brand/5 focus:ring-2 focus:ring-brand/20 rounded px-1 transition-all"
                                style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                            >
                                {el.content || 'Escribe algo...'}
                            </div>
                        )}
                        {el.type === 'invoice_number' && (
                            <div
                                contentEditable={editable}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateInvoice?.({ invoice_number: e.currentTarget.innerText.replace('#', '') })}
                                className="m-0 p-0 font-mono focus:outline-none focus:bg-[#8b5cf6]/5"
                                style={{ fontSize: 'inherit' }}
                            >
                                #{invoice.invoice_number}
                            </div>
                        )}
                        {el.type === 'date' && (
                            <div
                                contentEditable={editable}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateInvoice?.({ issue_date: e.currentTarget.innerText })}
                                className="m-0 p-0 focus:outline-none focus:bg-[#8b5cf6]/5"
                                style={{ fontSize: 'inherit' }}
                            >
                                {invoice.issue_date}
                            </div>
                        )}

                        {el.type === 'issuer' && (
                            <div style={{ fontSize: 'inherit', textAlign: 'inherit' }}>
                                <p className="font-bold leading-tight" style={{ fontSize: '1.2em', color: 'inherit' }}>{settings?.company_name}</p>
                                <p className="opacity-70 whitespace-pre-line leading-tight" style={{ fontSize: '0.9em', color: 'inherit' }}>{settings?.address}</p>
                                <p className="opacity-70 leading-tight" style={{ fontSize: '0.9em', color: 'inherit' }}>{settings?.tax_id}</p>
                            </div>
                        )}

                        {el.type === 'recipient' && (
                            <div style={{ fontSize: 'inherit', textAlign: 'inherit' }}>
                                <h3 className="font-bold uppercase tracking-widest opacity-50 mb-1" style={{ fontSize: '0.8em', color: 'inherit' }}>Cliente</h3>
                                <p className="font-bold leading-tight" style={{ fontSize: '1.2em', color: 'inherit' }}>{client?.company_name}</p>
                                <p className="opacity-70 leading-tight" style={{ fontSize: '0.9em', color: 'inherit' }}>{client?.tax_address}</p>
                            </div>
                        )}

                        {el.type === 'image' && el.src && (
                            <img src={el.src} alt="" className="w-full h-full object-contain pointer-events-none" />
                        )}

                        {(el.type === 'square' || el.type === 'line') && (
                            <div className="w-full h-full" style={el.type === 'line' ? { backgroundColor: el.color || '#000' } : {}} />
                        )}

                        {el.type === 'table' && (
                            <div className="w-full" style={{ fontSize: 'inherit', textAlign: 'inherit' }}>
                                <table className="w-full border-collapse" style={{ color: 'inherit' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${el.color || '#e5e7eb'}` }}>
                                            <th className="py-3 text-left font-bold uppercase tracking-wider opacity-60" style={{ fontSize: '0.7em', color: 'inherit' }}>Descripción</th>
                                            <th className="py-3 text-center font-bold uppercase tracking-wider opacity-60" style={{ fontSize: '0.7em', color: 'inherit' }}>Cant.</th>
                                            <th className="py-3 text-right font-bold uppercase tracking-wider opacity-60" style={{ fontSize: '0.7em', color: 'inherit' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.slice(0, 15).map((item: any, idx: number) => (
                                            <tr key={item.id} className={`border-b border-gray-50/50 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/30'}`} style={{ color: 'inherit' }}>
                                                <td className="py-3 pl-2">
                                                    <div
                                                        contentEditable={editable}
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => onUpdateItem?.(item.id, { description: e.currentTarget.innerText })}
                                                        className="focus:outline-none focus:bg-brand/5 focus:ring-1 focus:ring-brand/20 rounded px-1"
                                                        style={{ fontSize: '0.9em', color: 'inherit', fontWeight: 500 }}
                                                    >
                                                        {item.description}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div
                                                        contentEditable={editable}
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => {
                                                            const qty = parseFloat(e.currentTarget.innerText) || 0
                                                            onUpdateItem?.(item.id, {
                                                                quantity: qty,
                                                                total_price: qty * (item.unit_price || 0)
                                                            })
                                                        }}
                                                        className="focus:outline-none focus:bg-brand/5 focus:ring-1 focus:ring-brand/20 rounded px-1"
                                                        style={{ fontSize: '0.9em', color: 'inherit', opacity: 0.8 }}
                                                    >
                                                        {item.quantity}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right pr-2 font-bold tabular-nums">
                                                    <div
                                                        contentEditable={editable}
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => {
                                                            const total = parseFloat(e.currentTarget.innerText.replace('€', '').replace(',', '.')) || 0
                                                            onUpdateItem?.(item.id, { total_price: total })
                                                        }}
                                                        className="focus:outline-none focus:bg-brand/5 focus:ring-1 focus:ring-brand/20 rounded px-1"
                                                        style={{ fontSize: '0.9em', color: 'inherit' }}
                                                    >
                                                        {item.total_price.toFixed(2)}€
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {el.type === 'total' && (
                            <div className="space-y-1" style={{ fontSize: 'inherit', textAlign: 'inherit' }}>
                                <div className="flex flex-col" style={{ alignItems: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start' }}>
                                    <div className="flex justify-between gap-4 opacity-50 w-full max-w-[200px]" style={{ fontSize: '0.8em', color: 'inherit' }}>
                                        <span>SUBTOTAL</span>
                                        <div
                                            contentEditable={editable}
                                            suppressContentEditableWarning
                                            onBlur={(e) => onUpdateInvoice?.({ subtotal: parseFloat(e.currentTarget.innerText.replace('€', '').replace(',', '.')) || 0 })}
                                            className="focus:outline-none focus:bg-[#8b5cf6]/5"
                                        >
                                            {invoice.subtotal.toFixed(2)}€
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-4 opacity-50 w-full max-w-[200px]" style={{ fontSize: '0.8em', color: 'inherit' }}>
                                        <span>IVA ({invoice.tax_rate}%)</span>
                                        <div
                                            contentEditable={editable}
                                            suppressContentEditableWarning
                                            onBlur={(e) => onUpdateInvoice?.({ tax_amount: parseFloat(e.currentTarget.innerText.replace('€', '').replace(',', '.')) || 0 })}
                                            className="focus:outline-none focus:bg-[#8b5cf6]/5"
                                        >
                                            {invoice.tax_amount.toFixed(2)}€
                                        </div>
                                    </div>
                                    {invoice.irpf_rate > 0 && (
                                        <div className="flex justify-between gap-4 opacity-50 w-full max-w-[200px]" style={{ fontSize: '0.8em', color: 'inherit' }}>
                                            <span>IRPF (-{invoice.irpf_rate}%)</span>
                                            <div
                                                contentEditable={editable}
                                                suppressContentEditableWarning
                                                onBlur={(e) => onUpdateInvoice?.({ irpf_amount: parseFloat(e.currentTarget.innerText.replace('€', '').replace(',', '.')) || 0 })}
                                                className="focus:outline-none focus:bg-[#8b5cf6]/5"
                                            >
                                                -{invoice.irpf_amount?.toFixed(2) || '0.00'}€
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-4 font-black w-full max-w-[200px] mt-2 pt-2 border-t border-current/10" style={{ fontSize: '1.8em', color: 'inherit' }}>
                                        <span>TOTAL</span>
                                        <div
                                            contentEditable={editable}
                                            suppressContentEditableWarning
                                            onBlur={(e) => onUpdateInvoice?.({ total: parseFloat(e.currentTarget.innerText.replace('€', '').replace(',', '.')) || 0 })}
                                            className="focus:outline-none focus:bg-[#8b5cf6]/5"
                                        >
                                            {(invoice.subtotal + invoice.tax_amount - (invoice.irpf_amount || 0)).toFixed(2)}€
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resize Handles */}
                        {isSelected && (
                            <>
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'nw', el.id)} className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-[#8b5cf6] cursor-nw-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'n', el.id)} className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-1 bg-[#8b5cf6] cursor-n-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne', el.id)} className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-[#8b5cf6] cursor-ne-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'e', el.id)} className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-3 bg-[#8b5cf6] cursor-e-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'se', el.id)} className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-[#8b5cf6] cursor-se-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 's', el.id)} className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-1 bg-[#8b5cf6] cursor-s-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw', el.id)} className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-[#8b5cf6] cursor-sw-resize z-[60]" />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, 'w', el.id)} className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-3 bg-[#8b5cf6] cursor-w-resize z-[60]" />
                            </>
                        )}

                        {/* Border for selection in editor */}
                        {editable && !isSelected && (
                            <div className="absolute inset-0 border border-[#8b5cf6]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
