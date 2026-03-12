import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import FormularioRefinanciar from '@/components/FormularioRefinanciar'

export default async function RenovarPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);

  // Traemos el préstamo real
  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: { cliente: true, cuotas: true }
  })

  if (!prestamo) return notFound()

  // Calculamos la deuda EXACTA que le falta pagar
  const deudaReal = prestamo.cuotas.reduce((sum, c) => {
    const falta = Number(c.montoEsperado) - Number(c.montoPagado)
    return sum + (falta > 0 ? falta : 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Le pasamos los datos reales al formulario */}
      <FormularioRefinanciar prestamo={prestamo} deudaReal={deudaReal} />
    </div>
  )
}