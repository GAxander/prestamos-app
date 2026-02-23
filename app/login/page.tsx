'use client'

import { useState } from 'react'
import { login, registro } from '@/app/actions'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
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
    } catch (e) {
      setError('Datos incorrectos o usuario ya existe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
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
            {/* 👇 AQUÍ AGREGUÉ text-gray-900 */}
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
            {/* 👇 AQUÍ TAMBIÉN AGREGUÉ text-gray-900 */}
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
    </div>
  )
}