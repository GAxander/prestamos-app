const fs = require('fs')

let page = fs.readFileSync('app/page.tsx', 'utf-8')
// remove server-side KPI calculations
page = page.replace(
  /const clientesConDeuda[\s\S]*?const vencidosAgrupados = agruparDeudas\(listaVencidos\)\s*const porVencerAgrupados = agruparDeudas\(listaPorVencer\)\.slice\(0, 5\)/m,
  "// Se pasó el cálculo al cliente"
)

// update DashboardCliente props passing
page = page.replace(
  /<DashboardCliente[\s\S]*?\/>/m,
  `<DashboardCliente 
            clientes={clientes} 
            agenda={agenda}
            categorias={categorias}
         />`
)
fs.writeFileSync('app/page.tsx', page)


let dc = fs.readFileSync('components/DashboardCliente.tsx', 'utf-8')

dc = dc.replace(
  /export type GrupoDeuda = \{[\s\S]*?categorias\?: any\[\]\n\}/m,
  `export type GrupoDeuda = {
  prestamoId: number
  clienteNombre: string
  fechaVencimiento: Date
  totalDeuda: number
  cantidadCuotas: number
  categoria?: any
}

type Cliente = {
  id: number
  nombre: string
  telefono: string | null
  createdAt: Date
  prestamos: any[]
}

type Props = {
  clientes: Cliente[]
  agenda: any[]
  categorias: any[]
}`
)

dc = dc.replace(
  /export default function DashboardCliente\(\{.*?\}\: Props\) \{/,
  `export default function DashboardCliente({ clientes, agenda, categorias }: Props) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | 'TODOS'>('TODOS')`
)

dc = dc.replace(
  "const [busqueda, setBusqueda] = useState('')",
  "const [busqueda, setBusqueda] = useState('')"
)

dc = dc.replace(
  `  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )`,
  `  // 1. Filtrar Clientes (Por texto o por tener prestamos en esa categoria)
  const clientesFiltrados = clientes.map(c => {
    if (categoriaSeleccionada === 'TODOS') return c
    // Filtramos los prestamos de este cliente para que se vean solo los de la categoria
    return {
      ...c,
      prestamos: c.prestamos.filter(p => p.categoriaId === categoriaSeleccionada)
    }
  }).filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (categoriaSeleccionada === 'TODOS' || c.prestamos.length > 0)
  )

  // 2. Recalcular KPIs basados en clientesFiltrados
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

  // Re-asignamos las variables viejas a nuestras nuevas computadas
  const vencidos = agruparDeudas(listaVencidos)
  const porVencer = agruparDeudas(listaPorVencer).slice(0, 5)`
)

// Añadir el <select> en el HTML del DOM encima del buscador (o en el header al lado de Descargar)
dc = dc.replace(
  /<div>\s*<h2 className="text-xl font-black text-slate-800 tracking-tight">Directorio de Clientes<\/h2>/,
  `<div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h2>`
)

dc = dc.replace(
  /<div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">/,
  `<div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">`
)

dc = dc.replace(
  /<p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">\{clientesFiltrados.length\} Registros Totales<\/p>\s*<\/div>/,
  `<p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{clientesFiltrados.length} Registros Totales</p>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2">
             <span className="text-sm font-bold text-slate-500">Categoría:</span>
             <select 
               className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
               value={categoriaSeleccionada}
               onChange={(e) => setCategoriaSeleccionada(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
             >
                <option value="TODOS">Todas</option>
                {categorias.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
             </select>
          </div>`
)

fs.writeFileSync('components/DashboardCliente.tsx', dc)
console.log("Modificado dashboard exitosamente")
