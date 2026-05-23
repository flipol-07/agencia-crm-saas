/**
 * Minimal RFC 4180 CSV parser sin dependencias.
 * Soporta delimitadores , o ;, comillas dobles escapadas con "".
 */
export interface CsvParseResult {
    headers: string[]
    rows: string[][]
    delimiter: ',' | ';'
}

export function parseCsv(text: string): CsvParseResult {
    const trimmed = text.replace(/^﻿/, '').trim()
    if (!trimmed) return { headers: [], rows: [], delimiter: ',' }

    // Detección heurística del delimitador en la primera línea.
    const firstNewline = trimmed.search(/\r?\n/)
    const firstLine = firstNewline === -1 ? trimmed : trimmed.slice(0, firstNewline)
    const semis = (firstLine.match(/;/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length
    const delimiter: ',' | ';' = semis > commas ? ';' : ','

    const all = parseRows(trimmed, delimiter)
    if (all.length === 0) return { headers: [], rows: [], delimiter }

    return {
        headers: all[0].map(h => h.trim()),
        rows: all.slice(1),
        delimiter,
    }
}

function parseRows(text: string, delimiter: string): string[][] {
    const rows: string[][] = []
    let field = ''
    let row: string[] = []
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                field += ch
            }
            continue
        }

        if (ch === '"') {
            inQuotes = true
            continue
        }
        if (ch === delimiter) {
            row.push(field)
            field = ''
            continue
        }
        if (ch === '\r') continue
        if (ch === '\n') {
            row.push(field)
            rows.push(row)
            row = []
            field = ''
            continue
        }
        field += ch
    }

    // último registro
    if (field !== '' || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    return rows
}

/**
 * Serializa una matriz a CSV (RFC 4180). El primer array son los headers.
 */
export function toCsv(rows: (string | number | null | undefined)[][], delimiter: ',' | ';' = ','): string {
    return rows
        .map(row => row.map(cell => escapeCell(cell, delimiter)).join(delimiter))
        .join('\r\n')
}

function escapeCell(cell: string | number | null | undefined, delimiter: string): string {
    if (cell === null || cell === undefined) return ''
    const str = String(cell)
    if (str.includes('"') || str.includes(delimiter) || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/**
 * Heurística de mapeo automático de columnas a campos de Contact.
 */
export const CONTACT_FIELD_MAP: Record<string, string[]> = {
    company_name: ['company', 'empresa', 'company name', 'organizacion', 'organización', 'company_name'],
    contact_name: ['contact', 'contacto', 'nombre', 'name', 'contact name', 'contact_name', 'full name'],
    email: ['email', 'correo', 'e-mail', 'mail', 'email address'],
    phone: ['phone', 'teléfono', 'telefono', 'tel', 'móvil', 'movil', 'mobile'],
    tax_id: ['nif', 'cif', 'tax id', 'tax_id', 'dni'],
    tax_address: ['address', 'dirección', 'direccion', 'domicilio', 'tax_address'],
    website: ['website', 'url', 'web', 'sitio', 'site'],
    notes: ['notes', 'notas', 'comentarios', 'observaciones'],
    pipeline_stage: ['stage', 'fase', 'pipeline', 'pipeline_stage'],
    source: ['source', 'origen', 'canal'],
    estimated_value: ['value', 'valor', 'estimated_value', 'precio', 'importe'],
}

export function autoMapHeader(header: string): string | null {
    const norm = header.trim().toLowerCase()
    for (const [field, aliases] of Object.entries(CONTACT_FIELD_MAP)) {
        if (aliases.includes(norm)) return field
    }
    return null
}
