'use client'

import { useState, useEffect } from 'react'
import { actualizarPrestamo, eliminarPrestamo } from '@/app/actions'
import Link from 'next/link'

type Cliente = {
  id: number
  nombre: string
}

type Props = {
  prestamo: any
  clientes: any[]
  categorias?: any[]
}

export default function FormularioEditarPrestamo({ prestamo, clientes, categorias = [] }: Props) {
  const [categoriaId, setCategoriaId] = useState<number | ''>(prestamo.categoriaId || '')
  const hayPagos = prestamo.cuotas.some((c: any) => c.estado === 'PAGADO')

  const [nombre, setNombre] = useState(prestamo.cliente.nombre)
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [cargando, setCargando] = useState(false)

  const primeraCuota = prestamo.cuotas?.find((c: any) => c.numero === 1)
  const fechaPrimeraCuota = primeraCuota 
      ? new Date(primeraCuota.fechaVencimiento).toISOString().split('T')[0] 
      : new Date(prestamo.fechaInicio).toISOString().split('T')[0]

  const [fechaInicio, setFechaInicio] = useState(new Date(prestamo.fechaInicio).toISOString().split('T')[0])
  const [fechaPrimerPago, setFechaPrimerPago] = useState(fechaPrimeraCuota)
  const [tipoMensual, setTipoMensual] = useState('FECHA_FIJA')

  const [monto, setMonto] = useState(Number(prestamo.montoCapital))
  const [frecuencia, setFrecuencia] = useState(prestamo.frecuencia)
  const [cuotas, setCuotas] = useState(prestamo.plazo)
  const [interes, setInteres] = useState(Number(prestamo.interesPorcentaje))
  const [mora, setMora] = useState(Number(prestamo.moraDiaria || 0))

  useEffect(() => {
    if (!hayPagos) {
      let dias = 1
      if (frecuencia === 'SEMANAL') dias = 7
      if (frecuencia === 'QUINCENAL') dias = 15
      if (frecuencia === 'MENSUAL') dias = 30

      const duracionDias = cuotas * dias
      const ganancia = monto * (interes / 100) * (duracionDias / 30)
      const moraSugerida = duracionDias > 0 ? (ganancia / duracionDias) : 0

      setMora(Number(moraSugerida.toFixed(2)))
    }
  }, [monto, interes, cuotas, frecuencia, hayPagos])

  const manejarBusqueda = (texto: string) => {
    setNombre(texto)
    if (texto.length > 0) {
      const coincidencias = clientes.filter(c => 
        c.nombre.toLowerCase().includes(texto.toLowerCase())
      )
      setSugerencias(coincidencias)
      setMostrarLista(true)
    } else {
      setMostrarLista(false)
    }
  }

  const seleccionarCliente = (nombreCliente: string) => {
    setNombre(nombreCliente)
    setMostrarLista(false)
  }

  const handleSubmit = async (formData: FormData) => {
    setCargando(true)
    try {
      await actualizarPrestamo(formData)
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error; 
      }
      alert("Error al actualizar el préstamo.")
      setCargando(false)
    }
  }

  return (
    <div className="glass-panel p-6 md:p-8 space-y-8 bg-white/90">
      
      {hayPagos && (
        <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-3 animate-in fade-in shadow-inner">
          <svg className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Préstamo En Progreso</p>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">Existen abonos registrados. Por integridad contable, los parámetros financieros están bloqueados. Para reestructurar la deuda, vuelve al préstamo y usa la opción <strong>Refinanciar</strong>.</p>
          </div>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="prestamoId" value={prestamo.id} />
        
        <div className="space-y-2 relative">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Otorga el préstamo a</label>
          <div className="relative">
            <input 
              type="text" name="nombre" value={nombre} onChange={(e) => manejarBusqueda(e.target.value)} autoComplete="off"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-400 font-medium shadow-sm transition-all"
            />
            {mostrarLista && sugerencias.length > 0 && (
              <ul className="absolute z-50 w-full bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-xl mt-2 max-h-48 overflow-y-auto ring-1 ring-slate-900/5 divide-y divide-slate-50">
                {sugerencias.map((cliente) => (
                  <li key={cliente.id} onClick={() => seleccionarCliente(cliente.nombre)} className="p-4 hover:bg-indigo-50/80 cursor-pointer text-slate-800 font-bold text-sm transition-colors">
                    {cliente.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2 relative mb-6">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block flex justify-between">
            <span>Categoría del Préstamo</span>
            <a href="/configuracion" target="_blank" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline">Añadir Nueva</a>
          </label>
          <select 
             name="categoriaId" 
             value={categoriaId} 
             onChange={e => setCategoriaId(Number(e.target.value) || '')}
             required
             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-bold cursor-pointer shadow-sm"
          >
             <option value="" disabled>-- Elige una categoría --</option>
             {categorias.map(cat => (
               <option key={cat.id} value={cat.id}>{cat.nombre}</option>
             ))}
          </select>
        </div>

        <div className="space-y-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Condiciones Iniciales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Frecuencia</label>
                {hayPagos ? (
                    <input name="frecuencia" type="text" value={frecuencia} readOnly className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-slate-400 cursor-not-allowed" />
                ) : (
                    <select name="frecuencia" value={frecuencia} onChange={e => setFrecuencia(e.target.value)} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl outline-none text-slate-800 font-bold shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all">
                    <option value="DIARIO">Diario</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="MENSUAL">Mensual</option>
                    </select>
                )}
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">N° Cuotas</label>
                <input 
                name="cuotas" type="number" value={cuotas} onChange={e => setCuotas(Number(e.target.value))} readOnly={hayPagos}
                className={`w-full p-3.5 border border-slate-200 rounded-xl outline-none font-bold shadow-sm transition-all ${hayPagos ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'}`}
                />
            </div>
            </div>

            {frecuencia === 'MENSUAL' && !hayPagos && (
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/60 shadow-inner">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">¿Cómo cobrar el mes?</label>
                <select 
                name="tipoMensual" 
                value={tipoMensual} 
                onChange={e => setTipoMensual(e.target.value)}
                className="w-full p-3 bg-white border border-amber-300 rounded-lg outline-none text-amber-900 text-sm font-bold shadow-sm cursor-pointer focus:ring-2 focus:ring-amber-400 transition-all"
                >
                <option value="FECHA_FIJA">El mismo día del mes (Ej: Todos los 15)</option>
                <option value="30_DIAS">Exactamente cada 30 días</option>
                </select>
            </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Reparto</label>
                <input 
                name="fechaInicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} readOnly={hayPagos} 
                className={`w-full p-3.5 border border-slate-200 rounded-xl outline-none font-bold shadow-sm transition-all ${hayPagos ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer'}`}
                />
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>1er Pago</span>
                    {!hayPagos && <span className="bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">Edita</span>}
                </label>
                <input 
                name="fechaPrimerPago" type="date" value={fechaPrimerPago} onChange={e => setFechaPrimerPago(e.target.value)} readOnly={hayPagos} 
                className={`w-full p-3.5 border rounded-xl outline-none font-bold shadow-sm transition-all ${hayPagos ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-50/40 border-indigo-200 text-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer hover:bg-white'}`}
                />
            </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Monto Solicitado (S/)</label>
                <input 
                name="monto" type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} readOnly={hayPagos}
                className={`w-full p-3.5 border border-slate-200 rounded-xl outline-none font-black shadow-sm transition-all ${hayPagos ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'}`}
                />
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Interés Mensual (%)</label>
                <input 
                name="interes" type="number" value={interes} onChange={e => setInteres(Number(e.target.value))} readOnly={hayPagos}
                className={`w-full p-3.5 border border-slate-200 rounded-xl outline-none font-bold shadow-sm transition-all ${hayPagos ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'}`}
                />
            </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Mora x Día (S/)</span>
                    {!hayPagos && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black flex items-center gap-1">Auto ✨</span>}
                </label>
                <input 
                name="moraDiaria" type="number" step="0.01" value={mora} onChange={e => setMora(Number(e.target.value))} readOnly={hayPagos}
                className={`w-full p-3.5 border border-slate-200 rounded-xl outline-none font-black shadow-sm transition-all ${hayPagos ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'}`}
                />
            </div>
            </div>
        </div>

        <button type="submit" disabled={cargando} className={`w-full py-4 uppercase tracking-widest text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 ${cargando ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:shadow-indigo-500/40'}`}>
          {cargando ? 'Guardando Parametros ⏳' : 'Guardar Configuraciones'}
        </button>
      </form>

      {/* ZONA DE PELIGRO */}
      <div className={`mt-8 p-6 rounded-2xl border transition-all duration-300 ${confirmarEliminar ? 'bg-rose-50 border-rose-200 shadow-inner' : 'bg-white border-rose-100 shadow-[0_4px_12px_-4px_rgba(225,29,72,0.1)]'}`}>
        <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Zona de Peligro Extremo
        </h3>
        
        {!confirmarEliminar ? (
          <button type="button" onClick={(e) => { e.preventDefault(); setConfirmarEliminar(true); }} className="w-full py-3.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:text-rose-700 transition font-medium flex items-center justify-center gap-2 shadow-sm uppercase tracking-wide text-xs">
            Eliminar Registro Financiero Completo
          </button>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
            <p className="text-base font-black text-rose-700 mb-1 tracking-tight">⚠ PRECAUCIÓN DE CASCADA</p>
            <p className="text-[11px] text-rose-600/80 mb-5 font-bold uppercase tracking-widest">
              Se purgará 1 préstamo, {prestamo.cuotas?.length || 0} cuotas y todo el historial de pagos irreversiblemente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
               <button type="button" onClick={() => setConfirmarEliminar(false)} className="w-full sm:w-1/2 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition shadow-sm">Abortar</button>
               <form action={eliminarPrestamo} className="w-full sm:w-1/2">
                  <input type="hidden" name="prestamoId" value={prestamo.id} />
                  <button type="submit" className="w-full py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition">Ejecutar Eliminación</button>
               </form>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center mt-6">
         <Link href={`/prestamo/${prestamo.id}`} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors">Cancelar Mantenimiento y Volver</Link>
      </div>
    </div>
  )
}