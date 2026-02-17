'use client'

import { useState } from 'react'
import { login, registro } from '@/app/actions' // Crearemos estas funciones en el paso 5

export default function LoginPage() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setError('')
    try {
      if (esRegistro) {
        await registro(formData)
      } else {
        await login(formData)
      }
    } catch (e) {
      setError('Datos incorrectos o usuario ya existe')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">
        <h1 className="text-2xl font-black text-center text-gray-800 mb-2">
          {esRegistro ? 'Crear Cuenta 🆕' : 'Iniciar Sesión 🔐'}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">Sistema de Préstamos</p>

        {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded mb-4 text-center font-bold">{error}</div>}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Usuario</label>
            <input name="username" type="text" placeholder="Ej: mama, johan" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
            <input name="password" type="password" placeholder="*****" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-transform active:scale-95">
            {esRegistro ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => setEsRegistro(!esRegistro)} className="text-xs text-blue-500 hover:underline">
            {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}