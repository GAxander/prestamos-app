'use client'

import { cerrarSesion } from '@/app/actions'

type Props = {
  username: string
}

export default function Header({ username }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm mb-6">
      
      {/* LADO IZQUIERDO: LOGO Y SALUDO */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-blue-200 shadow-lg">
          P
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sistema</p>
          <h1 className="text-lg font-black text-gray-800 leading-none capitalize">
            Hola, {username} 👋
          </h1>
        </div>
      </div>

      {/* LADO DERECHO: BOTÓN SALIR */}
      <form action={cerrarSesion}>
        <button 
          className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 group"
          title="Cerrar Sesión"
        >
          <span className="group-hover:-translate-x-1 transition-transform">🚪</span>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </form>
    </div>
  )
}