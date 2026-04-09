const fs = require('fs')

let dc = fs.readFileSync('components/DashboardCliente.tsx', 'utf-8')

const targetString = `  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const vencidosOrdenados = [...vencidos].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )

  const porVencerOrdenados = [...porVencer].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )`

const targetCRLF = targetString.replace(/\\n/g, '\\r\\n')

const replacement = `  // 1. Filtrar Clientes (Por texto o por tener prestamos en esa categoria)
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

if (dc.includes(targetString)) {
  dc = dc.replace(targetString, replacement)
} else if (dc.includes(targetCRLF)) {
  dc = dc.replace(targetCRLF, replacement)
} else {
  // Ultra fallback
  const p1 = dc.indexOf("const clientesFiltrados = clientes.filter(c =>")
  const p2 = dc.indexOf("new Date(b.fechaVencimiento).getTime()\r\n  )") + 43
  const p3 = dc.indexOf("new Date(b.fechaVencimiento).getTime()\n  )") + 42

  if (p1 !== -1) {
    if (dc.includes("\\r\\n")) {
      dc = dc.slice(0, p1) + replacement + dc.slice(p2)
    } else {
      dc = dc.slice(0, p1) + replacement + dc.slice(p3)
    }
  }
}

fs.writeFileSync('components/DashboardCliente.tsx', dc)
console.log('Fixed using index splicing')
