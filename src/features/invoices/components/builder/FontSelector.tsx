import { memo } from 'react'

const GOOGLE_FONTS = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
]

interface Props {
    value: string
    onChange: (font: string) => void
}

export const FontSelector = memo(function FontSelector({ value, onChange }: Props) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tipografía</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {GOOGLE_FONTS.map((font) => (
                    <button
                        key={font.name}
                        onClick={() => onChange(font.name)}
                        className={`
                            w-full text-left px-3 py-2 text-sm rounded transition-colors
                            ${value === font.name
                                ? 'bg-lime-400 text-black font-bold'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'}
                        `}
                        style={{ fontFamily: font.family }}
                    >
                        {font.name}
                    </button>
                ))}
            </div>
            {/* Hidden link tags to load fonts for preview (simple hack, better via _document or global css) */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Open+Sans:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Roboto:wght@400;700&display=swap');
            `}</style>
        </div>
    )
})
