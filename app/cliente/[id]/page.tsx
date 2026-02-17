import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Función auxiliar
const formatMoney = (amount: number) => `S/ ${Number(amount).toFixed(2)}`

export default async function PerfilClientePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  // 1. Buscamos al cliente y sus préstamos
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      prestamos: {
        orderBy: { fechaInicio: 'desc' }, // Los más nuevos primero
        include: { cuotas: true }
      }
    }
  })

  if (!cliente) return notFound()

  // 2. SEPARACIÓN CORREGIDA
  // Activos: ACTIVO o PENDIENTE
  const prestamosActivos = cliente.prestamos.filter(p => 
    p.estado === 'ACTIVO' || p.estado === 'PENDIENTE'
  )
  
  // Finalizados: Ahora incluimos 'REFINANCIADO' en la lista
  const prestamosFinalizados = cliente.prestamos.filter(p => 
    ['FINALIZADO', 'CANCELADO', 'REFINANCIADO'].includes(p.estado)
  )

  // 3. Estadísticas
  const totalPrestamosHistorico = cliente.prestamos.length
  const dineroPrestadoTotal = cliente.prestamos.reduce((sum, p) => sum + Number(p.montoCapital), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* CABECERA */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-4">
                <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
                    <span>←</span> Volver al Inicio
                </Link>
                <Link 
                    href={`/cliente/${cliente.id}/editar`} 
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-bold"
                >
                    ✎ Editar Datos
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl text-white font-black shadow-lg shadow-blue-200">
                    {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">{cliente.nombre}</h1>
                    <p className="text-gray-500 font-medium">📞 {cliente.telefono || 'Sin teléfono'}</p>
                </div>
            </div>

            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Historial Créditos</p>
                    <p className="text-xl font-black text-blue-800">{totalPrestamosHistorico}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                    <p className="text-[10px] text-green-500 font-bold uppercase">Capital Total Prestado</p>
                    <p className="text-xl font-black text-green-700">{formatMoney(dineroPrestadoTotal)}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-8">
        
        {/* SECCIÓN 1: PRÉSTAMOS ACTIVOS */}
        <section>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                🟢 Préstamos Activos
                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{prestamosActivos.length}</span>
            </h2>

            {prestamosActivos.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
                    <p className="text-gray-400 text-sm mb-3">Este cliente no tiene deudas pendientes.</p>
                    <Link href={`/nuevo-prestamo?clienteId=${cliente.id}`} className="text-blue-600 text-xs font-bold hover:underline">
                        + Crear nuevo préstamo
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {prestamosActivos.map(prestamo => (
                        <Link key={prestamo.id} href={`/prestamo/${prestamo.id}`} className="block group">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 hover:border-blue-400 hover:shadow-md transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-2 -mt-2 group-hover:bg-blue-100 transition"></div>
                                
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Préstamo #{prestamo.id}</p>
                                        <p className="text-xl font-black text-gray-800">{formatMoney(Number(prestamo.montoCapital))}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            📅 Inicio: {new Date(prestamo.fechaInicio).toLocaleDateString('es-PE')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Activo</span>
                                        <p className="text-xs text-blue-600 font-bold mt-2 group-hover:underline">Ver detalles →</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>

        {/* SECCIÓN 2: HISTORIAL FINALIZADO (AHORA CON REFINANCIADOS) */}
        <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                🗂 Historial Finalizado
            </h2>

            {prestamosFinalizados.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-2">No hay préstamos anteriores.</p>
            ) : (
                <div className="space-y-2">
                    {prestamosFinalizados.map(prestamo => (
                        <Link key={prestamo.id} href={`/prestamo/${prestamo.id}`} className="block">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 transition flex justify-between items-center opacity-80 hover:opacity-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-600 text-sm">Préstamo #{prestamo.id}</span>
                                        {/* ETIQUETA DINÁMICA DE ESTADO */}
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                                            ${prestamo.estado === 'REFINANCIADO' ? 'bg-orange-100 text-orange-600' : 
                                              prestamo.estado === 'CANCELADO' ? 'bg-red-100 text-red-600' : 
                                              'bg-gray-200 text-gray-500'}`}>
                                            {prestamo.estado}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(prestamo.fechaInicio).toLocaleDateString('es-PE')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-500 line-through decoration-gray-400">
                                        {formatMoney(Number(prestamo.montoCapital))}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>

      </div>
    </div>
  )
}