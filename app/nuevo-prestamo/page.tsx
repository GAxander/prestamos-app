import { prisma } from '@/lib/prisma'
import FormularioPrestamo from '@/components/FormularioPrestamo'
import { verificarSesion } from '@/lib/auth' // 👇 1. Importamos la seguridad

// 👇 2. Le decimos a Next.js: "¡NO congeles esta página, es dinámica!"
export const dynamic = 'force-dynamic'

export default async function NuevoPrestamoPage() {
  // 👇 3. Descubrimos quién es el usuario actual
  const userId = await verificarSesion()

  // 4. Buscamos SOLO los clientes de este usuario en particular
  const clientes = await prisma.cliente.findMany({
    where: {
      usuarioId: userId // 👇 ESTO EVITA QUE SE MEZCLEN LAS CUENTAS
    },
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

        {/* Pasamos los clientes ya filtrados al formulario */}
        <FormularioPrestamo clientesExistentes={clientes} />

      </div>
    </div>
  )
}