import { prisma } from '@/lib/prisma'
import FormularioPrestamo from '@/components/FormularioPrestamo'

export default async function NuevoPrestamoPage() {
  // 1. Buscamos TODOS los clientes (Solo ID, Nombre y Teléfono para que sea rápido)
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nombre: true,
      telefono: true
    },
    orderBy: { nombre: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        
        <div className="bg-blue-600 p-4">
          <h1 className="text-white text-xl font-bold text-center">Nuevo Préstamo ✍️</h1>
        </div>

        {/* 2. Renderizamos el formulario inteligente pasándole los clientes */}
        <FormularioPrestamo clientesExistentes={clientes} />

      </div>
    </div>
  )
}