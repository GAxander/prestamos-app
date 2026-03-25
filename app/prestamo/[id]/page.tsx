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

  const totalEsperado = prestamo.cuotas.reduce((sum, c) => sum + Number(c.montoEsperado), 0)
  const gananciaTotal = totalEsperado - Number(prestamo.montoCapital)

  let diasPorCuota = 1
  if (prestamo.frecuencia === 'SEMANAL') diasPorCuota = 7
  if (prestamo.frecuencia === 'QUINCENAL') diasPorCuota = 15
  if (prestamo.frecuencia === 'MENSUAL') diasPorCuota = 30
  
  const duracionDias = prestamo.plazo * diasPorCuota
  const interesDiario = duracionDias > 0 ? (gananciaTotal / duracionDias) : 0

  const saldoPendiente = prestamo.cuotas.reduce((sum, c) => {
    const falta = Number(c.montoEsperado) - Number(c.montoPagado)
    return sum + (falta > 0 ? falta : 0)
  }, 0)

  const totalCuotas = prestamo.cuotas.length;
  const pagadas = prestamo.cuotas.filter(c => c.estado === 'PAGADO').length;
  const progreso = Math.min(100, Math.max(0, (pagadas / totalCuotas) * 100));

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
    <div className="min-h-screen pb-24">
      
      {/* CABECERA FLOTANTE */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
            <div className="flex justify-between items-start mb-2">
            <Link href={`/cliente/${prestamo.cliente.id}`} className="flex items-center text-slate-500 text-sm font-medium hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Perfil Cliente
            </Link>
            <div className="flex gap-2">
                <Link href={`/cliente/${prestamo.cliente.id}`} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition hover:border-indigo-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
                <Link href={`/prestamo/${prestamo.id}/editar-prestamo`} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition hover:border-amber-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Link>
            </div>
            </div>
            
            <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">{prestamo.cliente.nombre}</h1>
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-1.5 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mr-2">#{prestamo.id}</span>
                {prestamo.frecuencia}
                </p>
            </div>
            <span className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm
                ${prestamo.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {prestamo.estado}
            </span>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* TARJETA PRINCIPAL DEL PRÉSTAMO (Premium FinTech Style) */}
        <div className="glass-panel p-6 md:p-8 relative overflow-hidden bg-white border border-slate-200/60 shadow-lg shadow-indigo-500/5 rounded-2xl mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-slate-100 pb-6 gap-6 md:gap-0">
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Deuda Pendiente
                </p>
                <div className="flex items-baseline">
                    <span className="text-lg text-slate-400 font-medium mr-1.5">S/</span>
                    <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                    {saldoPendiente.toFixed(2)}
                    </p>
                </div>
             </div>
             
             <div className="w-full md:w-48 text-left md:text-right">
                <div className="flex justify-between md:justify-end md:gap-3 items-baseline mb-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Progreso</p>
                    <p className="text-sm text-slate-800 font-bold">{pagadas} de {totalCuotas} Cuotas</p>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${progreso}%` }}></div>
                </div>
             </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left md:text-center divide-x-0 md:divide-x divide-slate-100">
             <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-none">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Inicio</p>
                <p className="text-sm font-black text-slate-700">{prestamo.fechaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
             </div>
             <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-none">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Capital Original</p>
                <p className="text-sm font-black text-slate-700">S/ {Number(prestamo.montoCapital).toFixed(2)}</p>
             </div>
             <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-none">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tasa Inte.</p>
                <p className="text-sm font-black text-slate-700">{Number(prestamo.interesPorcentaje)}% <span className="text-[10px] font-medium text-slate-400">mens.</span></p>
             </div>
             <div className="bg-emerald-50/50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-emerald-100/50 md:border-none">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Ganancia Total</p>
                <p className="text-sm font-black text-emerald-600">+ S/ {gananciaTotal.toFixed(2)}</p>
             </div>
          </div>
        </div>

        {/* ACCIONES DEL PRÉSTAMO */}
        <div className="mt-6 mb-8 flex flex-col sm:flex-row gap-3">
            <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] hover:bg-[#1EBE5C] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] border border-green-600/50">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.066.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.418-.1.824zm-3.374-11.411c-4.417 0-8.005 3.588-8.006 8.006 0 1.411.369 2.788 1.071 4.001l-1.118 4.084 4.195-1.1c1.179.645 2.505.986 3.856.987h.003c4.414 0 8.004-3.589 8.005-8.007s-3.589-8.006-8.004-8.006v.035z"/></svg>
                <span>Enviar Recordatorio</span>
            </a>
            {prestamo.estado === 'ACTIVO' && (
                <Link href={`/prestamo/${prestamo.id}/renovar`} className="w-full sm:w-auto px-6 py-3.5 bg-amber-50 text-amber-700 font-bold flex items-center justify-center rounded-xl border border-amber-200 shadow-sm hover:bg-amber-100 hover:shadow-md transition-all active:scale-95" title="Renovar o Refinanciar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </Link>
            )}
        </div>

        {/* CRONOGRAMA */}
        <div className="space-y-4 mt-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Cronograma de Pagos
            </h2>
            
            <div className="grid gap-3">
            {prestamo.cuotas.map((cuota) => {
                const esPagado = cuota.estado === 'PAGADO';
                const montoEsperado = Number(cuota.montoEsperado);
                const montoPagado = Number(cuota.montoPagado);
                const saldoCuota = montoEsperado - montoPagado;
                const porcentajePagado = (montoPagado / montoEsperado) * 100;

                const fechaVencimiento = new Date(cuota.fechaVencimiento);
                const estaVencida = fechaVencimiento < hoy && !esPagado;
                const esParcial = montoPagado > 0 && montoPagado < montoEsperado;

                // Estilos según estado
                let cardClass = "bg-white border-slate-100/80 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]";
                let iconBg = "bg-indigo-50 text-indigo-600";
                
                if (esPagado) {
                    cardClass = "bg-slate-50 border-slate-100 opacity-60 grayscale-[0.2]";
                    iconBg = "bg-emerald-100 text-emerald-600";
                } else if (estaVencida) {
                    cardClass = "bg-white border-rose-200/60 shadow-[0_4px_12px_-4px_rgba(225,29,72,0.1)] ring-1 ring-rose-500/10";
                    iconBg = "bg-rose-50 text-rose-600";
                }

                return (
                <div key={cuota.id} className={`card-hover relative flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 ${cardClass}`}>
                    
                    <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm relative overflow-hidden shadow-sm ${iconBg}`}>
                        {esParcial && <div className="absolute bottom-0 left-0 w-full bg-amber-400/50" style={{ height: `${porcentajePagado}%` }}></div>}
                        <span className="relative z-10">{esPagado ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : cuota.numero}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-bold ${esPagado ? 'text-slate-400 line-through' : 'text-slate-800'}`}>Cuota {cuota.numero}</p>
                            {estaVencida && <span className="text-[9px] bg-rose-100/80 text-rose-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Vencida</span>}
                            {esParcial && <span className="text-[9px] bg-amber-100/80 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Abono</span>}
                        </div>
                        <p className={`text-xs font-medium ${estaVencida ? 'text-rose-500' : 'text-slate-500'}`}>
                            {fechaVencimiento.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                    <p className={`text-xl font-black tracking-tight ${esPagado ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}>
                        <span className="text-xs font-medium mr-1 text-slate-400">S/</span>
                        {saldoCuota.toFixed(2)}
                    </p>
                    
                    {montoPagado > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                Pagado: S/ {montoPagado.toFixed(2)}
                            </span>
                            <div className="scale-90">
                                <BotonCorregir cuotaId={cuota.id} montoPagadoActual={montoPagado} />
                            </div>
                        </div>
                    )}

                    {!esPagado && (
                        <div className="mt-3 w-full">
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
                        </div>
                    )}
                    </div>
                </div>
                )
            })}
            </div>
        </div>

        {/* HISTORIAL DE MOVIMIENTOS */}
        <div className="mt-10 mb-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1 mb-4">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Historial de Movimientos
            </h2>
            
            {prestamo.pagos.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-400 border-dashed border-2 border-slate-200">
                <p className="text-sm font-medium">No hay movimientos registrados aún.</p>
            </div>
            ) : (
            <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-sm">
                <div className="divide-y divide-slate-100">
                {prestamo.pagos.map((pago) => (
                    <div key={pago.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border
                        ${pago.tipo === 'ANULACION' ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                            pago.tipo === 'CORRECCION' ? 'bg-amber-50 text-amber-500 border-amber-100' : 
                            'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                        {pago.tipo === 'ANULACION' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> : 
                         pago.tipo === 'CORRECCION' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> : 
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                        </div>
                        <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">
                            {new Date(pago.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm font-bold text-slate-700">{pago.nota || 'Pago registrado'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`font-black text-base tracking-tight ${Number(pago.monto) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {Number(pago.monto) > 0 ? '+' : ''} S/ {Number(pago.monto).toFixed(2)}
                        </span>
                        
                        {pago.tipo !== 'ANULACION' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <BotonRecibo 
                                    cliente={prestamo.cliente}
                                    pago={{
                                        monto: Number(pago.monto),
                                        fecha: pago.fecha,
                                        nota: pago.nota
                                    }}
                                    saldoPendiente={saldoPendiente}
                                />
                            </div>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>

        <div className="mt-8 mb-12">
            <SeccionNotas notas={prestamo.notas} prestamoId={prestamo.id} />
        </div>

      </div>
    </div>
  )
}