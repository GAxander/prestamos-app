'use client'

import { cerrarSesion } from '@/app/actions'

type Props = {
  username: string
}

export default function Header({ username }: Props) {
  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 mb-4 sm:mb-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] flex justify-between items-center transition-all">
      
      {/* LADO IZQUIERDO: LOGO Y SALUDO */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/30">
          P
        </div>
        <div>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">Gestión de Préstamos</p>
          <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-none capitalize">
            Hola, {username} <span className="inline-block animate-bounce" style={{ animationDuration: '2s' }}>👋</span>
          </h1>
        </div>
      </div>

      {/* LADO DERECHO: BOTÓN SALIR */}
      <form action={cerrarSesion}>
        <button 
          className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 group shadow-sm hover:shadow-md"
          title="Cerrar Sesión"
        >
          <span className="group-hover:-translate-x-1 transition-transform">🚪</span>
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </form>
    </header>
  )
}