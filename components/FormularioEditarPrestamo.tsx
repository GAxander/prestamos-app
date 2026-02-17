'use client'

import { useState } from 'react'
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
  const [nombre, setNombre] = useState(prestamo.cliente.nombre)
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  
  const hayPagos = prestamo.cuotas.some((c: any) => c.estado === 'PAGADO')

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

  return (
    <div className="p-6 space-y-8">
      {/* FORMULARIO DE EDICIÓN */}
      <form action={actualizarPrestamo} className="space-y-4">
        <input type="hidden" name="prestamoId" value={prestamo.id} />
        
        <div className="space-y-2 relative">
          <label className="text-sm font-bold text-gray-700">Cambiar Dueño (Cliente)</label>
          <div className="relative">
            <input 
              type="text" 
              name="nombre"
              value={nombre}
              onChange={(e) => manejarBusqueda(e.target.value)}
              autoComplete="off"
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Buscar cliente..."
            />
            {mostrarLista && sugerencias.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                {sugerencias.map((cliente) => (
                  <li 
                    key={cliente.id}
                    onClick={() => seleccionarCliente(cliente.nombre)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-700"
                  >
                    {cliente.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Corregir Fecha Inicio</label>
          <input 
            name="fechaInicio" 
            type="date" 
            defaultValue={new Date(prestamo.fechaInicio).toISOString().split('T')[0]} 
            className={`w-full p-3 border rounded-lg ${hayPagos ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
            readOnly={hayPagos} 
          />
          {hayPagos && <p className="text-[10px] text-red-500">🚫 No puedes cambiar fecha con pagos activos.</p>}
        </div>

        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">
          Guardar Cambios
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* ZONA DE PELIGRO */}
      <div className={`p-4 rounded-xl border transition-colors duration-300 ${confirmarEliminar ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100'}`}>
        <h3 className="text-red-800 font-bold text-sm mb-2">Zona de Peligro</h3>
        
        {!confirmarEliminar ? (
          <>
            <p className="text-xs text-red-600 mb-3">
              Eliminar este préstamo borrará todo su historial permanentemente.
            </p>
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                setConfirmarEliminar(true);
              }}
              className="w-full py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-600 hover:text-white transition"
            >
              🗑 Eliminar Préstamo
            </button>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-200">
            <p className="text-sm font-black text-red-700 mb-1">⚠ ¿ESTÁS SEGURO?</p>
            <p className="text-xs text-red-800 mb-3">
              Se borrarán el préstamo, las cuotas y los pagos. <br/>
              <strong>Esta acción es final.</strong>
            </p>
            
            <div className="flex gap-2">
               <button 
                 type="button"
                 onClick={() => setConfirmarEliminar(false)}
                 className="w-1/2 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50"
               >
                 Cancelar
               </button>

               <form action={eliminarPrestamo} className="w-1/2">
                  <input type="hidden" name="prestamoId" value={prestamo.id} />
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md"
                  >
                    ¡Sí, Eliminar!
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
         <Link href={`/prestamo/${prestamo.id}`} className="text-gray-400 text-sm hover:underline">Cancelar y Volver</Link>
      </div>
    </div>
  )
}