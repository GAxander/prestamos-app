const fs = require('fs')

let dc = fs.readFileSync('components/DashboardCliente.tsx', 'utf-8')

dc = dc.replace(
  /type Props = \{[\s\S]*?export default function DashboardCliente/m,
  `type Props = {
  clientes: Cliente[]
  agenda: any[]
  categorias: any[]
}

export default function DashboardCliente`
)

dc = dc.replace(
  /const clientesFiltrados = clientes\.filter\([\s\S]*?new Date\(b\.fechaVencimiento\)\.getTime\(\)\n  \)/m,
  `// 1. Filtrar Clientes (Por texto o por tener prestamos en esa categoria)
  const clientesFiltrados = clientes.map(c => {
    if (categoriaSeleccionada === 'TODOS') return c
    return {
      ...c,
      prestamos: c.prestamos.filter((p: any) => p.categoriaId === categoriaSeleccionada)
    }
  }).filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (categoriaSeleccionada === 'TODOS' || c.prestamos.length > 0)
  )

  // 2. Recalcular KPIs
  const totalClientesActivos = clientesFiltrados.filter(c => c.prestamos.length > 0).length
  const totalCapitalEnCalle = clientesFiltrados.reduce((totalGlobal, cliente) => {
    return totalGlobal + cliente.prestamos.reduce((totalPrestamo: number, p: any) => {
      const esperado = p.cuotas.reduce((sum: number, c: any) => sum + Number(c.montoEsperado), 0)
      const pagado = p.cuotas.reduce((sum: number, c: any) => sum + Number(c.montoPagado), 0)
      return totalPrestamo + (esperado - pagado)
    }, 0)
  }, 0)

  // 3. Filtrar Agenda y Agrupar
  const agendaFiltrada = categoriaSeleccionada === 'TODOS' 
    ? agenda 
    : agenda.filter((item: any) => item.categoria?.id === categoriaSeleccionada)

  const agruparDeudas = (lista: any[]) => {
    const grupos: any = {}
    lista.forEach(item => {
      const key = item.prestamoId 
      const deuda = item.montoEsperado - item.montoPagado
      if (!grupos[key]) {
         grupos[key] = { prestamoId: item.prestamoId, clienteNombre: item.clienteNombre, fechaVencimiento: item.fechaVencimiento, totalDeuda: 0, cantidadCuotas: 0 }
      }
      grupos[key].totalDeuda += deuda
      grupos[key].cantidadCuotas += 1
    })
    return Object.values(grupos) as GrupoDeuda[]
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const listaVencidos = agendaFiltrada.filter((item: any) => {
    const f = new Date(item.fechaVencimiento); f.setHours(0,0,0,0);
    return f < hoy
  })
  const listaPorVencer = agendaFiltrada.filter((item: any) => {
    const f = new Date(item.fechaVencimiento); f.setHours(0,0,0,0);
    return f >= hoy
  })

  const vencidos = agruparDeudas(listaVencidos)
  const porVencer = agruparDeudas(listaPorVencer).slice(0, 5)

  const vencidosOrdenados = [...vencidos].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )

  const porVencerOrdenados = [...porVencer].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )`
)

// Remove the appended logic at the bottom if it says `const hoy = new Date()`
const removeIndex = dc.lastIndexOf('const agruparDeudas = (lista: any[]) =>')
if (removeIndex > dc.indexOf('const vencidosOrdenados =')) {
  // It means we have duplicate block at the end (from previous bad script).
  // I need to carefully remove it if it's there. Actually, where did my previous script inject it?
  // I replaced `const [busqueda, setBusqueda] = useState('')` earlier. Wait, let me just check how many times `const hoy = new Date()` exists.
  
  const parts = dc.split('const agruparDeudas = (lista: any[]) =>')
  if(parts.length > 2) {
    // There are 2 instances! We must keep the first one and delete everything between the second one and its end.
    // Let's just find `// Re-asignamos las variables viejas` and delete it and surrounding lines.
    dc = dc.replace(/const agruparDeudas = \(lista: any\[\]\) => \{[\s\S]*?const porVencer = agruparDeudas\(listaPorVencer\)\.slice\(0, 5\)/, '')
  }
}

fs.writeFileSync('components/DashboardCliente.tsx', dc)
console.log('Fixed Dashboard')
