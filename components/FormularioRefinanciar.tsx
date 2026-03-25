'use client'

import { useState, useEffect } from 'react'
import { procesarRenovacion } from '@/app/actions'
import Link from 'next/link'

type Props = {
  prestamo: any
  deudaReal: number
}

export default function FormularioRefinanciar({ prestamo, deudaReal }: Props) {
  const [deudaActual, setDeudaActual] = useState(deudaReal)

  // ESTADOS DEL FORMULARIO
  const [pagoHoy, setPagoHoy] = useState(0)
  const [aumentoCapital, setAumentoCapital] = useState(0)
  const [nuevoInteres, setNuevoInteres] = useState(Number(prestamo.interesPorcentaje))
  const [nuevasCuotas, setNuevasCuotas] = useState(1) 
  const [nuevaFrecuencia, setNuevaFrecuencia] = useState(prestamo.frecuencia)
  const [tipoMensual, setTipoMensual] = useState('FECHA_FIJA')
  const [moraDiaria, setMoraDiaria] = useState(0)

  // FECHAS
  const [fechaRenovacion, setFechaRenovacion] = useState(new Date().toISOString().split('T')[0])
  const [fechaPrimerPago, setFechaPrimerPago] = useState('')
  const [modificoPrimerPago, setModificoPrimerPago] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [resumen, setResumen] = useState({ nuevoCapitalBase: 0, interesGenerado: 0, totalDeudaNueva: 0, montoCuota: 0, tiempoEstimado: '' })

  useEffect(() => {
    const capitalBase = (deudaActual - pagoHoy) + aumentoCapital

    let dias = 1
    if (nuevaFrecuencia === 'SEMANAL') dias = 7
    if (nuevaFrecuencia === 'QUINCENAL') dias = 15
    if (nuevaFrecuencia === 'MENSUAL') dias = 30
    
    const duracionDias = nuevasCuotas * dias
    const ganancia = capitalBase * (nuevoInteres / 100) * (duracionDias / 30)

    const total = capitalBase + ganancia
    const cuota = nuevasCuotas > 0 ? total / nuevasCuotas : 0
    const moraSugerida = duracionDias > 0 ? (ganancia / duracionDias) : 0
    setMoraDiaria(Number(moraSugerida.toFixed(2)))

    let textoTiempo = `${duracionDias} días`
    if (duracionDias > 30) textoTiempo = `${(duracionDias/30).toFixed(1)} meses`

    setResumen({ nuevoCapitalBase: capitalBase, interesGenerado: ganancia, totalDeudaNueva: total, montoCuota: cuota, tiempoEstimado: textoTiempo })

    if (!modificoPrimerPago) {
      const fechaBase = new Date(fechaRenovacion + 'T12:00:00') 
      if (nuevaFrecuencia === 'MENSUAL' && tipoMensual === 'FECHA_FIJA') {
        fechaBase.setMonth(fechaBase.getMonth() + 1)
      } else {
        fechaBase.setDate(fechaBase.getDate() + dias)
      }
      setFechaPrimerPago(fechaBase.toISOString().split('T')[0])
    }

  }, [deudaActual, pagoHoy, aumentoCapital, nuevoInteres, nuevasCuotas, nuevaFrecuencia, fechaRenovacion, modificoPrimerPago, tipoMensual])

  const handleSubmit = async (formData: FormData) => {
    setCargando(true)
    try {
      await procesarRenovacion(formData)
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      alert("Hubo un error al refinanciar.")
      setCargando(false)
    }
  }

  return (
    <div className="glass-panel w-full max-w-lg overflow-hidden bg-white/90">
      
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                   Refinanciar <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </h1>
                <p className="text-amber-100/90 text-sm mt-1 font-medium">{prestamo.cliente.nombre} • #{prestamo.id}</p>
            </div>
          </div>
      </div>

      <form action={handleSubmit} className="p-6 md:p-8 space-y-8 relative">
          <input type="hidden" name="prestamoId" value={prestamo.id} />
          <input type="hidden" name="deudaActual" value={deudaActual} />
          
          {/* 1. SITUACIÓN ACTUAL */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
              <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deuda Pendiente Real</label>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold text-xl">S/</span>
                  <input type="number" value={deudaActual} onChange={e => setDeudaActual(Number(e.target.value))} className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full tracking-tighter" />
              </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">¿Paga algo hoy?</label>
                  <div className="relative">
                      <span className="absolute left-4 top-3.5 text-emerald-500 font-bold">S/</span>
                      <input name="pagoHoy" type="number" value={pagoHoy} onChange={e => setPagoHoy(Number(e.target.value))} className="w-full pl-9 pr-3 py-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl outline-none font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" />
                  </div>
              </div>
              <div>
                  <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">¿Prestar más?</label>
                  <div className="relative">
                     <span className="absolute left-4 top-3.5 text-indigo-400 font-bold">S/</span>
                     <input name="aumentoCapital" type="number" value={aumentoCapital} onChange={e => setAumentoCapital(Number(e.target.value))} className="w-full pl-9 pr-3 py-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm" />
                  </div>
              </div>
          </div>

          {/* 3. NUEVAS CONDICIONES */}
          <div className="space-y-5 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Nuevas Condiciones
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Frecuencia</label>
                      <select name="nuevaFrecuencia" value={nuevaFrecuencia} onChange={e => setNuevaFrecuencia(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                          <option value="DIARIO">Diario</option>
                          <option value="SEMANAL">Semanal</option>
                          <option value="QUINCENAL">Quincenal</option>
                          <option value="MENSUAL">Mensual</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">N° Cuotas</label>
                      <input name="nuevasCuotas" type="number" value={nuevasCuotas} onChange={e => setNuevasCuotas(Number(e.target.value))} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                   </div>
              </div>

              {nuevaFrecuencia === 'MENSUAL' && (
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/60 shadow-inner">
                  <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">¿Cómo cobrar el mes?</label>
                  <select name="tipoMensual" value={tipoMensual} onChange={e => setTipoMensual(e.target.value)} className="w-full p-3 bg-white border border-amber-300 rounded-lg outline-none text-amber-900 text-sm font-bold shadow-sm cursor-pointer focus:ring-2 focus:ring-amber-500/30">
                    <option value="FECHA_FIJA">El mismo día del mes (Ej: Todos los 15)</option>
                    <option value="30_DIAS">Exactamente cada 30 días</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Renovación</label>
                    <input name="fechaRenovacion" type="date" value={fechaRenovacion} onChange={e => setFechaRenovacion(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                       <span>1er Pago</span>
                       <span className="bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">Edita✏️</span>
                    </label>
                    <input name="fechaPrimerPago" type="date" value={fechaPrimerPago} onChange={e => { setFechaPrimerPago(e.target.value); setModificoPrimerPago(true); }} className="w-full p-3.5 bg-indigo-50/40 border border-indigo-200 text-slate-800 font-bold rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-indigo-400 cursor-pointer hover:bg-white transition-colors" />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Interés Mensual</label>
                      <div className="relative">
                          <input name="nuevoInteres" type="number" value={nuevoInteres} onChange={e => setNuevoInteres(Number(e.target.value))} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 pr-10" />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-black">%</span>
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                          <span>Mora x Día</span>
                          <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Auto</span>
                      </label>
                      <input name="moraDiaria" type="number" step="0.01" value={moraDiaria} onChange={e => setMoraDiaria(Number(e.target.value))} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-600 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-colors" />
                   </div>
              </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 border border-indigo-800 shadow-xl shadow-indigo-900/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="relative z-10 flex justify-between items-start mb-6 border-b border-indigo-800/50 pb-4">
                  <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Nuevo Capital Base</p>
                      <p className="text-xl font-black text-white">S/ {resumen.nuevoCapitalBase.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Interés a Ganar</p>
                      <p className="text-xl font-black text-emerald-400">+ S/ {resumen.interesGenerado.toFixed(2)}</p>
                  </div>
              </div>
              <div className="relative z-10 flex justify-between items-center">
                  <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Nueva Cuota ({nuevasCuotas})</p>
                      <p className="text-3xl font-black text-white tracking-tighter">S/ {resumen.montoCuota.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Final</p>
                       <p className="text-lg font-bold text-slate-300">S/ {resumen.totalDeudaNueva.toFixed(2)}</p>
                  </div>
              </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
              <Link href={`/prestamo/${prestamo.id}`} className="md:w-1/3 py-4 text-center text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-wider">Cancelar</Link>
              <button type="submit" disabled={cargando} className={`md:w-2/3 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${cargando ? 'bg-amber-400/50 cursor-not-allowed text-white/70 shadow-none' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 hover:shadow-amber-500/40'}`}>
                  {cargando ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Procesando...
                      </>
                  ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Confirmar Refinanciamiento
                      </>
                  )}
              </button>
          </div>
      </form>
    </div>
  )
}