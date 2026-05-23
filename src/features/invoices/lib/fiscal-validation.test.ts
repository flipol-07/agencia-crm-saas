import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    validateDniNif,
    validateNie,
    validateCif,
    validateSpanishTaxId,
    validateIban,
} from './fiscal-validation'

test('NIF válido conocido (12345678Z)', () => {
    assert.equal(validateDniNif('12345678Z').valid, true)
})

test('NIF con letra incorrecta', () => {
    const r = validateDniNif('12345678A')
    assert.equal(r.valid, false)
    assert.match(r.reason || '', /letra/i)
})

test('NIF mal formado', () => {
    assert.equal(validateDniNif('123A').valid, false)
})

test('NIE válido X0000000T', () => {
    assert.equal(validateNie('X0000000T').valid, true)
})

test('NIE con prefijo inválido', () => {
    assert.equal(validateNie('A1234567Z').valid, false)
})

test('CIF válido B12345674 (control numérico)', () => {
    assert.equal(validateCif('B12345674').valid, true)
})

test('CIF con formato erróneo', () => {
    assert.equal(validateCif('12345678A').valid, false)
})

test('validateSpanishTaxId reparte correctamente', () => {
    assert.equal(validateSpanishTaxId('12345678Z').valid, true)
    assert.equal(validateSpanishTaxId('X0000000T').valid, true)
    assert.equal(validateSpanishTaxId('B12345674').valid, true)
    assert.equal(validateSpanishTaxId('').valid, false)
})

test('IBAN español válido', () => {
    // IBAN ficticio que pasa MOD 97. Usamos uno de prueba estándar de la AEB:
    assert.equal(validateIban('ES9121000418450200051332').valid, true)
})

test('IBAN inválido', () => {
    assert.equal(validateIban('ES0000000000000000000000').valid, false)
})
