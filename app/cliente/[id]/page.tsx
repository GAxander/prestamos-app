import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const formatMoney = (amount: number) => `S/ ${Number(amount).toFixed(2)}`

export default async function PerfilClientePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      prestamos: {
        orderBy: { fechaInicio: 'desc' },
        include: { cuotas: true }
      }
    }
  })

  if (!cliente) return notFound()

  const prestamosActivos = cliente.prestamos.filter(p => 
    p.estado === 'ACTIVO' || p.estado === 'PENDIENTE'
  )
  
  const prestamosFinalizados = cliente.prestamos.filter(p => 
    ['FINALIZADO', 'CANCELADO', 'REFINANCIADO'].includes(p.estado)
  )

  const totalPrestamosHistorico = cliente.prestamos.length
  const dineroPrestadoTotal = cliente.prestamos.reduce((sum, p) => sum + Number(p.montoCapital), 0)

  return (
    <div className="min-h-screen pb-24">
      
      {/* HEADER TIPO TARJETA FLOTANTE */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
        <div className="glass-panel p-6 md:p-8 relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200/60 shadow-sm backdrop-blur-md">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver al Dashboard
            </Link>
            <Link 
                href={`/cliente/${cliente.id}/editar`} 
                className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-full hover:bg-indigo-50 hover:text-indigo-700 font-bold transition-all shadow-sm border border-slate-200/50"
            >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar Perfil
            </Link>
          </div>

          <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl md:text-5xl text-white font-black shadow-lg shadow-indigo-500/30 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                  {cliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{cliente.nombre}</h1>
                  <p className="text-slate-500 font-medium mt-1 flex items-center text-sm md:text-base">
                      <svg className="w-4 h-4 mr-1.5 align-text-bottom text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {cliente.telefono || 'Sin teléfono registrado'}
                  </p>
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-6">
         {/* ESTADÍSTICAS */}
         <div className="grid grid-cols-2 gap-4 md:gap-6 mb-10">
            <div className="glass-panel p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
                <div className="relative z-10">
                    <p className="text-[11px] md:text-xs text-indigo-600/80 font-bold uppercase tracking-wider mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Historial Créditos
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-slate-800">{totalPrestamosHistorico}</p>
                </div>
            </div>
            <div className="glass-panel p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
                <div className="relative z-10">
                    <p className="text-[11px] md:text-xs text-emerald-600/80 font-bold uppercase tracking-wider mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Capital Total
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-slate-800">{formatMoney(dineroPrestadoTotal)}</p>
                </div>
            </div>
        </div>

        <div className="space-y-10">
            {/* SECCIÓN 1: PRÉSTAMOS ACTIVOS */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Créditos Activos
                        <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full ml-1 font-bold">{prestamosActivos.length}</span>
                    </h2>
                </div>

                {prestamosActivos.length === 0 ? (
                    <div className="glass-panel p-8 text-center border-dashed border-2 border-slate-300/60 bg-slate-50/50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="text-slate-500 text-base mb-4 font-medium">Este cliente no tiene deudas pendientes en este momento.</p>
                        <Link href={`/nuevo-prestamo?clienteId=${cliente.id}`} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all active:scale-95">
                            <span className="mr-2">+</span> Nuevo Préstamo
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {prestamosActivos.map(prestamo => (
                            <Link key={prestamo.id} href={`/prestamo/${prestamo.id}`} className="block group">
                                <div className="card-hover p-5 relative overflow-hidden bg-white h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-bl-[100px] -mr-4 -mt-4 transition-all duration-300 group-hover:scale-110 z-0"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-indigo-50/80 text-indigo-700 uppercase tracking-wider backdrop-blur-sm border border-indigo-100/50">
                                                    #{prestamo.id}
                                                </span>
                                            </div>
                                            <span className="bg-emerald-100/80 text-emerald-700 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm">
                                                Activo
                                            </span>
                                        </div>
                                        
                                        <p className="text-3xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                            {formatMoney(Number(prestamo.montoCapital))}
                                        </p>
                                        
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-sm">
                                            <p className="text-slate-500 font-medium flex items-center">
                                                <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {new Date(prestamo.fechaInicio).toLocaleDateString('es-PE', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-indigo-600 font-bold flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                Ver detalles <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* SECCIÓN 2: HISTORIAL FINALIZADO */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                    <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    Historial de Operaciones
                </h2>

                {prestamosFinalizados.length === 0 ? (
                    <div className="glass-panel p-6 text-center opacity-70">
                        <p className="text-sm text-slate-400 font-medium">No hay registros de préstamos anteriores.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {prestamosFinalizados.map(prestamo => (
                            <Link key={prestamo.id} href={`/prestamo/${prestamo.id}`} className="block group">
                                <div className="glass-panel p-4 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-600 group-hover:text-slate-900 border-transparent hover:border-indigo-100/50 shadow-none hover:shadow-md hover:shadow-indigo-500/5">
                                    <div className="flex items-center justify-between md:justify-start gap-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-slate-700 text-sm">Préstamo #{prestamo.id}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider
                                                        ${prestamo.estado === 'REFINANCIADO' ? 'bg-amber-100 text-amber-700' : 
                                                          prestamo.estado === 'CANCELADO' ? 'bg-rose-100 text-rose-700' : 
                                                          'bg-slate-200 text-slate-600'}`}>
                                                        {prestamo.estado}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {new Date(prestamo.fechaInicio).toLocaleDateString('es-PE', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                                        <p className="text-base font-bold text-slate-400 line-through decoration-slate-300">
                                            {formatMoney(Number(prestamo.montoCapital))}
                                        </p>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
      </div>
    </div>
  )
}