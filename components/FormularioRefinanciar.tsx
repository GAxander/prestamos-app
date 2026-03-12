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

  // 👇 FECHAS INTELIGENTES
  const [fechaRenovacion, setFechaRenovacion] = useState(new Date().toISOString().split('T')[0])
  const [fechaPrimerPago, setFechaPrimerPago] = useState('')
  const [modificoPrimerPago, setModificoPrimerPago] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [resumen, setResumen] = useState({ nuevoCapitalBase: 0, interesGenerado: 0, totalDeudaNueva: 0, montoCuota: 0, tiempoEstimado: '' })

  // EFECTO: CÁLCULO EN TIEMPO REAL 🧮
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

    // 👇 MAGIA DE FECHAS
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
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      
      <div className="bg-yellow-500 p-6 text-white">
          <h1 className="text-xl font-black">Refinanciar Préstamo 🔄</h1>
          <p className="text-yellow-100 text-sm">{prestamo.cliente.nombre} • Préstamo #{prestamo.id}</p>
      </div>

      <form action={handleSubmit} className="p-6 space-y-6">
          <input type="hidden" name="prestamoId" value={prestamo.id} />
          <input type="hidden" name="deudaActual" value={deudaActual} />
          
          {/* 1. SITUACIÓN ACTUAL */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Deuda Pendiente Real</label>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">S/</span>
                  <input type="number" value={deudaActual} onChange={e => setDeudaActual(Number(e.target.value))} className="bg-transparent text-2xl font-black text-gray-900 outline-none w-full" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">¿Cuánto paga HOY?</label>
                  <input name="pagoHoy" type="number" value={pagoHoy} onChange={e => setPagoHoy(Number(e.target.value))} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none font-bold text-green-600 focus:border-green-500" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">¿Capital Extra? (Mano)</label>
                  <input name="aumentoCapital" type="number" value={aumentoCapital} onChange={e => setAumentoCapital(Number(e.target.value))} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none font-bold text-blue-600 focus:border-blue-500" />
              </div>
          </div>

          {/* 3. NUEVAS CONDICIONES */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nuevas Condiciones</h3>
              
              <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Frecuencia</label>
                      <select name="nuevaFrecuencia" value={nuevaFrecuencia} onChange={e => setNuevaFrecuencia(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium">
                          <option value="DIARIO">Diario</option>
                          <option value="SEMANAL">Semanal</option>
                          <option value="QUINCENAL">Quincenal</option>
                          <option value="MENSUAL">Mensual</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">N° Cuotas</label>
                      <input name="nuevasCuotas" type="number" value={nuevasCuotas} onChange={e => setNuevasCuotas(Number(e.target.value))} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" />
                   </div>
              </div>

              {nuevaFrecuencia === 'MENSUAL' && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <label className="block text-xs font-bold text-yellow-800 mb-1">¿Cómo cobrar el mes?</label>
                  <select name="tipoMensual" value={tipoMensual} onChange={e => setTipoMensual(e.target.value)} className="w-full p-2 bg-white border border-yellow-300 rounded-lg outline-none text-gray-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400">
                    <option value="FECHA_FIJA">El mismo día del mes (Ej: Todos los 15)</option>
                    <option value="30_DIAS">Exactamente cada 30 días</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Renovación</label>
                    <input name="fechaRenovacion" type="date" value={fechaRenovacion} onChange={e => setFechaRenovacion(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                       <span>1er Pago 🎯</span>
                       <span className="text-[10px] text-blue-500 font-normal self-center">Editable ✏️</span>
                    </label>
                    <input name="fechaPrimerPago" type="date" value={fechaPrimerPago} onChange={e => { setFechaPrimerPago(e.target.value); setModificoPrimerPago(true); }} className="w-full p-3 bg-yellow-50 border border-yellow-300 text-gray-900 font-medium rounded-lg outline-none focus:ring-2 focus:ring-yellow-400" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Interés Mensual (%)</label>
                      <input name="nuevoInteres" type="number" value={nuevoInteres} onChange={e => setNuevoInteres(Number(e.target.value))} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mora x Día (Auto)</label>
                      <input name="moraDiaria" type="number" step="0.01" value={moraDiaria} onChange={e => setMoraDiaria(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" />
                   </div>
              </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-inner">
              <div className="flex justify-between items-start mb-4 border-b border-blue-100 pb-2">
                  <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">Nuevo Capital Base</p>
                      <p className="text-xl font-black text-gray-800">S/ {resumen.nuevoCapitalBase.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-bold text-green-500 uppercase">Interés a Ganar</p>
                      <p className="text-xl font-black text-green-600">+ S/ {resumen.interesGenerado.toFixed(2)}</p>
                  </div>
              </div>
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Nueva Cuota ({nuevasCuotas})</p>
                      <p className="text-2xl font-black text-blue-700">S/ {resumen.montoCuota.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Total Final</p>
                       <p className="text-lg font-bold text-gray-600">S/ {resumen.totalDeudaNueva.toFixed(2)}</p>
                  </div>
              </div>
          </div>

          <div className="flex gap-3">
              <Link href={`/prestamo/${prestamo.id}`} className="flex-1 py-4 text-center text-gray-500 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</Link>
              <button type="submit" disabled={cargando} className={`flex-[2] text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 ${cargando ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200'}`}>
                  {cargando ? 'Procesando... ⏳' : 'Confirmar Refinanciamiento'}
              </button>
          </div>
      </form>
    </div>
  )
}