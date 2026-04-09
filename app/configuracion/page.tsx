import { obtenerConfiguracionRespaldo } from '@/app/actions'
import Header from '@/components/Header'
import FormularioConfiguracionBackup from '@/components/FormularioConfiguracionBackup'
import CrudCategorias from '@/components/CrudCategorias'
import { prisma } from '@/lib/prisma'
import { verificarSesion } from '@/lib/auth'
export default async function ConfiguracionPage() {
  const userId = await verificarSesion()
  const config = await obtenerConfiguracionRespaldo()
  const categorias = await prisma.categoria.findMany({ where: { usuarioId: userId }, orderBy: { id: 'asc' } })

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
          
          <FormularioConfiguracionBackup config={config} />
        </div>

        {/* 2. CATEGORÍAS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-violet-50 to-white px-6 py-5 border-b border-violet-100/50 flex items-center gap-3">
             <span className="text-xl">🏷️</span>
             <div>
               <h2 className="text-[15px] font-bold text-slate-800">Categorías de Préstamos</h2>
               <p className="text-xs text-slate-500 font-medium mt-0.5">Agrupa tus préstamos para filtrar los totales en el panel principal.</p>
             </div>
          </div>
          
          <CrudCategorias categoriasIniciales={categorias} />
        </div>
      </main>
    </div>
  )
}
