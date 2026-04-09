import { prisma } from '@/lib/prisma'
import DashboardCliente, { GrupoDeuda } from '@/components/DashboardCliente'
import Header from '@/components/Header'
import { verificarSesion } from '@/lib/auth'


export const dynamic = 'force-dynamic'

async function getDatosIniciales(userId: number) {
  
  // A. Traer Clientes
  const clientesRaw = await prisma.cliente.findMany({
    where: { usuarioId: userId },
    where: { usuarioId: userId },
    include: {
      prestamos: {
        where: { estado: { in: ['ACTIVO', 'PENDIENTE'] } },
        include: { cuotas: true, categoria: true }
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
        include: { cliente: true, categoria: true }
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
    frecuencia: c.prestamo.frecuencia,
    categoria: c.prestamo.categoria || null
  }))

  const categorias = await prisma.categoria.findMany({ where: { usuarioId: userId }, orderBy: { id: 'asc' } })

  return { clientes: clientesSanitizados, agenda: agendaSanitizada, categorias }
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
        cantidadCuotas: 0,
        categoria: item.categoria || null
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
  const { clientes, agenda, categorias } = await getDatosIniciales(userId)

  // KPI Cálculos
  // Se pasó el cálculo al cliente

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      <Header username={usuario?.username || 'Usuario'} />

      <div className="relative animate-fade-in-up">
         <DashboardCliente 
            clientes={clientes} 
            agenda={agenda}
            categorias={categorias}
         />
      </div>
    </div>
  )
}