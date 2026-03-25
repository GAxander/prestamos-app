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

  // 4. Cartera Activa (Dinero en la calle) - Corrección estructural: Sumar lo que realmente falta cobrar
  const prestamosActivos = prestamos.filter(p => p.estado === 'ACTIVO' || p.estado === 'PENDIENTE')
  
  const totalPrestado = Number(resumenPrestamos._sum.montoCapital || 0)
  const totalCobrado = Number(resumenPagos._sum.monto || 0)
  const totalIngresosMes = Number(pagosEsteMes._sum.monto || 0)
  const totalSalidasMes = Number(prestamosEsteMes._sum.montoCapital || 0)
  const flujoCajaMes = totalIngresosMes - totalSalidasMes

  // CONSULTA EXACTA DE DEUDA VIVA (Para no sufrir desfases por descuentos o moras)
  const cuotasPendientes = await prisma.cuota.findMany({
    where: { 
      estado: 'PENDIENTE',
      prestamo: { estado: { in: ['ACTIVO', 'PENDIENTE'] }, cliente: { usuarioId: userId } }
    },
    include: { prestamo: true }
  })
  
  let capitalActivoPendiente = 0
  let interesActivoPendiente = 0

  cuotasPendientes.forEach(c => {
    const deudaCuota = Number(c.montoEsperado) - Number(c.montoPagado)
    const p = c.prestamo
    
    let diasPorCuota = 1
    if (p.frecuencia === 'SEMANAL') diasPorCuota = 7
    if (p.frecuencia === 'QUINCENAL') diasPorCuota = 15
    if (p.frecuencia === 'MENSUAL') diasPorCuota = 30
    
    const duracionDias = p.plazo * diasPorCuota
    const gananciaOriginal = Number(p.montoCapital) * (Number(p.interesPorcentaje) / 100) * (duracionDias / 30)
    const totalAPagarOriginal = Number(p.montoCapital) + gananciaOriginal
    
    const ratioCapital = Number(p.montoCapital) / totalAPagarOriginal
    const ratioInteres = gananciaOriginal / totalAPagarOriginal

    capitalActivoPendiente += (deudaCuota * ratioCapital)
    interesActivoPendiente += (deudaCuota * ratioInteres)
  })

  // Evitar NaN o Infinity en caso de divisiones extrañas
  const finalCapitalActivo = isNaN(capitalActivoPendiente) ? 0 : capitalActivoPendiente
  const finalInteresActivo = isNaN(interesActivoPendiente) ? 0 : interesActivoPendiente
  const totalDeudaExigible = finalCapitalActivo + finalInteresActivo

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

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* ESTADO ACTUAL (LO PRINCIPAL) */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Estado Actual (Dinero en la Calle)</h2>
          
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 mb-6">
             <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total por Cobrar</p>
                  <h2 className="text-4xl font-black text-white">{formatMoney(totalDeudaExigible)}</h2>
                  <p className="text-slate-400 text-sm mt-2">Saldo pendiente en {prestamosActivos.length} préstamos activos.</p>
                </div>
                <div className="hidden md:block text-right text-4xl">
                   📉
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-emerald-600/80 text-xs font-bold uppercase relative z-10">Capital Prestado Actualmente</p>
              <h3 className="text-3xl font-black text-emerald-900 mt-2 relative z-10">{formatMoney(finalCapitalActivo)}</h3>
              <p className="text-[10px] text-emerald-600/60 mt-1 relative z-10">Capital puro invertido en la calle</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-indigo-600/80 text-xs font-bold uppercase relative z-10">Interés por Cobrar</p>
              <h3 className="text-3xl font-black text-indigo-900 mt-2 relative z-10">{formatMoney(finalInteresActivo)}</h3>
              <p className="text-[10px] text-indigo-600/60 mt-1 relative z-10">Ganancia proyectada limpia pendiente</p>
            </div>
          </div>
        </section>

        {/* RENDIMIENTO MENSUAL */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              MES ACTUAL: {inicioMes.toLocaleDateString('es-PE', { month: 'long' })}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="pb-4 md:pb-0 md:pr-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Cobrado este mes</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{formatMoney(totalIngresosMes)}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Ingresos de caja</p>
              </div>
              <div className="py-4 md:py-0 md:px-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Prestado este mes</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{formatMoney(totalSalidasMes)}</p>
                <p className="text-xs text-rose-500 font-medium mt-1">Nuevos préstamos</p>
              </div>
              <div className="pt-4 md:pt-0 md:pl-4 text-center md:text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Flujo Neto Mensual</p>
                <p className={`text-2xl font-black mt-1 ${flujoCajaMes >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {flujoCajaMes > 0 ? '+' : ''}{formatMoney(flujoCajaMes)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {flujoCajaMes >= 0 ? 'Excedente en caja' : 'Más salidas que entradas'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MÉTRICAS GLOBALES (HISTÓRICO) */}
        <section className="opacity-75 hover:opacity-100 transition-opacity">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Histórico Global (Desde el Inicio)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase">Capital Prestado Total</p>
              <h3 className="text-xl font-black text-slate-800 mt-1">{formatMoney(totalPrestado)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Dinero que ha salido en total</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase">Interés Generado</p>
              <h3 className="text-xl font-black text-slate-800 mt-1">{formatMoney(gananciaTotalProyectada)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Ganancia teórica de todo el tiempo</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase">Total Recaudado</p>
              <h3 className="text-xl font-black text-slate-800 mt-1">{formatMoney(totalCobrado)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Dinero recuperado a caja total</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}