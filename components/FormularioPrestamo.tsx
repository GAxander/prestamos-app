'use client'

import { useState, useEffect, useRef } from 'react'
import { crearPrestamo } from '@/app/actions'

type ClienteCorto = {
  id: number
  nombre: string
  telefono: string | null
}

type Props = {
  clientesExistentes?: ClienteCorto[]
  categorias?: any[]
}

export default function FormularioPrestamo({ clientesExistentes = [], categorias = [] }: Props) {
  const [categoriaId, setCategoriaId] = useState<number | ''>(categorias.find(c => c.nombre === 'Mío')?.id || '')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteId, setClienteId] = useState<number | null>(null)
  
  const [sugerencias, setSugerencias] = useState<ClienteCorto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  const [monto, setMonto] = useState(1000)
  const [interes, setInteres] = useState(10)
  const [cuotas, setCuotas] = useState(1)
  const [frecuencia, setFrecuencia] = useState('MENSUAL')
  const [tipoMensual, setTipoMensual] = useState('FECHA_FIJA')

  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaPrimerPago, setFechaPrimerPago] = useState('')
  const [modificoPrimerPago, setModificoPrimerPago] = useState(false)

  const [mora, setMora] = useState(0)
  const [calculo, setCalculo] = useState({ total: 0, cuota: 0, ganancia: 0, tiempo: '' })
  const [cargando, setCargando] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    let dias = 1
    if (frecuencia === 'SEMANAL') dias = 7
    if (frecuencia === 'QUINCENAL') dias = 15
    if (frecuencia === 'MENSUAL') dias = 30

    const duracionDias = cuotas * dias
    const ganancia = monto * (interes / 100) * (duracionDias / 30)
    const total = monto + ganancia
    const valorCuota = total / cuotas
    const moraSugerida = duracionDias > 0 ? (ganancia / duracionDias) : 0

    setMora(Number(moraSugerida.toFixed(2)))

    let textoTiempo = `${duracionDias} días`
    if (duracionDias > 30) textoTiempo = `${(duracionDias/30).toFixed(1)} meses`

    setCalculo({ total, cuota: valorCuota, ganancia, tiempo: textoTiempo })

    if (!modificoPrimerPago) {
      const fechaBase = new Date(fechaInicio + 'T12:00:00') 
      
      if (frecuencia === 'MENSUAL' && tipoMensual === 'FECHA_FIJA') {
        fechaBase.setMonth(fechaBase.getMonth() + 1)
      } else {
        fechaBase.setDate(fechaBase.getDate() + dias)
      }
      
      setFechaPrimerPago(fechaBase.toISOString().split('T')[0])
    }
  }, [monto, interes, cuotas, frecuencia, fechaInicio, modificoPrimerPago, tipoMensual]) 

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setNombre(valor)
    setClienteId(null) 

    if (valor.trim().length > 0) {
      const filtrados = clientesExistentes.filter(c => 
        c.nombre.toLowerCase().includes(valor.toLowerCase())
      )
      setSugerencias(filtrados)
      setMostrarSugerencias(true)
    } else {
      setSugerencias([])
      setMostrarSugerencias(false)
    }
  }

  const seleccionarCliente = (cliente: ClienteCorto) => {
    setNombre(cliente.nombre)
    setTelefono(cliente.telefono || '')
    setClienteId(cliente.id)
    setMostrarSugerencias(false)
  }

  const handleSubmit = async (formData: FormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setCargando(true) 
    try {
      await crearPrestamo(formData) 
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error; 
      }
      alert("Hubo un error al crear el préstamo. Por favor revisa los datos.")
      setCargando(false)
      isSubmittingRef.current = false;
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="clienteId" value={clienteId || ''} />
      
      {/* 1. CLIENTE */}
      <div className="glass-panel p-6 md:p-8 bg-white/60">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            1. Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Nombre Completo</label>
            <input 
              name="nombre" type="text" placeholder="Ej: Juan Perez" required autoComplete="off"
              value={nombre} onChange={handleNombreChange}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)} 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400 shadow-sm" 
            />
            {mostrarSugerencias && sugerencias.length > 0 && (
              <ul className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-md border border-indigo-100 rounded-xl shadow-xl shadow-indigo-500/10 max-h-48 overflow-y-auto divide-y divide-slate-50 ring-1 ring-slate-900/5">
                {sugerencias.map(cliente => (
                  <li 
                    key={cliente.id}
                    onMouseDown={(e) => { e.preventDefault(); seleccionarCliente(cliente) }}
                    className="p-3.5 hover:bg-indigo-50/80 cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-slate-800 text-sm flex items-center justify-between">
                      {cliente.nombre}
                      <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-md uppercase font-black tracking-wider">Existente</span>
                    </p>
                    {cliente.telefono && <p className="text-xs text-slate-500 mt-0.5 flex items-center"><svg className="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{cliente.telefono}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Teléfono (WhatsApp)</label>
            <input 
              name="telefono" type="tel" placeholder="999 000 000" 
              value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400 shadow-sm" 
            />
          </div>
        </div>
      </div>

      
      {/* 1.5 CATEGORIA */}
      <div className="glass-panel p-6 md:p-8 bg-white/60">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Categoría del Préstamo
        </h3>
        <div>
           <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
             <span>Seleccionar Categoría</span>
             <a href="/configuracion" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline">Gestionar</a>
           </label>
           <select 
              name="categoriaId" 
              value={categoriaId} 
              onChange={e => setCategoriaId(Number(e.target.value))}
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-medium cursor-pointer shadow-sm"
           >
              <option value="" disabled>-- Elige una categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
           </select>
        </div>
      </div>

      {/* 2. PRÉSTAMO */}
      <div className="glass-panel p-6 md:p-8 bg-white/60">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            2. Condiciones del Préstamo
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Monto (S/)</label>
            <input 
              name="monto" type="number" value={monto} onChange={e => setMonto(Number(e.target.value))}
              className="w-full p-3.5 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-lg transition-all shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Frecuencia</label>
            <select 
              name="frecuencia" value={frecuencia} onChange={e => setFrecuencia(e.target.value)}
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm cursor-pointer"
            >
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>
        </div>

        {frecuencia === 'MENSUAL' && (
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 mb-5 shadow-inner">
            <label className="block text-xs font-black text-amber-800 uppercase tracking-wider mb-2">¿Cómo cobrar el mes?</label>
            <select 
              name="tipoMensual" 
              value={tipoMensual} 
              onChange={e => setTipoMensual(e.target.value)}
              className="w-full p-3 bg-white border border-amber-300 rounded-lg outline-none text-amber-900 font-medium focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer shadow-sm text-sm"
            >
              <option value="FECHA_FIJA">El mismo día del mes (Ej: Todos los 15)</option>
              <option value="30_DIAS">Exactamente cada 30 días</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Interés Mensual</label>
            <div className="relative">
              <input 
                name="interes" type="number" value={interes} onChange={e => setInteres(Number(e.target.value))}
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm pr-10 hover:border-slate-400 focus:hover:border-indigo-400" 
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-black">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">N° de Cuotas</label>
            <input 
              name="cuotas" type="number" value={cuotas} onChange={e => setCuotas(Number(e.target.value))}
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
           <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Día de Entrega</label>
              <input 
                 name="fechaInicio" type="date" value={fechaInicio} 
                 onChange={e => setFechaInicio(e.target.value)} 
                 className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm cursor-pointer" 
              />
           </div>
           <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
                 <span>1er Pago</span>
                 <span className="text-[9px] text-indigo-500 font-black self-center bg-indigo-50 px-2 py-0.5 rounded uppercase">Editable</span>
              </label>
              <input 
                 name="fechaPrimerPago" type="date" value={fechaPrimerPago} 
                 onChange={e => { setFechaPrimerPago(e.target.value); setModificoPrimerPago(true); }}
                 className="w-full p-3.5 bg-indigo-50/40 border border-indigo-200 text-slate-900 font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm cursor-pointer hover:bg-white" 
              />
           </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
           <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
                 <span>Mora x Día (S/)</span>
                 <span className="text-[9px] text-emerald-600 font-black self-center bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Automático</span>
              </label>
              <input 
                 name="moraDiaria" type="number" step="0.01" value={mora} onChange={e => setMora(Number(e.target.value))}
                 className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-black rounded-xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" 
              />
           </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 md:p-8 shadow-xl shadow-indigo-900/20 relative overflow-hidden border border-indigo-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-5 flex items-center justify-between">
            <span>Resumen Financiero</span>
            <span className="bg-indigo-800/50 text-indigo-200 px-2.5 py-1 rounded text-[10px]">{calculo.tiempo}</span>
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-indigo-800/50">
            <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Monto Cuota</p>
                <p className="text-xl md:text-2xl font-black text-white">S/ {calculo.cuota.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Ganancia</p>
                <p className="text-xl md:text-2xl font-black text-emerald-400">+ S/ {calculo.ganancia.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Total a Recibir</p>
                <p className="text-xl md:text-2xl font-black text-white">S/ {calculo.total.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={cargando}
        className={`w-full text-white font-black py-4 md:py-5 rounded-2xl shadow-xl transition-all text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-2 ${
          cargando 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-[0.98]'
        }`}
      >
        {cargando ? (
            <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Procesando Crédito...
            </>
        ) : (
            <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Registrar Nuevo Préstamo
            </>
        )}
      </button>

    </form>
  )
}