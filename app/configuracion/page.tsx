import { obtenerConfiguracionRespaldo, guardarConfiguracionRespaldo } from '@/app/actions'
import Header from '@/components/Header'

export default async function ConfiguracionPage() {
  const config = await obtenerConfiguracionRespaldo()

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Ajustes del Sistema</h1>
            <p className="text-slate-500 font-medium text-sm">Configura alertas y respaldos automatizados</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-5 border-b border-indigo-100/50 flex items-center gap-3">
             <span className="text-xl">📧</span>
             <div>
               <h2 className="text-[15px] font-bold text-slate-800">Respaldo Automático de Excel</h2>
               <p className="text-xs text-slate-500 font-medium mt-0.5">Recibe una copia de toda la base de datos en tu correo.</p>
             </div>
          </div>
          
          <form action={guardarConfiguracionRespaldo} className="p-6 md:p-8 space-y-6">
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
                  defaultValue={config?.frecuenciaBackup || 'NUNCA'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none text-slate-900 font-medium transition-all shadow-sm cursor-pointer"
                >
                  <option value="NUNCA">No enviar respaldos (Desactivado)</option>
                  <option value="DIARIO">Diario (Todos los días por la tarde)</option>
                  <option value="SEMANAL">Semanal (Cada lunes)</option>
                  <option value="MENSUAL">Mensual (Cada inicio de mes)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button 
                 type="submit" 
                 className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center gap-2"
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Guardar Configuración
               </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
