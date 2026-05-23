import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { INVOICE_FONTS, fontFamilyForCss } from '@/features/invoices/lib/invoice-fonts'

interface Props {
    value: string
    onChange: (font: string) => void
}

export const FontSelector = memo(function FontSelector({ value, onChange }: Props) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-white/10 bg-white/[0.06] px-3 pr-9 text-sm text-white outline-none transition-colors focus:border-brand [&>option]:bg-zinc-950"
                style={{ fontFamily: fontFamilyForCss(value) }}
            >
                {INVOICE_FONTS.map((font) => (
                    <option key={font.name} value={font.name}>
                        {font.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <div className="mt-2 flex flex-wrap gap-1.5">
                {INVOICE_FONTS.slice(0, 5).map(font => (
                    <button
                        key={font.name}
                        type="button"
                        onClick={() => onChange(font.name)}
                        className={`h-7 rounded-md border px-2.5 text-[10px] font-semibold transition-colors ${value === font.name ? 'border-brand bg-brand/15 text-brand' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] hover:text-white'}`}
                        style={{ fontFamily: font.cssFamily }}
                    >
                        {font.name}
                    </button>
                ))}
            </div>
        </div>
    )
})
