import { memo } from 'react'
import { Pipette, X } from 'lucide-react'

const PRESET_COLORS = [
    '#111827', '#FFFFFF', '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
]

interface Props {
    value?: string
    onChange: (color: string) => void
    label?: string
    allowTransparent?: boolean
}

export const ColorPicker = memo(function ColorPicker({ value = '#000000', onChange, label = 'Color', allowTransparent }: Props) {
    const isTransparent = value === 'transparent'
    const colorValue = isTransparent ? '#ffffff' : value

    return (
        <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                <div className="flex items-center gap-2">
                    <div className="relative h-9 w-9 overflow-hidden rounded-md border border-white/15 bg-white/5">
                        <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            title={`Elegir ${label.toLowerCase()}`}
                        />
                        <div
                            className={`h-full w-full ${isTransparent ? 'bg-[linear-gradient(45deg,#3f3f46_25%,transparent_25%),linear-gradient(-45deg,#3f3f46_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#3f3f46_75%),linear-gradient(-45deg,transparent_75%,#3f3f46_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0px]' : ''}`}
                            style={{ backgroundColor: isTransparent ? '#18181b' : value }}
                        />
                        <Pipette className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                    </div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-2.5 text-xs uppercase text-white outline-none transition-colors focus:border-brand"
                        spellCheck={false}
                    />
                    {allowTransparent && (
                        <button
                            type="button"
                            onClick={() => onChange('transparent')}
                            className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${isTransparent ? 'border-brand bg-brand/15 text-brand' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white'}`}
                            title="Transparente"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onChange(color)}
                            className={`h-6 rounded-md border transition-transform hover:scale-105 ${value === color ? 'border-white ring-2 ring-brand ring-offset-1 ring-offset-zinc-950' : 'border-white/15'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
})
