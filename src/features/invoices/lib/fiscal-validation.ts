/**
 * Validadores fiscales españoles (NIF/NIE/CIF, IBAN).
 * No bloquean el formulario: devuelven { valid, reason } para warnings.
 */

export interface ValidationResult {
    valid: boolean
    reason?: string
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

/**
 * NIF (DNI de persona física residente): 8 dígitos + letra de control.
 */
export function validateDniNif(value: string): ValidationResult {
    const v = value.replace(/[\s-]/g, '').toUpperCase()
    if (!/^[0-9]{8}[A-Z]$/.test(v)) {
        return { valid: false, reason: 'Formato NIF: 8 dígitos + letra' }
    }
    const number = parseInt(v.slice(0, 8), 10)
    const expected = DNI_LETTERS[number % 23]
    if (v[8] !== expected) {
        return { valid: false, reason: `Letra de control incorrecta (esperada: ${expected})` }
    }
    return { valid: true }
}

/**
 * NIE (residente extranjero): X/Y/Z + 7 dígitos + letra de control.
 */
export function validateNie(value: string): ValidationResult {
    const v = value.replace(/[\s-]/g, '').toUpperCase()
    if (!/^[XYZ][0-9]{7}[A-Z]$/.test(v)) {
        return { valid: false, reason: 'Formato NIE: X/Y/Z + 7 dígitos + letra' }
    }
    const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' }
    const number = parseInt(prefixMap[v[0]] + v.slice(1, 8), 10)
    const expected = DNI_LETTERS[number % 23]
    if (v[8] !== expected) {
        return { valid: false, reason: `Letra de control incorrecta (esperada: ${expected})` }
    }
    return { valid: true }
}

/**
 * CIF (empresa): letra + 7 dígitos + dígito o letra de control.
 */
export function validateCif(value: string): ValidationResult {
    const v = value.replace(/[\s-]/g, '').toUpperCase()
    if (!/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(v)) {
        return { valid: false, reason: 'Formato CIF: letra + 7 dígitos + control' }
    }
    const digits = v.slice(1, 8)
    let evenSum = 0
    let oddSum = 0
    for (let i = 0; i < 7; i++) {
        const d = parseInt(digits[i], 10)
        if (i % 2 === 0) {
            // Posiciones impares (1,3,5,7) multiplican por 2 y suman dígitos.
            const doubled = d * 2
            oddSum += Math.floor(doubled / 10) + (doubled % 10)
        } else {
            evenSum += d
        }
    }
    const totalSum = evenSum + oddSum
    const expectedDigit = (10 - (totalSum % 10)) % 10
    const expectedLetter = 'JABCDEFGHI'[expectedDigit]
    const control = v[8]
    const firstLetter = v[0]
    // Organizaciones tipo N,P,Q,R,S,W usan letra de control.
    // El resto puede usar dígito o letra.
    if ('NPQRSW'.includes(firstLetter)) {
        if (control !== expectedLetter) return { valid: false, reason: `Control esperado: ${expectedLetter}` }
    } else if ('ABEH'.includes(firstLetter)) {
        if (control !== String(expectedDigit)) return { valid: false, reason: `Control esperado: ${expectedDigit}` }
    } else {
        if (control !== String(expectedDigit) && control !== expectedLetter) {
            return { valid: false, reason: `Control esperado: ${expectedDigit} o ${expectedLetter}` }
        }
    }
    return { valid: true }
}

/**
 * Validación unificada: prueba NIF, NIE y CIF en este orden.
 */
export function validateSpanishTaxId(value: string): ValidationResult {
    const v = value.replace(/[\s-]/g, '').toUpperCase()
    if (!v) return { valid: false, reason: 'Vacío' }
    if (/^[0-9]/.test(v)) return validateDniNif(v)
    if (/^[XYZ]/.test(v)) return validateNie(v)
    return validateCif(v)
}

/**
 * IBAN: validación módulo 97 (ISO 13616).
 */
export function validateIban(value: string): ValidationResult {
    const v = value.replace(/[\s-]/g, '').toUpperCase()
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(v)) {
        return { valid: false, reason: 'Formato IBAN inválido' }
    }
    if (v.length < 15 || v.length > 34) {
        return { valid: false, reason: 'Longitud IBAN fuera de rango (15–34)' }
    }
    // Mover los 4 primeros al final y convertir letras a números (A=10..Z=35).
    const rearranged = v.slice(4) + v.slice(0, 4)
    let numericString = ''
    for (const ch of rearranged) {
        if (/[0-9]/.test(ch)) numericString += ch
        else numericString += String(ch.charCodeAt(0) - 55)
    }
    // Mod 97 sobre string largo (procesar en chunks).
    let remainder = 0
    for (let i = 0; i < numericString.length; i += 7) {
        const chunk = String(remainder) + numericString.slice(i, i + 7)
        remainder = parseInt(chunk, 10) % 97
    }
    if (remainder !== 1) {
        return { valid: false, reason: 'Dígitos de control IBAN incorrectos' }
    }
    return { valid: true }
}
