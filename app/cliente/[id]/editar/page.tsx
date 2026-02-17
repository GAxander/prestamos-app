import { prisma } from '@/lib/prisma'
import { actualizarCliente } from '@/app/actions' 
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Agregamos 'nombreIntento' a los tipos de searchParams
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
  
  // Si hubo error, usamos el nombre que intentaste poner. Si no, el original.
  const nombreAmostrar = searchParams.nombreIntento || cliente.nombre

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-black text-gray-800">Editar Cliente ✏️</h1>
            <Link href={`/cliente/${id}`} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕ Cancelar</Link>
        </div>

        {/* ALERTA MÁS INTELIGENTE 🧠 */}
        {hayError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="text-sm font-bold text-red-700">¡Nombre ocupado!</p>
              <p className="text-xs text-red-500 mt-1">
                Ya existe otro cliente registrado como <strong>&quot;{nombreAmostrar}&quot;</strong>. 
                <br/>Por favor agrega un apellido o distintivo.
              </p>
            </div>
          </div>
        )}

        <form action={actualizarCliente} className="space-y-4">
          <input type="hidden" name="id" value={cliente.id} />
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Nombre Completo</label>
            <input 
              name="nombre" 
              type="text" 
              // AQUÍ LA MAGIA: El input recordará "Xander" para que no lo escribas de nuevo
              defaultValue={nombreAmostrar} 
              required 
              className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition font-bold text-gray-800
                ${hayError ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-100'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Teléfono</label>
            <input 
              name="telefono" 
              type="tel" 
              defaultValue={cliente.telefono || ''} 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition font-medium text-gray-700"
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-transform active:scale-95">
                Guardar Cambios
             </button>
          </div>
        </form>

      </div>
    </div>
  )
}