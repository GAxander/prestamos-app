'use client'

type Props = {
  cliente: { nombre: string; telefono: string | null }
  pago: { monto: number; fecha: Date; nota: string | null }
  saldoPendiente: number
}

export default function BotonRecibo({ cliente, pago, saldoPendiente }: Props) {
  
  const generarRecibo = () => {
    const fecha = new Date(pago.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    const hora = new Date(pago.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    
    // EMOJIS Y TEXTO DEL RECIBO
    let mensaje = `🧾 *CONSTANCIA DE PAGO*`
    mensaje += `\n📅 Fecha: ${fecha} - ${hora}`
    mensaje += `\n👤 Cliente: *${cliente.nombre}*`
    mensaje += `\n💰 *Abono: S/ ${Number(pago.monto).toFixed(2)}*`
    if (pago.nota) mensaje += `\n📝 Detalle: ${pago.nota}`
    mensaje += `\n--------------------------------`
    mensaje += `\n📉 *Saldo Restante: S/ ${saldoPendiente.toFixed(2)}*`
    mensaje += `\n\n✅ _Pago verificado correctamente._`

    // Limpieza del número
    const telefono = cliente.telefono?.replace(/\D/g, '') || ''
    
    // Crear Link
    const url = `https://wa.me/51${telefono}?text=${encodeURIComponent(mensaje)}`
    
    // Abrir en nueva pestaña
    window.open(url, '_blank')
  }

  return (
    <button 
      onClick={generarRecibo}
      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-transparent hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
      title="Enviar Recibo por WhatsApp"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline pt-0.5">Recibo</span>
    </button>
  )
}