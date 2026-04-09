import { prisma } from '@/lib/prisma'
import FormularioEditarPrestamo from '@/components/FormularioEditarPrestamo' // <--- IMPORTANTE: Usamos el componente cliente
import { notFound } from 'next/navigation'

export default async function EditarPrestamoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);

  // 1. Buscamos el préstamo
  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: { cliente: true, cuotas: true }
  })

  if (!prestamo) return notFound()

  const clientes = await prisma.cliente.findMany({ 
    where: { usuarioId: prestamo.cliente.usuarioId },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' } 
  })

  // 3. Buscamos todas las categorías del usuario
  const categorias = await prisma.categoria.findMany({
    where: { usuarioId: prestamo.cliente.usuarioId },
    orderBy: { nombre: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="bg-orange-500 p-4 text-white text-center">
          <h1 className="text-lg font-bold">Gestionar Préstamo #{prestamo.id}</h1>
          <p className="text-xs opacity-90">Corregir errores o eliminar</p>
        </div>

        <FormularioEditarPrestamo prestamo={prestamo} clientes={clientes} categorias={categorias} />

      </div>
    </div>
  )
}