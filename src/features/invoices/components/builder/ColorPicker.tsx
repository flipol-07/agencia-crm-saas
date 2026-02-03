import { memo } from 'react'

const PRESET_COLORS = [
    '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#a3e635'
]

interface Props {
    value?: string
    onChange: (color: string) => void
    label?: string
}

export const ColorPicker = memo(function ColorPicker({ value = '#000000', onChange, label = 'Color' }: Props) {
    return (
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">{label}</label>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="w-full h-full"
                            style={{ backgroundColor: value }}
                        />
                    </div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white flex-1 font-mono uppercase focus:border-lime-400 outline-none"
                    />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => onChange(color)}
                            className={`w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 ${value === color ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-black' : ''}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
})
