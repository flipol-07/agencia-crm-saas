import { memo } from 'react'

interface SnapLine {
    id: string
    type: 'vertical' | 'horizontal'
    position: number
    start: number
    end: number
}

interface Props {
    lines: SnapLine[]
    scale?: number
}

export const AlignmentGuides = memo(function AlignmentGuides({ lines, scale = 1 }: Props) {
    if (lines.length === 0) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-[100]">
            {lines.map(line => (
                <div
                    key={line.id}
                    className="absolute bg-red-500 shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                    style={
                        line.type === 'vertical'
                            ? {
                                left: `${line.position}mm`,
                                top: `${line.start}mm`,
                                height: `${line.end - line.start}mm`,
                                width: '1px',
                                minHeight: '20px' // Visibilidad mínima
                            }
                            : {
                                top: `${line.position}mm`,
                                left: `${line.start}mm`,
                                width: `${line.end - line.start}mm`,
                                height: '1px',
                                minWidth: '20px'
                            }
                    }
                />
            ))}
        </div>
    )
})
