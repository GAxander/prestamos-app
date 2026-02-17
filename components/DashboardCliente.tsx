'use client'

import { useState } from 'react'
import Link from 'next/link'

// NUEVO TIPO DE DATO AGRUPADO
export type GrupoDeuda = {
  prestamoId: number
  clienteNombre: string
  fechaVencimiento: Date
  totalDeuda: number
  cantidadCuotas: number
}

type Cliente = {
  id: number
  nombre: string
  telefono: string | null
  prestamos: any[]
}

type Props = {
  clientes: Cliente[]
  totalCapitalEnCalle: number
  totalClientesActivos: number
  vencidos: GrupoDeuda[]   // <--- Ahora recibimos grupos
  porVencer: GrupoDeuda[]  // <--- Ahora recibimos grupos
}

export default function DashboardCliente({ clientes, totalCapitalEnCalle, totalClientesActivos, vencidos, porVencer }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
             PRÉSTAMOS 💰
           </h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Panel de Control</p>
        </div>
        <Link href="/nuevo-prestamo" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 text-sm flex items-center gap-1">
          <span>+ Nuevo</span>
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Link href="/caja" className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg hover:bg-indigo-800 transition relative overflow-hidden group">
          <div className="relative z-10 flex justify-between items-center h-full">
            <div>
              <p className="text-[10px] font-bold opacity-70 uppercase mb-1">Caja del Día</p>
              <p className="text-lg font-bold group-hover:underline decoration-white underline-offset-4">Ver Reporte</p>
            </div>
            <span className="text-2xl">➡</span>
          </div>
          <div className="absolute -right-4 -bottom-4 text-indigo-700 opacity-20 text-6xl">📠</div>
        </Link>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Clientes Activos</p>
            <p className="text-3xl font-black text-gray-800">{totalClientesActivos}</p>
          </div>
          <div className="text-3xl opacity-20 text-gray-400">👥</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1">Capital en Calle</p>
            <p className="text-3xl font-black text-green-600">S/ {totalCapitalEnCalle.toFixed(2)}</p>
          </div>
          <div className="text-3xl opacity-20 text-green-500">💸</div>
        </div>
      </div>

      {/* --- AGENDA AGRUPADA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* VENCIDOS (ROJO) */}
        <div className="bg-red-50 rounded-xl border border-red-100 overflow-hidden flex flex-col max-h-80">
            <div className="px-4 py-3 border-b border-red-100 flex justify-between items-center bg-red-100/50">
                <h3 className="text-xs font-bold text-red-700 uppercase flex items-center gap-2">
                   🚨 Vencidos ({vencidos.length} casos)
                </h3>
            </div>
            <div className="divide-y divide-red-100 overflow-y-auto">
                {vencidos.length === 0 ? (
                    <p className="text-xs text-red-300 p-4 text-center italic">¡Genial! No hay morosos hoy.</p>
                ) : (
                    vencidos.map((item) => (
                        <div key={item.prestamoId} className="p-3 hover:bg-red-100 transition flex justify-between items-center group">
                            <div>
                                <p className="text-sm font-bold text-gray-800">{item.clienteNombre}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] bg-red-200 text-red-800 px-1.5 rounded-full font-bold">
                                        {item.cantidadCuotas} cuotas
                                    </span>
                                    <span className="text-[10px] text-red-400">
                                        Desde: {new Date(item.fechaVencimiento).toLocaleDateString('es-PE', {day:'2-digit', month:'short'})}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-red-700">S/ {item.totalDeuda.toFixed(2)}</p>
                                <Link href={`/prestamo/${item.prestamoId}`} className="text-[10px] bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition shadow-sm">
                                    Cobrar Todo
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* PRÓXIMOS (AMARILLO) */}
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 overflow-hidden flex flex-col max-h-80">
            <div className="px-4 py-3 border-b border-yellow-100 flex justify-between items-center bg-yellow-100/50">
                <h3 className="text-xs font-bold text-yellow-700 uppercase flex items-center gap-2">
                   📅 Próximos Vencimientos
                </h3>
            </div>
            <div className="divide-y divide-yellow-100 overflow-y-auto">
                {porVencer.length === 0 ? (
                    <p className="text-xs text-yellow-600 p-4 text-center italic">No hay cobros próximos.</p>
                ) : (
                    porVencer.map((item) => {
                        const esHoy = new Date(item.fechaVencimiento).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
                        return (
                            <div key={item.prestamoId} className="p-3 hover:bg-yellow-100 transition flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{item.clienteNombre}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] font-bold ${esHoy ? 'text-green-600 bg-green-100 px-1.5 rounded-full' : 'text-gray-400'}`}>
                                            {esHoy ? 'HOY' : new Date(item.fechaVencimiento).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })}
                                        </span>
                                        {item.cantidadCuotas > 1 && (
                                           <span className="text-[9px] text-yellow-600 font-bold">({item.cantidadCuotas} pagos)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-700">S/ {item.totalDeuda.toFixed(2)}</p>
                                    <Link href={`/prestamo/${item.prestamoId}`} className="text-[10px] bg-white border border-yellow-300 text-yellow-700 px-2 py-0.5 rounded hover:bg-yellow-400 hover:text-white transition">
                                        Ver
                                    </Link>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

      </div>

      {/* LISTA CLIENTES (Sin cambios) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Cartera de Clientes ({clientesFiltrados.length})</h2>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Buscar cliente por nombre..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {clientesFiltrados.length === 0 ? (
             <div className="p-10 text-center text-gray-400"><p>No se encontraron clientes.</p></div>
          ) : (
            clientesFiltrados.map((cliente) => {
              const tieneDeuda = cliente.prestamos.length > 0
              return (
                <div key={cliente.id} className="p-4 hover:bg-blue-50 transition group">
                  <div className="flex justify-between items-start">
                    <Link href={`/cliente/${cliente.id}`} className="block w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${tieneDeuda ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 group-hover:text-blue-700">{cliente.nombre}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">📞 {cliente.telefono || 'Sin teléfono'}</p>
                        </div>
                      </div>
                    </Link>
                    <div className="text-right">
                       {tieneDeuda ? (
                         <div className="flex flex-col gap-1 items-end">
                            {cliente.prestamos.map((p: any) => (
                              <Link key={p.id} href={`/prestamo/${p.id}`} className="block">
                                <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200 hover:bg-green-100 cursor-pointer">
                                  Préstamo #{p.id} (Activo)
                                </span>
                              </Link>
                            ))}
                         </div>
                       ) : (
                         <span className="text-[10px] text-gray-300 italic">Sin deuda activa</span>
                       )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}