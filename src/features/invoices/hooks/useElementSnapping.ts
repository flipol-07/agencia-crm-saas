import { useState, useCallback } from 'react'
import { InvoiceElement } from '@/types/database'

interface Rect {
    x: number
    y: number
    width: number
    height: number
}

interface SnapLine {
    id: string
    type: 'vertical' | 'horizontal'
    position: number // x or y value in mm
    start: number // start coordinate (y for vertical, x for horizontal)
    end: number // end coordinate
}

interface UseElementSnappingProps {
    elements: InvoiceElement[]
    canvasWidth: number // in mm
    canvasHeight: number // in mm
    snapThreshold?: number // in mm, default 5
}

export function useElementSnapping({
    elements,
    canvasWidth,
    canvasHeight,
    snapThreshold = 2 // 2mm snapping distance
}: UseElementSnappingProps) {
    const [snapLines, setSnapLines] = useState<SnapLine[]>([])

    const getSnappedPosition = useCallback((
        draggedElementId: string,
        currentX: number,
        currentY: number
    ): { x: number, y: number } => {
        const draggedElement = elements.find(el => el.id === draggedElementId)
        if (!draggedElement) return { x: currentX, y: currentY }

        // Element dimensions (fallback to defaults if not set, usually width is auto so this is an approximation for non-sized elements)
        // For accurate snapping we ideally need the exact width/height. 
        // We'll assume the passed X/Y are top-left.
        const width = draggedElement.width || 0
        const height = draggedElement.height || 0

        // Center points of dragged element
        const centerX = currentX + (width / 2)
        const centerY = currentY + (height / 2)
        const rightX = currentX + width
        const bottomY = currentY + height

        let newX = currentX
        let newY = currentY
        const activeSnapLines: SnapLine[] = []

        // --- VERTICAL SNAPPING (X Axis) ---
        let snappedX = false

        // 1. Snap to Canvas Center
        const canvasCenterX = canvasWidth / 2
        if (Math.abs(centerX - canvasCenterX) < snapThreshold) {
            newX = canvasCenterX - (width / 2)
            activeSnapLines.push({
                id: 'canvas-center-v',
                type: 'vertical',
                position: canvasCenterX,
                start: 0,
                end: canvasHeight
            })
            snappedX = true
        }

        // 2. Snap to Canvas Edges (Left/Right margins) - optional, e.g. 20mm margin
        if (!snappedX) {
            // ... logic for margins if needed
        }

        // 3. Snap to other elements (Left, Center, Right)
        if (!snappedX) {
            for (const el of elements) {
                if (el.id === draggedElementId) continue

                const elWidth = el.width || 0
                const elLeft = el.x
                const elCenter = el.x + (elWidth / 2)
                const elRight = el.x + elWidth

                // Snap Left to Left
                if (Math.abs(currentX - elLeft) < snapThreshold) {
                    newX = elLeft
                    activeSnapLines.push({ id: `snap-${el.id}-l-l`, type: 'vertical', position: elLeft, start: Math.min(currentY, el.y), end: Math.max(bottomY, el.y + (el.height || 0)) })
                    snappedX = true; break
                }
                // Snap Center to Center
                if (Math.abs(centerX - elCenter) < snapThreshold) {
                    newX = elCenter - (width / 2)
                    activeSnapLines.push({ id: `snap-${el.id}-c-c`, type: 'vertical', position: elCenter, start: Math.min(currentY, el.y), end: Math.max(bottomY, el.y + (el.height || 0)) })
                    snappedX = true; break
                }
                // Snap Right to Right
                if (Math.abs(rightX - elRight) < snapThreshold) {
                    newX = elRight - width
                    activeSnapLines.push({ id: `snap-${el.id}-r-r`, type: 'vertical', position: elRight, start: Math.min(currentY, el.y), end: Math.max(bottomY, el.y + (el.height || 0)) })
                    snappedX = true; break
                }
            }
        }

        // --- HORIZONTAL SNAPPING (Y Axis) ---
        let snappedY = false

        // 1. Snap to other elements (Top, Center, Bottom)
        for (const el of elements) {
            if (el.id === draggedElementId) continue

            const elHeight = el.height || 0
            const elTop = el.y
            const elCenter = el.y + (elHeight / 2)
            const elBottom = el.y + elHeight

            // Snap Top to Top
            if (Math.abs(currentY - elTop) < snapThreshold) {
                newY = elTop
                activeSnapLines.push({ id: `snap-${el.id}-t-t`, type: 'horizontal', position: elTop, start: Math.min(currentX, el.x), end: Math.max(rightX, el.x + (el.width || 0)) })
                snappedY = true; break
            }
            // Snap Center to Center
            if (Math.abs(centerY - elCenter) < snapThreshold) {
                newY = elCenter - (height / 2)
                activeSnapLines.push({ id: `snap-${el.id}-hc-hc`, type: 'horizontal', position: elCenter, start: Math.min(currentX, el.x), end: Math.max(rightX, el.x + (el.width || 0)) })
                snappedY = true; break
            }
        }

        setSnapLines(activeSnapLines)
        return { x: newX, y: newY }

    }, [elements, canvasWidth, canvasHeight, snapThreshold])

    const clearSnapLines = useCallback(() => {
        setSnapLines([])
    }, [])

    return {
        getSnappedPosition,
        snapLines,
        clearSnapLines
    }
}
