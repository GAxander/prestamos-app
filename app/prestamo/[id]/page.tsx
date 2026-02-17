import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BotonCobrar from '@/components/BotonCobrar'
import BotonCorregir from '@/components/BotonCorregir'
import SeccionNotas from '@/components/SeccionNotas'
import BotonRecibo from '@/components/BotonRecibo'

export const dynamic = 'force-dynamic'

export default async function DetallePrestamo(props: { params: Promise<{ id: string }> }) {
  
  const params = await props.params;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: { 
      cliente: true,
      cuotas: { orderBy: { numero: 'asc' } },
      pagos: { orderBy: { fecha: 'desc' } },
      notas: { orderBy: { fecha: 'desc' } }
    }
  })

  if (!prestamo) return notFound()

  // --- 1. CÁLCULO EXACTO DEL INTERÉS DIARIO (MEJORADO) ---
  // En lugar de usar el % mensual, usamos la realidad: (Total a Cobrar - Capital) / Días
  
  // A. ¿Cuánto dinero esperamos recuperar en total?
  const totalEsperado = prestamo.cuotas.reduce((sum, c) => sum + Number(c.montoEsperado), 0)
  
  // B. ¿Cuánto fue la ganancia neta (Interés Total)?
  const gananciaTotal = totalEsperado - Number(prestamo.montoCapital)

  // C. ¿Cuántos días dura el préstamo realmente?
  let diasPorCuota = 1
  if (prestamo.frecuencia === 'SEMANAL') diasPorCuota = 7
  if (prestamo.frecuencia === 'QUINCENAL') diasPorCuota = 15
  if (prestamo.frecuencia === 'MENSUAL') diasPorCuota = 30
  
  // prestamo.plazo ahora guarda el NÚMERO DE CUOTAS (según nuestro cambio anterior)
  const duracionDias = prestamo.plazo * diasPorCuota

  // D. Valor del día (Interés Diario)
  // Si gané 100 soles en 20 días, cada día vale 5 soles.
  const interesDiario = duracionDias > 0 ? (gananciaTotal / duracionDias) : 0


  // --- 2. CÁLCULOS FINANCIEROS KPI ---
  const saldoPendiente = prestamo.cuotas.reduce((sum, c) => {
    const falta = Number(c.montoEsperado) - Number(c.montoPagado)
    return sum + (falta > 0 ? falta : 0)
  }, 0)

  const totalCuotas = prestamo.cuotas.length;
  const pagadas = prestamo.cuotas.filter(c => c.estado === 'PAGADO').length;
  const progreso = (pagadas / totalCuotas) * 100;


  // --- 3. LÓGICA WHATSAPP INTELIGENTE ---
  const pendientes = prestamo.cuotas.filter(c => c.estado === 'PENDIENTE')
  
  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  const vencidas = pendientes.filter(c => {
    const f = new Date(c.fechaVencimiento)
    f.setHours(0,0,0,0)
    return f < hoy
  })

  const porVencer = pendientes.filter(c => {
    const f = new Date(c.fechaVencimiento)
    f.setHours(0,0,0,0)
    return f >= hoy
  })

  let mensaje = `Hola *${prestamo.cliente.nombre}*, le informamos el estado de su crédito. 📋`

  if (vencidas.length > 0) {
      const totalVencido = vencidas.reduce((sum, c) => sum + (Number(c.montoEsperado) - Number(c.montoPagado)), 0)
      const fechaMasAntigua = new Date(vencidas[0].fechaVencimiento).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })

      mensaje += `\n\n⚠️ *TIENE CUOTAS ATRASADAS*`
      mensaje += `\nCantidad: *${vencidas.length} cuota(s) vencida(s)*`
      mensaje += `\nDesde el: *${fechaMasAntigua}*`
      mensaje += `\n🛑 *Monto Vencido: S/ ${totalVencido.toFixed(2)}*`
      mensaje += `\n_(Más moras correspondientes)_`
  }

  if (porVencer.length > 0) {
      const siguiente = porVencer[0]
      const fecha = new Date(siguiente.fechaVencimiento).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })
      const monto = Number(siguiente.montoEsperado) - Number(siguiente.montoPagado)

      mensaje += `\n\n📅 *Próximo Vencimiento:*`
      mensaje += `\nCuota #${siguiente.numero} vence el: *${fecha}*`
      mensaje += `\nMonto: S/ ${monto.toFixed(2)}`
  } else if (pendientes.length === 0) {
      mensaje += `\n\n✅ *¡Felicidades! Ha completado su crédito.*`
  }

  mensaje += `\n\n💰 *Deuda Total:* S/ ${saldoPendiente.toFixed(2)}`
  mensaje += `\n\nEsperamos su pago. Gracias. 🙌`

  const telefonoLimpio = prestamo.cliente.telefono?.replace(/\D/g, '') || '';
  const linkWhatsapp = `https://wa.me/51${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* CABECERA */}
      <div className="bg-white p-6 shadow-md sticky top-0 z-20">
        <div className="flex justify-between items-start mb-2">
          <Link href="/" className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition">
            <span className="mr-1">←</span> Volver
          </Link>
          <div className="flex gap-2">
             <Link href={`/cliente/${prestamo.cliente.id}`} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition">👤</Link>
             <Link href={`/prestamo/${prestamo.id}/editar-prestamo`} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition">⚙️</Link>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{prestamo.cliente.nombre}</h1>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mt-1">
              Préstamo #{prestamo.id} • {prestamo.frecuencia}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border
            ${prestamo.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {prestamo.estado}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between items-end mb-2">
             <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Deuda Pendiente</p>
                <p className="text-3xl font-black text-gray-800 tracking-tight">
                  <span className="text-lg text-gray-400 font-normal align-top mr-1">S/</span>
                  {saldoPendiente.toFixed(2)}
                </p>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">{pagadas}/{totalCuotas} Cuotas</p>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progreso}%` }}></div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-5 gap-2">
            <a href={linkWhatsapp} target="_blank" className="col-span-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-transform active:scale-95">
                <span className="text-xl">💬</span>
                <span>Enviar Recordatorio</span>
            </a>
            {prestamo.estado === 'ACTIVO' && (
                <Link href={`/prestamo/${prestamo.id}/renovar`} className="col-span-1 bg-orange-100 text-orange-600 flex items-center justify-center rounded-xl border border-orange-200">🔄</Link>
            )}
        </div>
      </div>

      {/* CRONOGRAMA */}
      <div className="max-w-2xl mx-auto p-4 space-y-3 mt-2">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 pl-2">Cronograma</h2>
        
        {prestamo.cuotas.map((cuota) => {
          const esPagado = cuota.estado === 'PAGADO';
          const montoEsperado = Number(cuota.montoEsperado);
          const montoPagado = Number(cuota.montoPagado);
          const saldoCuota = montoEsperado - montoPagado;
          const porcentajePagado = (montoPagado / montoEsperado) * 100;

          const fechaVencimiento = new Date(cuota.fechaVencimiento);
          const hoy = new Date();
          hoy.setHours(0,0,0,0);
          const estaVencida = fechaVencimiento < hoy && !esPagado;
          const esParcial = montoPagado > 0 && montoPagado < montoEsperado;

          return (
            <div key={cuota.id} 
                 className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200
                 ${esPagado ? 'bg-gray-50 border-gray-100 opacity-80' : estaVencida ? 'bg-white border-red-200 shadow-lg shadow-red-50' : 'bg-white border-gray-100 shadow-sm'}`}>
              
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative overflow-hidden
                  ${esPagado ? 'bg-green-100 text-green-600' : estaVencida ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {esParcial && <div className="absolute bottom-0 left-0 w-full bg-orange-200 opacity-50" style={{ height: `${porcentajePagado}%` }}></div>}
                  <span className="relative z-10">{esPagado ? '✓' : cuota.numero}</span>
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <p className={`font-bold ${esPagado ? 'text-gray-500 line-through' : 'text-gray-800'}`}>Cuota {cuota.numero}</p>
                      {estaVencida && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Vencida</span>}
                      {esParcial && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">Abonado</span>}
                   </div>
                   <p className="text-xs text-gray-400 font-medium">
                     {fechaVencimiento.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}
                   </p>
                </div>
              </div>

              <div className="text-right relative">
                <div className="flex flex-col items-end">
                    {esParcial && <span className="text-[10px] text-gray-400">Resta:</span>}
                    <p className={`text-lg font-black tracking-tight ${esPagado ? 'text-gray-400 line-through' : 'text-gray-900'}`}>S/ {saldoCuota.toFixed(2)}</p>
                    {(montoPagado > 0) && (
                        <div className="flex items-center text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full mt-1">
                           Pagado: S/ {montoPagado.toFixed(2)}
                           <BotonCorregir cuotaId={cuota.id} montoPagadoActual={montoPagado} />
                        </div>
                    )}
                </div>
                <div className="mt-2">
                  {!esPagado && (
                    <BotonCobrar 
                        cuota={{
                            id: cuota.id,
                            numero: cuota.numero,
                            montoEsperado: montoEsperado,
                            montoPagado: montoPagado,
                            fechaVencimiento: cuota.fechaVencimiento.toISOString()
                        }} 
                        prestamoId={prestamo.id}
                        interesDiario={interesDiario} 
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* HISTORIAL DE MOVIMIENTOS */}
      <div className="max-w-2xl mx-auto p-4 mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-2">Historial de Movimientos</h2>
        {prestamo.pagos.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4 italic">No hay movimientos registrados aún.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {prestamo.pagos.map((pago) => (
              <div key={pago.id} className="p-4 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                    ${pago.tipo === 'ANULACION' ? 'bg-red-100 text-red-600' : 
                      pago.tipo === 'CORRECCION' ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'}`}>
                    {pago.tipo === 'ANULACION' ? '✕' : pago.tipo === 'CORRECCION' ? '✎' : '↓'}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold mb-0.5">
                      {new Date(pago.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">{pago.nota || 'Pago registrado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${Number(pago.monto) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {Number(pago.monto) > 0 ? '+' : ''} S/ {Number(pago.monto).toFixed(2)}
                    </span>
                    
                    {/* AQUÍ ESTÁ EL NUEVO BOTÓN DE RECIBO */}
                    {pago.tipo !== 'ANULACION' && (
                        <BotonRecibo 
                            cliente={prestamo.cliente}
                            pago={{
                                monto: Number(pago.monto),
                                fecha: pago.fecha,
                                nota: pago.nota
                            }}
                            saldoPendiente={saldoPendiente}
                        />
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ... después del historial de pagos ... */}

      <SeccionNotas notas={prestamo.notas} prestamoId={prestamo.id} />

  

    </div>
  )
}