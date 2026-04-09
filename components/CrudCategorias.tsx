'use client'

import { useState } from 'react'
import { crearCategoria, editarCategoria, eliminarCategoria } from '@/app/actions'
import toast, { Toaster } from 'react-hot-toast'

type Categoria = {
  id: number
  nombre: string
  color: string | null
}

type Props = {
  categoriasIniciales: Categoria[]
}

export default function CrudCategorias({ categoriasIniciales }: Props) {
  const [nuevaCat, setNuevaCat] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCat.trim()) return
    setGuardando(true)
    try {
      await crearCategoria(nuevaCat.trim(), '#6366f1')
      setNuevaCat('')
      toast.success('Categoría creada')
    } catch (error) {
      toast.error('Error al crear categoría')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar categoría "${nombre}"? Los préstamos pasarán a la categoría "Mío".`)) {
      try {
        const tid = toast.loading('Eliminando...')
        await eliminarCategoria(id)
        toast.success('Categoría eliminada', { id: tid })
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  const iniciarEdicion = (cat: Categoria) => {
    setEditandoId(cat.id)
    setNombreEdit(cat.nombre)
  }

  const guardarEdicion = async (id: number) => {
    if (!nombreEdit.trim()) return
    try {
      await editarCategoria(id, nombreEdit.trim(), '#6366f1')
      setEditandoId(null)
      toast.success('Editado correctamente')
    } catch (e) {
      toast.error('Error al editar')
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Toaster position="top-center" />
      
      <form onSubmit={handleCrear} className="flex gap-3 items-end">
         <div className="flex-1 relative">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Nueva Categoría</label>
            <input 
              type="text" 
              placeholder="Ej: Solo mío, Mamá, Socio..." 
              value={nuevaCat}
              onChange={e => setNuevaCat(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm"
            />
         </div>
         <button 
           type="submit" 
           disabled={guardando || !nuevaCat.trim()}
           className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
         >
            {guardando ? 'Agregando...' : '+ Agregar'}
         </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Tus Categorías</h3>
        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
           {categoriasIniciales.map(cat => (
             <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-100/50 transition">
                {editandoId === cat.id ? (
                  <div className="flex flex-1 gap-2 mr-4">
                     <input 
                       autoFocus
                       className="flex-1 p-2 border border-indigo-300 rounded-lg outline-none font-bold text-slate-800"
                       value={nombreEdit}
                       onChange={e => setNombreEdit(e.target.value)}
                       onKeyDown={e => {
                         if (e.key === 'Enter') guardarEdicion(cat.id)
                         if (e.key === 'Escape') setEditandoId(null)
                       }}
                     />
                     <button onClick={() => guardarEdicion(cat.id)} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-lg">Guardar</button>
                     <button onClick={() => setEditandoId(null)} className="text-xs bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-lg">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold shadow-inner">
                          {cat.nombre.charAt(0).toUpperCase()}
                       </div>
                       <span className="font-bold text-slate-700">{cat.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => iniciarEdicion(cat)} className="text-sm bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95">Editar</button>
                       <button onClick={() => handleEliminar(cat.id, cat.nombre)} className="text-sm bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95">Eliminar</button>
                    </div>
                  </>
                )}
             </div>
           ))}
           {categoriasIniciales.length === 0 && (
             <div className="p-6 text-center text-slate-400 font-medium text-sm">
               No has creado ninguna categoría aún.
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
