import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    roundCurrency,
    lineItemTotal,
    sumLineItems,
    applyPercentage,
    computeInvoiceTotals,
    formatCurrency,
} from './money'

test('roundCurrency redondea a 2 decimales', () => {
    assert.equal(roundCurrency(10.125), 10.13)
    assert.equal(roundCurrency(10.124), 10.12)
    assert.equal(roundCurrency(0), 0)
    assert.equal(roundCurrency(-1.255), -1.26)
})

test('lineItemTotal multiplica y redondea', () => {
    assert.equal(lineItemTotal({ quantity: 3, unit_price: 10.333 }), 31)
    assert.equal(lineItemTotal({ quantity: 1, unit_price: 99.999 }), 100)
})

test('sumLineItems suma items', () => {
    const items = [
        { quantity: 2, unit_price: 10 },
        { quantity: 1, unit_price: 5.5 },
    ]
    assert.equal(sumLineItems(items), 25.5)
})

test('applyPercentage calcula IVA', () => {
    assert.equal(applyPercentage(100, 21), 21)
    assert.equal(applyPercentage(50, 10), 5)
    assert.equal(applyPercentage(0, 21), 0)
})

test('computeInvoiceTotals suma subtotal + IVA - IRPF', () => {
    const r = computeInvoiceTotals({
        items: [{ quantity: 1, unit_price: 100 }],
        taxRate: 21,
        irpfRate: 15,
    })
    assert.equal(r.subtotal, 100)
    assert.equal(r.taxAmount, 21)
    assert.equal(r.irpfAmount, 15)
    assert.equal(r.total, 100 + 21 - 15)
})

test('formatCurrency en EUR es-ES', () => {
    const s = formatCurrency(1234.5, 'EUR', 'es-ES')
    // Espacio no-rompible ( ) entre número y símbolo en es-ES
    assert.match(s, /1\.?234,50/)
    assert.match(s, /€/)
})
