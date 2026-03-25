import { prisma } from '@/lib/prisma'
import { actualizarCliente } from '@/app/actions' 
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditarClientePage(props: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ error?: string, nombreIntento?: string }> 
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) return notFound()

  const hayError = searchParams.error === 'duplicado'
  const nombreAmostrar = searchParams.nombreIntento || cliente.nombre

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="glass-panel p-8 md:p-10 w-full max-w-md relative overflow-hidden bg-white/80">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center mb-8 border-b border-slate-200/60 pb-4">
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar Perfil
            </h1>
            <Link href={`/cliente/${id}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Link>
        </div>

        {hayError && (
          <div className="relative z-10 mb-8 glass-panel bg-rose-50/80 border-rose-200 p-5 flex items-start gap-4 animate-[pulse_3s_ease-in-out_infinite]">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-sm font-black text-rose-700 tracking-wide uppercase mb-1">Nombre duplicado</p>
              <p className="text-xs text-rose-600/80 font-medium leading-relaxed">
                Ya existe alguien llamado <strong>&quot;{nombreAmostrar}&quot;</strong>. 
                Añade un apellido inicial para diferenciarlo.
              </p>
            </div>
          </div>
        )}

        <form action={actualizarCliente} className="relative z-10 space-y-6">
          <input type="hidden" name="id" value={cliente.id} />
          
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">Nombre Completo</label>
            <input 
              name="nombre" 
              type="text" 
              defaultValue={nombreAmostrar} 
              required 
              className={`w-full p-4 bg-slate-50 border rounded-xl outline-none transition-all font-bold text-slate-800 shadow-sm
                ${hayError ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">Teléfono Móvil</label>
            <input 
              name="telefono" 
              type="tel" 
              defaultValue={cliente.telefono || ''} 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700 shadow-sm"
            />
          </div>

          <div className="pt-4">
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Guardar Cambios
             </button>
          </div>
        </form>

      </div>
    </div>
  )
}