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
        className="flex items-center gap-1 bg-white border border-yellow-300 rounded p-1 shadow-sm absolute right-0 top-6 z-10"
      >
        <input type="hidden" name="cuotaId" value={cuotaId} />
        <input 
          type="number" 
          name="nuevoMonto" 
          step="0.01"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="w-20 p-1 text-xs border border-gray-300 rounded font-bold"
          autoFocus
        />
        <button type="submit" className="bg-yellow-500 text-white px-2 py-1 rounded text-[10px] font-bold">
          OK
        </button>
        <button 
          type="button" 
          onClick={() => setEditando(false)}
          className="text-gray-400 hover:text-gray-600 px-1 font-bold text-xs"
        >
          ✕
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
      className="ml-2 text-gray-300 hover:text-blue-500 transition-colors"
      title="Corregir monto pagado"
    >
      ✏️
    </button>
  )
}