import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PrintButton } from '@/features/invoices/components'
import type { InvoiceItem } from '@/types/database'

// Habilitar PPR (Partial Prerendering) si estamos en canary, sino omitir
// export const experimental_ppr = true

async function getInvoice(id: string) {
    const supabase = await createClient()

    // Obtener factura con items y datos del cliente
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
      *,
      invoice_items (*),
      contacts (
        id, company_name, contact_name, 
        email, phone, tax_id, tax_address
      )
    `)
        .eq('id', id)
        .single()

    if (error || !invoice) {
        return null
    }

    return invoice
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await getInvoice(id)

    if (!invoice) {
        notFound()
    }

    const { contacts: client, invoice_items: items } = invoice

    return (
        <div className="min-h-screen bg-[#0b141a] text-white p-8">
            {/* Botones de acción (ocultos al imprimir) */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Link
                    href={`/contacts/${client.id}`}
                    className="text-gray-400 hover:text-white flex items-center gap-2"
                >
                    ← Volver al cliente
                </Link>

                <PrintButton />
            </div>

            {/* Hoja A4 */}
            <div className="max-w-4xl mx-auto bg-white text-black p-12 shadow-2xl rounded-lg print:shadow-none print:p-0 print:w-full print:max-w-none print:rounded-none min-h-[1100px]">

                {/* Header */}
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 mb-2">
                            FACTURA
                        </h1>
                        <p className="text-gray-500 font-medium">#{invoice.invoice_number}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase text-black mb-1">
                            TU AGENCIA
                        </h2>
                        <p className="text-gray-500 text-sm">
                            C/ Creatividad 123<br />
                            08000 Barcelona, España<br />
                            VAT: ESB12345678<br />
                            hola@tuagencia.com
                        </p>
                    </div>
                </div>

                {/* Info Cliente & Datos */}
                <div className="flex justify-between mb-16">
                    <div className="w-1/2">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Facturar a:</h3>
                        <p className="font-bold text-lg">{client.company_name}</p>
                        {client.tax_id && <p className="text-gray-600">CIF/NIF: {client.tax_id}</p>}
                        {client.tax_address && (
                            <p className="text-gray-600 whitespace-pre-wrap">{client.tax_address}</p>
                        )}
                        <p className="text-gray-600 mt-2">{client.contact_name}</p>
                        <p className="text-gray-600">{client.email}</p>
                    </div>
                    <div className="w-1/3 text-right space-y-2">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400">Fecha de emisión</h3>
                            <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('es-ES')}</p>
                        </div>
                        {invoice.due_date && (
                            <div>
                                <h3 className="text-xs font-bold uppercase text-gray-400">Fecha de vencimiento</h3>
                                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('es-ES')}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400">Estado</h3>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mt-1 ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {invoice.status === 'draft' ? 'Borrador' :
                                    invoice.status === 'sent' ? 'Enviada' :
                                        invoice.status === 'paid' ? 'Pagada' :
                                            invoice.status === 'overdue' ? 'Vencida' : 'Cancelada'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabla Items */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-3 font-bold uppercase text-sm">Descripción</th>
                            <th className="text-center py-3 font-bold uppercase text-sm w-24">Cant.</th>
                            <th className="text-right py-3 font-bold uppercase text-sm w-32">Precio U.</th>
                            <th className="text-right py-3 font-bold uppercase text-sm w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items && items.length > 0 ? (
                            items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4 text-gray-800">{item.description}</td>
                                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-gray-600">
                                        {item.unit_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                    </td>
                                    <td className="py-4 text-right font-medium text-gray-900">
                                        {item.total_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                    No hay conceptos en esta factura.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totales */}
                <div className="flex justify-end">
                    <div className="w-1/2 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{invoice.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>IVA ({invoice.tax_rate}%)</span>
                            <span>{invoice.tax_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold border-t-2 border-black pt-3 mt-3">
                            <span>Total</span>
                            <span>{invoice.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
                    <p>Gracias por confiar en nosotros.</p>
                    <p className="mt-2">Pago mediante transferencia bancaria: ES00 0000 0000 0000 0000</p>
                </div>

            </div>

            <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:w-full { width: 100% !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
        </div >
    )
}
