import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeNextRun, toDateString, parseDateString } from './recurrence'

test('monthly avanza un mes', () => {
    const r = computeNextRun(new Date(2026, 0, 15), 'monthly') // 15 Ene 2026
    assert.equal(toDateString(r), '2026-02-15')
})

test('quarterly avanza 3 meses', () => {
    const r = computeNextRun(new Date(2026, 0, 1), 'quarterly')
    assert.equal(toDateString(r), '2026-04-01')
})

test('yearly avanza 1 año', () => {
    const r = computeNextRun(new Date(2026, 5, 30), 'yearly')
    assert.equal(toDateString(r), '2027-06-30')
})

test('monthly desde 31 enero normaliza a febrero', () => {
    const r = computeNextRun(new Date(2026, 0, 31), 'monthly') // 31 Ene 2026
    // Date setMonth: 31 ene + 1 mes = "31 feb" → 3 marzo (normalizado por JS)
    // No es ideal pero es comportamiento documentado; nos vale para no perder ciclos.
    assert.ok(toDateString(r) === '2026-02-28' || toDateString(r) === '2026-03-03',
        `Esperado 2026-02-28 o 2026-03-03, recibido ${toDateString(r)}`)
})

test('yearly año bisiesto: 29 feb 2024 -> 2025', () => {
    const r = computeNextRun(new Date(2024, 1, 29), 'yearly')
    // setFullYear lleva 29-feb-2024 a 1-mar-2025 (no existe 29-feb-2025)
    const out = toDateString(r)
    assert.ok(out === '2025-02-28' || out === '2025-03-01',
        `Esperado 2025-02-28 o 2025-03-01, recibido ${out}`)
})

test('toDateString formatea con padding', () => {
    assert.equal(toDateString(new Date(2026, 0, 5)), '2026-01-05')
})

test('parseDateString roundtrip', () => {
    const d = parseDateString('2026-05-22')
    assert.equal(d.getFullYear(), 2026)
    assert.equal(d.getMonth(), 4)
    assert.equal(d.getDate(), 22)
})
