'use client'

import { useState } from 'react'
import { corregirPago } from '@/app/actions'

type Props = {
  cuotaId: number
  montoPagadoActual: number
}

export default function BotonCorregir({ cuotaId, montoPagadoActual }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(montoPagadoActual)

  if (editando) {
    return (
      <form 
        action={corregirPago} 
        onSubmit={() => setEditando(false)}
        className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-amber-200 rounded-lg p-1.5 shadow-lg shadow-amber-500/10 absolute right-0 top-8 z-20 animate-in fade-in zoom-in duration-200"
      >
        <input type="hidden" name="cuotaId" value={cuotaId} />
        <div className="relative">
            <span className="absolute left-1.5 top-1 text-slate-400 text-[10px] font-bold">S/</span>
            <input 
            type="number" 
            name="nuevoMonto" 
            step="0.01"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="w-20 pl-5 pr-1 py-1 text-xs border border-slate-200 rounded text-slate-800 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 bg-slate-50 shadow-inner"
            autoFocus
            />
        </div>
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors active:scale-95">
          OK
        </button>
        <button 
          type="button" 
          onClick={() => setEditando(false)}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 font-bold transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </form>
    )
  }

  return (
    <button 
      onClick={() => {
        setValor(montoPagadoActual) // Reseteamos el valor al abrir
        setEditando(true)
      }}
      className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-amber-50 border border-transparent hover:border-amber-200 text-amber-500 hover:text-amber-600 hover:bg-amber-100 transition-all active:scale-95"
      title="Corregir monto abonado"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    </button>
  )
}