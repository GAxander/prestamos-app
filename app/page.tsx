import { prisma } from '@/lib/prisma'
import DashboardCliente, { GrupoDeuda } from '@/components/DashboardCliente'
import Header from '@/components/Header'
import { verificarSesion } from '@/lib/auth'


export const dynamic = 'force-dynamic'

async function getDatosIniciales(userId: number) {
  
  // A. Traer Clientes
  const clientesRaw = await prisma.cliente.findMany({
    where: { usuarioId: userId },
    include: {
      prestamos: {
        where: { estado: { in: ['ACTIVO', 'PENDIENTE'] } },
        include: { cuotas: true }
      }
    },
    orderBy: { nombre: 'asc' }
  })

  // B. Traer Cuotas Pendientes (Agenda)
  const cuotasPendientesRaw = await prisma.cuota.findMany({
    where: { 
      estado: 'PENDIENTE',
      prestamo: { 
        estado: { in: ['ACTIVO', 'PENDIENTE'] },
        cliente: { usuarioId: userId }
      }
    },
    include: {
      prestamo: {
        include: { cliente: true }
      }
    },
    orderBy: { fechaVencimiento: 'asc' }
  })

  // --- SANITIZACIÓN (AQUÍ ESTABA EL ERROR) ---
  const clientesSanitizados = clientesRaw.map(cliente => ({
    ...cliente,
    prestamos: cliente.prestamos.map(prestamo => ({
      ...prestamo,
      // CONVERTIMOS TODOS LOS DECIMALES A NÚMEROS NORMALES
      montoCapital: Number(prestamo.montoCapital),
      interesPorcentaje: Number(prestamo.interesPorcentaje),
      moraDiaria: Number(prestamo.moraDiaria), // <--- ¡ESTO FALTABA! 🚨
      cuotas: prestamo.cuotas.map(cuota => ({
        ...cuota,
        montoEsperado: Number(cuota.montoEsperado),
        montoPagado: Number(cuota.montoPagado)
      }))
    }))
  }))

  const agendaSanitizada = cuotasPendientesRaw.map(c => ({
    id: c.id,
    numero: c.numero,
    fechaVencimiento: c.fechaVencimiento, 
    montoEsperado: Number(c.montoEsperado),
    montoPagado: Number(c.montoPagado),
    clienteNombre: c.prestamo.cliente.nombre,
    prestamoId: c.prestamo.id,
    frecuencia: c.prestamo.frecuencia
  }))

  return { clientes: clientesSanitizados, agenda: agendaSanitizada }
}

// --- FUNCIÓN DE AGRUPAMIENTO ---
function agruparDeudas(lista: any[]): GrupoDeuda[] {
  const grupos: any = {}

  lista.forEach(item => {
    const key = item.prestamoId 
    const deuda = item.montoEsperado - item.montoPagado

    if (!grupos[key]) {
      grupos[key] = {
        prestamoId: item.prestamoId,
        clienteNombre: item.clienteNombre,
        fechaVencimiento: item.fechaVencimiento, 
        totalDeuda: 0,
        cantidadCuotas: 0
      }
    }

    grupos[key].totalDeuda += deuda
    grupos[key].cantidadCuotas += 1
  })

  return Object.values(grupos)
}

export default async function Home() {
  const userId = await verificarSesion()
  
  // 1. Buscamos el nombre para el saludo
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
  
  // 2. Pedimos los datos sanitizados
  const { clientes, agenda } = await getDatosIniciales(userId)

  // KPI Cálculos
  const clientesConDeuda = clientes.filter(c => c.prestamos.length > 0).length
  const capitalEnCalle = clientes.reduce((totalGlobal, cliente) => {
    return totalGlobal + cliente.prestamos.reduce((totalPrestamo, p) => {
      const esperado = p.cuotas.reduce((sum, c) => sum + c.montoEsperado, 0)
      const pagado = p.cuotas.reduce((sum, c) => sum + c.montoPagado, 0)
      return totalPrestamo + (esperado - pagado)
    }, 0)
  }, 0)

  // Clasificación
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const listaVencidos = agenda.filter(item => {
    const f = new Date(item.fechaVencimiento); f.setHours(0,0,0,0);
    return f < hoy
  })
  const listaPorVencer = agenda.filter(item => {
    const f = new Date(item.fechaVencimiento); f.setHours(0,0,0,0);
    return f >= hoy
  })

  const vencidosAgrupados = agruparDeudas(listaVencidos)
  const porVencerAgrupados = agruparDeudas(listaPorVencer).slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={usuario?.username || 'Usuario'} />

      <div className="relative">
         <DashboardCliente 
            clientes={clientes} 
            totalCapitalEnCalle={capitalEnCalle} 
            totalClientesActivos={clientesConDeuda}
            vencidos={vencidosAgrupados}      
            porVencer={porVencerAgrupados}    
         />
      </div>
    </div>
  )
}