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
  clientes: Cliente[]
}

export default function FormularioEditarPrestamo({ prestamo, clientes }: Props) {
  const hayPagos = prestamo.cuotas.some((c: any) => c.estado === 'PAGADO')

  const [nombre, setNombre] = useState(prestamo.cliente.nombre)
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [cargando, setCargando] = useState(false)

  // Estados para edición completa
  const [fechaInicio, setFechaInicio] = useState(new Date(prestamo.fechaInicio).toISOString().split('T')[0])
  const [monto, setMonto] = useState(Number(prestamo.montoCapital))
  const [frecuencia, setFrecuencia] = useState(prestamo.frecuencia)
  const [cuotas, setCuotas] = useState(prestamo.plazo)
  const [interes, setInteres] = useState(Number(prestamo.interesPorcentaje))
  const [mora, setMora] = useState(Number(prestamo.moraDiaria || 0))

  // 👇 NUEVO: EFECTO MATEMÁTICO PARA AUTO-CALCULAR LA MORA
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
    <div className="p-6 space-y-8">
      
      {hayPagos && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2 animate-in fade-in">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-xs font-bold text-orange-800 uppercase">Préstamo con Pagos</p>
            <p className="text-[10px] text-orange-600 mt-0.5">Ya existen abonos. Por seguridad contable, los montos y fechas están bloqueados. Si necesitas reestructurar, usa la opción <strong>Refinanciar</strong>.</p>
          </div>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="prestamoId" value={prestamo.id} />
        
        <div className="space-y-2 relative">
          <label className="text-sm font-bold text-gray-700">Dueño del Préstamo</label>
          <div className="relative">
            <input 
              type="text" name="nombre" value={nombre} onChange={(e) => manejarBusqueda(e.target.value)} autoComplete="off"
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder:text-gray-400"
            />
            {mostrarLista && sugerencias.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                {sugerencias.map((cliente) => (
                  <li key={cliente.id} onClick={() => seleccionarCliente(cliente.nombre)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-900 font-medium">
                    {cliente.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Monto Capital (S/)</label>
            <input 
              name="monto" type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} readOnly={hayPagos}
              className={`w-full p-3 border rounded-lg outline-none font-medium ${hayPagos ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Fecha de Inicio</label>
            <input 
              name="fechaInicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} readOnly={hayPagos} 
              className={`w-full p-3 border rounded-lg outline-none font-medium ${hayPagos ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Frecuencia</label>
            {hayPagos ? (
               <input name="frecuencia" type="text" value={frecuencia} readOnly className="w-full p-3 border rounded-lg outline-none font-medium bg-gray-100 text-gray-400" />
            ) : (
               <select name="frecuencia" value={frecuencia} onChange={e => setFrecuencia(e.target.value)} className="w-full p-3 bg-white border rounded-lg outline-none text-gray-900 font-medium">
                 <option value="DIARIO">Diario</option>
                 <option value="SEMANAL">Semanal</option>
                 <option value="QUINCENAL">Quincenal</option>
                 <option value="MENSUAL">Mensual</option>
               </select>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">N° Cuotas</label>
            <input 
              name="cuotas" type="number" value={cuotas} onChange={e => setCuotas(Number(e.target.value))} readOnly={hayPagos}
              className={`w-full p-3 border rounded-lg outline-none font-medium ${hayPagos ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Interés (%)</label>
            <input 
              name="interes" type="number" value={interes} onChange={e => setInteres(Number(e.target.value))} readOnly={hayPagos}
              className={`w-full p-3 border rounded-lg outline-none font-medium ${hayPagos ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
            />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-bold text-gray-700 flex justify-between">
                 <span>Mora x Día (S/)</span>
                 {!hayPagos && <span className="text-[10px] text-blue-500 font-normal self-center">Auto ✨</span>}
             </label>
            <input 
              name="moraDiaria" type="number" step="0.01" value={mora} onChange={e => setMora(Number(e.target.value))} readOnly={hayPagos}
              className={`w-full p-3 border rounded-lg outline-none font-medium ${hayPagos ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
            />
          </div>
        </div>

        <button type="submit" disabled={cargando} className={`w-full py-4 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {cargando ? 'Guardando...' : 'Guardar Cambios 💾'}
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* ZONA DE PELIGRO */}
      <div className={`p-4 rounded-xl border transition-colors duration-300 ${confirmarEliminar ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100'}`}>
        <h3 className="text-red-800 font-bold text-sm mb-2">Zona de Peligro</h3>
        
        {!confirmarEliminar ? (
          <button type="button" onClick={(e) => { e.preventDefault(); setConfirmarEliminar(true); }} className="w-full py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-600 hover:text-white transition">
            🗑 Eliminar Préstamo
          </button>
        ) : (
          <div className="animate-in fade-in zoom-in duration-200">
            <p className="text-sm font-black text-red-700 mb-1">⚠ ¿ESTÁS SEGURO?</p>
            <p className="text-xs text-red-800 mb-3">Se borrarán el préstamo, las cuotas y los pagos permanentemente.</p>
            <div className="flex gap-2">
               <button type="button" onClick={() => setConfirmarEliminar(false)} className="w-1/2 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50">Cancelar</button>
               <form action={eliminarPrestamo} className="w-1/2">
                  <input type="hidden" name="prestamoId" value={prestamo.id} />
                  <button type="submit" className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">¡Sí, Eliminar!</button>
               </form>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
         <Link href={`/prestamo/${prestamo.id}`} className="text-gray-400 font-medium text-sm hover:underline">Cancelar y Volver</Link>
      </div>
    </div>
  )
}