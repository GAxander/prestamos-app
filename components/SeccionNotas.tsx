'use client'

import { agregarNota, eliminarNota } from '@/app/actions'
import { useRef, useState } from 'react'

type Nota = {
  id: number
  texto: string
  fecha: Date
}

export default function SeccionNotas({ notas, prestamoId }: { notas: Nota[], prestamoId: number }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [guardando, setGuardando] = useState(false)

  return (
    <div className="glass-panel rounded-2xl border border-amber-200/60 p-5 md:p-6 bg-amber-50/30">
      <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        Notas y Recordatorios
      </h3>

      {/* LISTA DE NOTAS */}
      <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {notas.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-amber-200/50 rounded-xl">
            <p className="text-xs text-amber-600/70 font-bold uppercase tracking-widest">No hay notas registradas</p>
          </div>
        ) : (
          notas.map((nota) => (
            <div key={nota.id} className="bg-white/80 backdrop-blur p-4 rounded-xl border border-amber-100 shadow-sm relative group hover:shadow-md transition-all">
              <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{nota.texto}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {new Date(nota.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Botón Borrar (Solo visible al pasar el mouse) */}
                <form action={eliminarNota} className="absolute top-2 right-2">
                   <input type="hidden" name="notaId" value={nota.id} />
                   <input type="hidden" name="prestamoId" value={prestamoId} />
                   <button className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 font-bold opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100" title="Eliminar nota">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
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
            setGuardando(true)
            await agregarNota(formData)
            formRef.current?.reset()
            setGuardando(false)
        }} 
        ref={formRef}
        className="flex gap-2 relative"
      >
        <input type="hidden" name="prestamoId" value={prestamoId} />
        <input 
          name="texto" 
          type="text" 
          placeholder="Escribe una nota rápida aquí..." 
          required
          autoComplete="off"
          className="flex-1 p-3.5 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-white/90 backdrop-blur shadow-inner text-slate-700 font-medium transition-all"
        />
        <button type="submit" disabled={guardando} className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black uppercase tracking-widest px-6 rounded-xl text-xs flex items-center justify-center shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100">
          {guardando ? '...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}