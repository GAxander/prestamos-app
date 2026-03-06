import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { verificarSesion } from '@/lib/auth' // 👈 1. Importamos la llave de seguridad

export const dynamic = 'force-dynamic'

const formatMoney = (amount: number) => `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function DashboardFinancieroPage() {
  // 👈 2. Obtenemos el ID de tu cuenta para filtrar TODO
  const userId = await verificarSesion()

  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)

  // 1. CONSULTAS (Histórico Global filtrado por TU usuario)
  const resumenPrestamos = await prisma.prestamo.aggregate({
    _sum: { montoCapital: true },
    where: { cliente: { usuarioId: userId } } // 👈 Candado
  })
  
  const resumenPagos = await prisma.pago.aggregate({
    _sum: { monto: true },
    where: { 
      tipo: { not: 'ANULACION' },
      prestamo: { cliente: { usuarioId: userId } } // 👈 Candado
    }
  })

  // 2. Intereses (Cálculo exacto con la nueva fórmula de tiempo)
  const prestamos = await prisma.prestamo.findMany({
    where: { cliente: { usuarioId: userId } }, // 👈 Candado
    select: { montoCapital: true, interesPorcentaje: true, estado: true, frecuencia: true, plazo: true }
  })

  const gananciaTotalProyectada = prestamos.reduce((sum, p) => {
    // Aplicamos la misma matemática exacta que usamos al crear el préstamo
    let diasPorCuota = 1
    if (p.frecuencia === 'SEMANAL') diasPorCuota = 7
    if (p.frecuencia === 'QUINCENAL') diasPorCuota = 15
    if (p.frecuencia === 'MENSUAL') diasPorCuota = 30
    
    const duracionDias = p.plazo * diasPorCuota
    const ganancia = Number(p.montoCapital) * (Number(p.interesPorcentaje) / 100) * (duracionDias / 30)
    
    return sum + ganancia
  }, 0)

  // 3. Datos del MES ACTUAL
  const pagosEsteMes = await prisma.pago.aggregate({
    _sum: { monto: true },
    where: { 
      fecha: { gte: inicioMes, lte: finMes },
      tipo: { not: 'ANULACION' },
      prestamo: { cliente: { usuarioId: userId } } // 👈 Candado
    }
  })

  const prestamosEsteMes = await prisma.prestamo.aggregate({
    _sum: { montoCapital: true },
    where: { 
      fechaInicio: { gte: inicioMes, lte: finMes },
      cliente: { usuarioId: userId } // 👈 Candado
    }
  })

  // 4. Cartera Activa (Dinero en la calle)
  const prestamosActivos = prestamos.filter(p => p.estado === 'ACTIVO' || p.estado === 'PENDIENTE')
  
  const totalPrestado = Number(resumenPrestamos._sum.montoCapital || 0)
  const totalCobrado = Number(resumenPagos._sum.monto || 0)
  const totalIngresosMes = Number(pagosEsteMes._sum.monto || 0)
  const totalSalidasMes = Number(prestamosEsteMes._sum.montoCapital || 0)
  const flujoCajaMes = totalIngresosMes - totalSalidasMes

  let totalDeudaExigible = (totalPrestado + gananciaTotalProyectada) - totalCobrado
  if (totalDeudaExigible < 0) totalDeudaExigible = 0

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      
      {/* CABECERA */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reporte General 📊</h1>
           <p className="text-sm text-gray-500 font-medium">Estado financiero del negocio</p>
        </div>
        <Link href="/" className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-sm">
            ← Volver al Inicio
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* MÉTRICAS GLOBALES */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Métricas Globales (Histórico)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-gray-500 text-xs font-bold uppercase relative z-10">Capital Prestado Total</p>
              <h3 className="text-3xl font-black text-blue-900 mt-2 relative z-10">{formatMoney(totalPrestado)}</h3>
              <p className="text-[10px] text-gray-400 mt-1 relative z-10">Dinero que salió de caja</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-gray-500 text-xs font-bold uppercase relative z-10">Interés Generado</p>
              <h3 className="text-3xl font-black text-green-600 mt-2 relative z-10">{formatMoney(gananciaTotalProyectada)}</h3>
              <p className="text-[10px] text-gray-400 mt-1 relative z-10">Ganancia bruta total</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-gray-500 text-xs font-bold uppercase relative z-10">Total Recaudado</p>
              <h3 className="text-3xl font-black text-purple-900 mt-2 relative z-10">{formatMoney(totalCobrado)}</h3>
              <p className="text-[10px] text-gray-400 mt-1 relative z-10">Capital + Interés recuperado</p>
            </div>
          </div>
        </section>

        {/* DINERO EN LA CALLE */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
           <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Dinero en la Calle</p>
                <h2 className="text-4xl font-black text-white">{formatMoney(totalDeudaExigible)}</h2>
                <p className="text-slate-400 text-sm mt-2">Saldo pendiente por cobrar a {prestamosActivos.length} clientes activos.</p>
              </div>
              <div className="hidden md:block text-right">
                 <div className="text-4xl">📉</div>
              </div>
           </div>
        </div>

        {/* RENDIMIENTO MENSUAL */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Rendimiento de {inicioMes.toLocaleDateString('es-PE', { month: 'long' })}
            </h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">En curso</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              
              <div className="pb-4 md:pb-0 md:pr-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Cobrado este mes</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{formatMoney(totalIngresosMes)}</p>
                <p className="text-xs text-green-600 font-medium mt-1">Ingresos de caja</p>
              </div>

              <div className="py-4 md:py-0 md:px-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Prestado este mes</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{formatMoney(totalSalidasMes)}</p>
                <p className="text-xs text-red-500 font-medium mt-1">Nuevos préstamos</p>
              </div>

              <div className="pt-4 md:pt-0 md:pl-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Flujo Neto Mensual</p>
                <p className={`text-2xl font-black mt-1 ${flujoCajaMes >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                  {flujoCajaMes > 0 ? '+' : ''}{formatMoney(flujoCajaMes)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {flujoCajaMes >= 0 ? 'Excedente en caja' : 'Más salidas que entradas'}
                </p>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  )
}