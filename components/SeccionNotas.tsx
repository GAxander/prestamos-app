'use client'

import { agregarNota, eliminarNota } from '@/app/actions'
import { useRef } from 'react'

type Nota = {
  id: number
  texto: string
  fecha: Date
}

export default function SeccionNotas({ notas, prestamoId }: { notas: Nota[], prestamoId: number }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 mt-6">
      <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-3 flex items-center gap-2">
        📝 Notas y Recordatorios
      </h3>

      {/* LISTA DE NOTAS */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {notas.length === 0 ? (
          <p className="text-xs text-yellow-600 italic text-center py-2">No hay notas registradas.</p>
        ) : (
          notas.map((nota) => (
            <div key={nota.id} className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm relative group">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.texto}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-gray-400 font-medium">
                  {new Date(nota.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Botón Borrar (Solo visible al pasar el mouse) */}
                <form action={eliminarNota}>
                   <input type="hidden" name="notaId" value={nota.id} />
                   <input type="hidden" name="prestamoId" value={prestamoId} />
                   <button className="text-xs text-red-300 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                     Borrar
                   </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMULARIO PARA AGREGAR */}
      <form 
        action={async (formData) => {
            await agregarNota(formData)
            formRef.current?.reset() // Limpia el input después de enviar
        }} 
        ref={formRef}
        className="flex gap-2"
      >
        <input type="hidden" name="prestamoId" value={prestamoId} />
        <input 
          name="texto" 
          type="text" 
          placeholder="Escribe una nota aquí..." 
          required
          autoComplete="off"
          className="flex-1 p-2 text-sm border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        />
        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition-transform active:scale-95">
          Guardar
        </button>
      </form>
    </div>
  )
}