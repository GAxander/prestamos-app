'use client'

import { useState, useEffect } from 'react'
import { crearPrestamo } from '@/app/actions'

type ClienteCorto = {
  id: number
  nombre: string
  telefono: string | null
}

type Props = {
  clientesExistentes?: ClienteCorto[]
}

export default function FormularioPrestamo({ clientesExistentes = [] }: Props) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteId, setClienteId] = useState<number | null>(null)
  
  const [sugerencias, setSugerencias] = useState<ClienteCorto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  const [monto, setMonto] = useState(1000)
  const [interes, setInteres] = useState(10)
  const [cuotas, setCuotas] = useState(1)
  const [frecuencia, setFrecuencia] = useState('MENSUAL')
  const [tipoMensual, setTipoMensual] = useState('30_DIAS')

  // 👇 NUEVOS ESTADOS PARA FECHAS
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaPrimerPago, setFechaPrimerPago] = useState('')
  const [modificoPrimerPago, setModificoPrimerPago] = useState(false)

  const [mora, setMora] = useState(0)
  const [calculo, setCalculo] = useState({ total: 0, cuota: 0, ganancia: 0, tiempo: '' })
  const [cargando, setCargando] = useState(false)

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

    // 👇 MAGIA: Auto-calculamos el primer pago SOLO si tú no lo has modificado a mano
    if (!modificoPrimerPago) {
      const fechaBase = new Date(fechaInicio + 'T12:00:00') // Truco para zona horaria
      fechaBase.setDate(fechaBase.getDate() + dias)
      setFechaPrimerPago(fechaBase.toISOString().split('T')[0])
    }
  }, [monto, interes, cuotas, frecuencia, fechaInicio, modificoPrimerPago]) 

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
    setCargando(true) 
    try {
      await crearPrestamo(formData) 
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error; 
      }
      alert("Hubo un error al crear el préstamo. Por favor revisa los datos.")
      setCargando(false)
    }
  }

  return (
    <form action={handleSubmit} className="p-6 space-y-6">
      <input type="hidden" name="clienteId" value={clienteId || ''} />
      
      {/* 1. CLIENTE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input 
              name="nombre" type="text" placeholder="Ej: Juan Perez" required autoComplete="off"
              value={nombre} onChange={handleNombreChange}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)} 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 font-medium placeholder:text-gray-400" 
            />
            {mostrarSugerencias && sugerencias.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                {sugerencias.map(cliente => (
                  <li 
                    key={cliente.id}
                    onMouseDown={(e) => { e.preventDefault(); seleccionarCliente(cliente) }}
                    className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-gray-800 text-sm flex items-center justify-between">
                      {cliente.nombre}
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Existente</span>
                    </p>
                    {cliente.telefono && <p className="text-xs text-gray-400">📞 {cliente.telefono}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono (WhatsApp)</label>
            <input 
              name="telefono" type="tel" placeholder="999 000 000" 
              value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 font-medium placeholder:text-gray-400" 
            />
          </div>
        </div>
      </div>

      {/* 2. PRÉSTAMO */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Condiciones del Préstamo</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Monto a Prestar (S/)</label>
            <input 
              name="monto" type="number" value={monto} onChange={e => setMonto(Number(e.target.value))}
              className="w-full p-3 font-black text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Frecuencia de Pago</label>
            <select 
              name="frecuencia" value={frecuencia} onChange={e => setFrecuencia(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium"
            >
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>
        </div>

        {frecuencia === 'MENSUAL' && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-yellow-800 mb-1">¿Cómo cobrar el mes?</label>
            <select 
              name="tipoMensual" 
              value={tipoMensual} 
              onChange={e => setTipoMensual(e.target.value)}
              className="w-full p-2 bg-white border border-yellow-300 rounded-lg outline-none text-gray-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400"
            >
              <option value="FECHA_FIJA">El mismo día del mes (Ej: Todo los 15)</option>
              <option value="30_DIAS">Exactamente cada 30 días</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Interés Mensual (%)</label>
            <div className="relative">
              <input 
                name="interes" type="number" value={interes} onChange={e => setInteres(Number(e.target.value))}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" 
              />
              <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">N° de Cuotas</label>
            <input 
              name="cuotas" type="number" value={cuotas} onChange={e => setCuotas(Number(e.target.value))}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" 
            />
          </div>
        </div>

        {/* 👇 AQUÍ ESTÁ EL NUEVO SELECTOR DOBLE DE FECHAS */}
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Día de Entrega (Inicio)</label>
              <input 
                 name="fechaInicio" type="date" value={fechaInicio} 
                 onChange={e => setFechaInicio(e.target.value)} 
                 className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none text-gray-900 font-medium" 
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                 <span>1er Pago 🎯</span>
                 <span className="text-[10px] text-blue-500 font-normal self-center">Editable ✏️</span>
              </label>
              <input 
                 name="fechaPrimerPago" type="date" value={fechaPrimerPago} 
                 onChange={e => { setFechaPrimerPago(e.target.value); setModificoPrimerPago(true); }}
                 className="w-full p-3 bg-yellow-50 border border-yellow-300 text-gray-900 font-medium rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 transition-colors" 
              />
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                 <span>Mora x Día (S/)</span>
                 <span className="text-[10px] text-blue-500 font-normal self-center">Automático ✨</span>
              </label>
              <input 
                 name="moraDiaria" type="number" step="0.01" value={mora} onChange={e => setMora(Number(e.target.value))}
                 className="w-full p-3 bg-blue-50 border border-blue-200 text-blue-900 font-black rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors" 
              />
           </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Resumen del Cálculo</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Monto Cuota</p>
                <p className="text-lg font-black text-blue-900">S/ {calculo.cuota.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Ganancia</p>
                <p className="text-lg font-black text-green-600">S/ {calculo.ganancia.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Total a Recibir</p>
                <p className="text-lg font-black text-blue-900">S/ {calculo.total.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={cargando}
        className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg ${
          cargando 
            ? 'bg-blue-400 cursor-not-allowed opacity-80' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-95'
        }`}
      >
        {cargando ? 'Registrando sistema... ⏳' : 'Crear Préstamo 🚀'}
      </button>

    </form>
  )
}