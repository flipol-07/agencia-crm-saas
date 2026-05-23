'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { parseCsv, autoMapHeader, CONTACT_FIELD_MAP } from '@/features/contacts/lib/csv'

interface Props {
    open: boolean
    onClose: () => void
}

type Step = 'upload' | 'map' | 'preview' | 'done'

interface ImportSummary {
    created: number
    updated: number
    skipped: number
    errors: string[]
}

const TARGET_FIELDS = Object.keys(CONTACT_FIELD_MAP)

export function ImportContactsModal({ open, onClose }: Props) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('upload')
    const [fileName, setFileName] = useState('')
    const [headers, setHeaders] = useState<string[]>([])
    const [rows, setRows] = useState<string[][]>([])
    const [mapping, setMapping] = useState<Record<number, string>>({}) // index -> contact field
    const [busy, setBusy] = useState(false)
    const [summary, setSummary] = useState<ImportSummary | null>(null)
    const [error, setError] = useState<string | null>(null)

    const onFile = useCallback(async (file: File) => {
        setError(null)
        try {
            const text = await file.text()
            const parsed = parseCsv(text)
            if (parsed.headers.length === 0) {
                setError('El archivo está vacío o no es un CSV válido.')
                return
            }
            const initialMap: Record<number, string> = {}
            parsed.headers.forEach((h, i) => {
                const mapped = autoMapHeader(h)
                if (mapped) initialMap[i] = mapped
            })
            setFileName(file.name)
            setHeaders(parsed.headers)
            setRows(parsed.rows)
            setMapping(initialMap)
            setStep('map')
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo leer el archivo')
        }
    }, [])

    const mappedRows = useMemo(() => {
        return rows.map(row => {
            const obj: Record<string, string> = {}
            Object.entries(mapping).forEach(([idx, field]) => {
                if (!field) return
                obj[field] = (row[Number(idx)] ?? '').trim()
            })
            return obj
        }).filter(r => r.company_name && r.company_name.length > 0)
    }, [rows, mapping])

    const validRowsCount = mappedRows.length
    const hasCompanyMapped = Object.values(mapping).includes('company_name')

    const handleImport = useCallback(async () => {
        setBusy(true)
        setError(null)
        try {
            const res = await fetch('/api/contacts/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts: mappedRows }),
            })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Error al importar')
                setBusy(false)
                return
            }
            setSummary(json)
            setStep('done')
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de red')
        } finally {
            setBusy(false)
        }
    }, [mappedRows])

    const handleClose = () => {
        if (summary) router.refresh()
        setStep('upload')
        setFileName('')
        setHeaders([])
        setRows([])
        setMapping({})
        setSummary(null)
        setError(null)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                    <div>
                        <h2 className="text-lg font-semibold text-ink-700">Importar contactos desde CSV</h2>
                        {fileName && <p className="text-xs text-ink-400 mt-0.5">{fileName} · {rows.length} filas</p>}
                    </div>
                    <button onClick={handleClose} className="text-ink-400 hover:text-ink-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'upload' && (
                        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-12 text-center cursor-pointer hover:border-brand-neon-lime/40 hover:bg-white/10">
                            <Upload className="h-10 w-10 text-ink-400" />
                            <span className="text-sm font-medium text-ink-700">Selecciona un archivo CSV</span>
                            <span className="text-xs text-ink-400">Delimitador autodetectado (, o ;). Codificación UTF-8.</span>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) onFile(file)
                                }}
                            />
                        </label>
                    )}

                    {step === 'map' && (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-500">
                                Asigna cada columna del CSV al campo correspondiente. <span className="text-ink-700 font-medium">company_name es obligatorio.</span>
                            </p>
                            <div className="rounded-lg border border-white/10 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-ink-400 font-medium">Columna CSV</th>
                                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-ink-400 font-medium">Asignar a campo</th>
                                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-ink-400 font-medium">Ejemplo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {headers.map((h, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 text-ink-700 font-medium">{h}</td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={mapping[i] ?? ''}
                                                        onChange={(e) => setMapping(prev => ({ ...prev, [i]: e.target.value }))}
                                                        className="h-8 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-ink-700"
                                                    >
                                                        <option value="">— Ignorar —</option>
                                                        {TARGET_FIELDS.map(f => (
                                                            <option key={f} value={f}>{f}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-ink-400 text-xs truncate max-w-[200px]">{rows[0]?.[i] ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-500">
                                Vista previa de los <span className="text-ink-700 font-medium">{validRowsCount}</span> contactos a importar.
                                Los duplicados por email/teléfono se fusionarán (rellenando solo campos vacíos).
                            </p>
                            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-white/10">
                                <table className="w-full text-xs">
                                    <thead className="bg-white/5 sticky top-0">
                                        <tr>
                                            {Array.from(new Set(Object.values(mapping))).filter(Boolean).map(field => (
                                                <th key={field} className="px-2 py-2 text-left text-ink-400">{field}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {mappedRows.slice(0, 10).map((r, i) => (
                                            <tr key={i}>
                                                {Array.from(new Set(Object.values(mapping))).filter(Boolean).map(field => (
                                                    <td key={field} className="px-2 py-1.5 text-ink-600 truncate max-w-[160px]">{r[field] || '—'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {mappedRows.length > 10 && (
                                <p className="text-xs text-ink-400">+ {mappedRows.length - 10} filas más.</p>
                            )}
                        </div>
                    )}

                    {step === 'done' && summary && (
                        <div className="space-y-4 text-center py-8">
                            <CheckCircle2 className="h-12 w-12 text-brand-neon-lime mx-auto" />
                            <div>
                                <p className="text-lg font-semibold text-ink-700">Importación completada</p>
                                <p className="text-sm text-ink-400 mt-1">Se procesaron {validRowsCount} contactos.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                    <p className="text-2xl font-bold text-brand-neon-lime">{summary.created}</p>
                                    <p className="text-xs text-ink-400">Creados</p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                    <p className="text-2xl font-bold text-blue-400">{summary.updated}</p>
                                    <p className="text-xs text-ink-400">Actualizados</p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                    <p className="text-2xl font-bold text-ink-500">{summary.skipped}</p>
                                    <p className="text-xs text-ink-400">Omitidos</p>
                                </div>
                            </div>
                            {summary.errors.length > 0 && (
                                <details className="text-left">
                                    <summary className="text-xs text-red-400 cursor-pointer">{summary.errors.length} errores</summary>
                                    <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-400 space-y-1">
                                        {summary.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 p-4 flex items-center justify-between">
                    <div className="text-xs text-ink-400">
                        {step === 'map' && !hasCompanyMapped && (
                            <span className="text-amber-400">⚠ Mapea al menos company_name para continuar</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step === 'map' && (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>Atrás</Button>
                                <Button size="sm" onClick={() => setStep('preview')} disabled={!hasCompanyMapped}>Siguiente</Button>
                            </>
                        )}
                        {step === 'preview' && (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => setStep('map')}>Atrás</Button>
                                <Button size="sm" onClick={handleImport} isLoading={busy} disabled={validRowsCount === 0}>
                                    Importar {validRowsCount} contactos
                                </Button>
                            </>
                        )}
                        {step === 'done' && (
                            <Button size="sm" onClick={handleClose}>Cerrar</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
