'use client'

import { cerrarSesion } from '@/app/actions'
import Link from 'next/link'

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

      {/* LADO DERECHO: OPCIONES Y BOTÓN SALIR */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/configuracion" className="bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 w-10 h-10 sm:w-auto sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md" title="Configuración">
          <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="hidden sm:inline">Configuración</span>
        </Link>
        <form action={cerrarSesion}>
          <button 
            className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 group shadow-sm hover:shadow-md"
            title="Cerrar Sesión"
          >
            <span className="group-hover:-translate-x-1 transition-transform">🚪</span>
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </header>
  )
}