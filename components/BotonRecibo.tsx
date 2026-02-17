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
      className="ml-2 text-green-500 hover:text-green-700 hover:bg-green-50 p-1.5 rounded-full transition-colors flex items-center gap-1"
      title="Enviar Recibo por WhatsApp"
    >
      <span className="text-lg">🧾</span>
      <span className="text-[10px] font-bold uppercase hidden sm:inline">Recibo</span>
    </button>
  )
}