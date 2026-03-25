'use client'

import { useState, Suspense } from 'react'
import { login, registro } from '@/app/actions'
import { useSearchParams } from 'next/navigation'

// 1. SEPARAMOS EL FORMULARIO EN SU PROPIO COMPONENTE
function LoginForm() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const mensaje = searchParams.get('mensaje')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    try {
      if (esRegistro) {
        await registro(formData)
      } else {
        await login(formData)
      }
    } catch (e: any) {
      if (e?.message === 'NEXT_REDIRECT' || e?.digest?.startsWith('NEXT_REDIRECT')) {
        throw e;
      }
      setError('Datos incorrectos o usuario ya existe')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-sm border border-white">
      <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-600/30 transform transition-transform hover:scale-105">
              <span className="text-3xl text-white font-black leading-none">P</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">Gestión Definitiva</p>
      </div>

      {mensaje && (
        <div className="bg-indigo-50 text-indigo-600 text-sm p-3.5 rounded-xl mb-5 text-center border border-indigo-100/50 animate-pulse font-medium">
          ℹ️ {mensaje}
        </div>
      )}

      {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3.5 rounded-xl mb-5 text-center border border-red-100 font-medium animate-bounce">
              ⚠️ {error}
          </div>
      )}

      <form action={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1 tracking-wide">Usuario / Alias</label>
          <input 
              name="username" 
              type="text" 
              placeholder="Ej: johan" 
              required 
              className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 shadow-inner" 
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 ml-1 tracking-wide">Contraseña Segura</label>
          <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 shadow-inner" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm sm:text-base uppercase tracking-wide"
        >
          {loading ? 'Procesando...' : (esRegistro ? 'Registrarse Ahora' : 'Ingresar al Panel')}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-slate-100 pt-5">
        <button onClick={() => {setEsRegistro(!esRegistro); setError('')}} className="text-sm text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo aquí? Crea una cuenta'}
        </button>
      </div>
    </div>
  )
}

// 2. EXPORTAMOS LA PÁGINA PRINCIPAL ENVUELTA EN <Suspense>
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100 p-4">
      <Suspense fallback={<div className="text-indigo-500 font-bold animate-pulse text-lg tracking-widest uppercase">Cargando Plataforma...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}