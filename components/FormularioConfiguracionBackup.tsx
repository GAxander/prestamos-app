'use client'

import { useState } from 'react'
import { guardarConfiguracionRespaldo } from '@/app/actions'
import BotonEnviarRespaldo from '@/components/BotonEnviarRespaldo'
import toast, { Toaster } from 'react-hot-toast'

export default function FormularioConfiguracionBackup({ config }: { config: any }) {
  const [frecuencia, setFrecuencia] = useState(config?.frecuenciaBackup || 'NUNCA')
  const [diaSemana, setDiaSemana] = useState(config?.diaSemanaBackup?.toString() || '1')
  const [diaMes, setDiaMes] = useState(config?.diaMesBackup?.toString() || '1')
  const [guardando, setGuardando] = useState(false)



  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setGuardando(true)
    const toastId = toast.loading('Guardando configuración...')
    try {
      // Forzamos la máxima prioridad de React para que lo que ves en pantalla
      // sea lo que se inserta matemáticamente en la BBDD
      formData.set('frecuenciaBackup', frecuencia)
      formData.set('diaSemanaBackup', diaSemana)
      formData.set('diaMesBackup', diaMes)
      
      await guardarConfiguracionRespaldo(formData)
      toast.success('¡Intervalos guardados correctamente!', { id: toastId })
    } catch (error) {
      toast.error('Hubo un error al guardar.', { id: toastId })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <form onSubmit={handleGuardar} className="p-6 md:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Correo Destino</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-400">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
            </span>
            <input 
              type="email" 
              name="emailDestino"
              placeholder="micorreo@gmail.com" 
              defaultValue={config?.emailDestino || ''}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Frecuencia de Envío</label>
          <select 
            name="frecuenciaBackup"
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm cursor-pointer"
          >
            <option value="NUNCA">No enviar respaldos (Desactivado)</option>
            <option value="DIARIO">Diario</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSUAL">Mensual</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-2 font-bold bg-slate-100 p-2 rounded-lg">
            ⏰ Todos los respaldos se generan exactos a Medianoche (12:00 AM)
          </p>
          <BotonEnviarRespaldo />
        </div>
      </div>

      {frecuencia === 'SEMANAL' && (
        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
           <label className="block text-xs font-black text-indigo-700 uppercase tracking-wider mb-2">¿Qué día de la semana?</label>
           <select 
              name="diaSemanaBackup"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full p-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-slate-800 font-bold transition-all shadow-sm cursor-pointer"
            >
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
              <option value="7">Domingo</option>
            </select>
        </div>
      )}

      {frecuencia === 'MENSUAL' && (
        <div className="bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
           <label className="block text-xs font-black text-violet-700 uppercase tracking-wider mb-2">¿Qué día del mes?</label>
           <select 
              name="diaMesBackup"
              value={diaMes}
              onChange={(e) => setDiaMes(e.target.value)}
              className="w-full p-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-400 outline-none text-slate-800 font-bold transition-all shadow-sm cursor-pointer"
            >
              {Array.from({length: 31}, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia.toString()}>Día {dia}</option>
              ))}
            </select>
        </div>
      )}

      <div className="pt-6 border-t border-slate-100 flex justify-end">
         <button 
           type="submit" 
           disabled={guardando}
           className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
         >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            {guardando ? 'Guardando...' : 'Guardar Configuración'}
         </button>
      </div>
    </form>
    </>
  )
}
