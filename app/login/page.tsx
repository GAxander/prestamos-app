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
      // 1. Verificamos si es el error "fantasma" de redirección de Next.js
      if (e?.message === 'NEXT_REDIRECT' || e?.digest?.startsWith('NEXT_REDIRECT')) {
        throw e; // Lo volvemos a lanzar para que Next.js cambie de página tranquilo
      }
      
      // 2. Si llega hasta aquí, SÍ es un error real de contraseña o usuario
      setError('Datos incorrectos o usuario ya existe')
      setLoading(false) // Solo quitamos el "Cargando..." si hubo un error de verdad
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">
      <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">
          {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
          </h1>
          <p className="text-gray-400 text-sm">Sistema de Préstamos</p>
      </div>

      {mensaje && (
        <div className="bg-blue-50 text-blue-600 text-sm p-3 rounded-lg mb-4 text-center border border-blue-100 animate-pulse">
          ℹ️ {mensaje}
        </div>
      )}

      {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center border border-red-100 font-medium">
              ⚠️ {error}
          </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1 ml-1">Usuario</label>
          <input 
              name="username" 
              type="text" 
              placeholder="Ej: johan" 
              required 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 font-medium placeholder:text-gray-400" 
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1 ml-1">Contraseña</label>
          <input 
              name="password" 
              type="password" 
              placeholder="••••••" 
              required 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 font-medium placeholder:text-gray-400" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Cargando...' : (esRegistro ? 'Registrarse Ahora' : 'Iniciar Sesión')}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        <button onClick={() => {setEsRegistro(!esRegistro); setError('')}} className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
          {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate gratis'}
        </button>
      </div>
    </div>
  )
}

// 2. EXPORTAMOS LA PÁGINA PRINCIPAL ENVUELTA EN <Suspense>
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Suspense es el envoltorio que Vercel exigía */}
      <Suspense fallback={<div className="text-gray-500 font-bold animate-pulse">Cargando sistema...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}