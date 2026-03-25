'use client'

import { useState } from 'react'
import Link from 'next/link'
import { eliminarCliente, obtenerDatosParaBackup } from '@/app/actions' 

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
  createdAt: Date
  prestamos: any[]
}

type Props = {
  clientes: Cliente[]
  totalCapitalEnCalle: number
  totalClientesActivos: number
  vencidos: GrupoDeuda[]
  porVencer: GrupoDeuda[]
}

export default function DashboardCliente({ clientes, totalCapitalEnCalle, totalClientesActivos, vencidos, porVencer }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [descargando, setDescargando] = useState(false)

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const vencidosOrdenados = [...vencidos].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )

  const porVencerOrdenados = [...porVencer].sort((a, b) => 
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  )

  const handleBorrarCliente = async (id: number, nombre: string) => {
    const confirmado = window.confirm(
      `¿Estás seguro de eliminar a ${nombre}?\n\n⚠️ SE BORRARÁN TODOS SUS PRÉSTAMOS, PAGOS Y DEUDAS.\n\nEsta acción no se puede deshacer.`
    )

    if (confirmado) {
      await eliminarCliente(id)
    }
  }

  const handleDescargarBackup = async () => {
    try {
      setDescargando(true)
      const datos = await obtenerDatosParaBackup()
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      
      const wsClientes = XLSX.utils.json_to_sheet(datos.clientes)
      const wsPrestamos = XLSX.utils.json_to_sheet(datos.prestamos)
      const wsPagos = XLSX.utils.json_to_sheet(datos.pagos)
      
      XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes")
      XLSX.utils.book_append_sheet(wb, wsPrestamos, "Préstamos")
      XLSX.utils.book_append_sheet(wb, wsPagos, "Pagos")
      
      const fechaHoy = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `Backup_Sistema_Prestamos_${fechaHoy}.xlsx`)
    } catch (error) {
      alert("Hubo un error al generar el Excel.")
    } finally {
      setDescargando(false)
    }
  }

  const irACartera = () => {
    document.getElementById('seccion-cartera')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="px-4 sm:px-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div>
           <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mb-1">Visión General</p>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             Panel de Rendimiento <span className="opacity-80">💸</span>
           </h1>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleDescargarBackup}
            disabled={descargando}
            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold font-sm shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            title="Descargar respaldo en Excel"
          >
            {descargando ? '⏳ Generando...' : '📥 Respaldar Excel'}
          </button>

          <Link href="/nuevo-prestamo" className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] transition-all active:scale-95 flex items-center gap-2">
            <span>+ Nuevo Préstamo</span>
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {/* Card 1: Caja del Día (Premium Dark) */}
        <Link href="/caja" className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border border-slate-700">
          <div className="relative z-10 flex justify-between items-end h-full">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Caja del Día</p>
              <p className="text-2xl font-black group-hover:text-indigo-300 transition-colors">Cobranza Diaria</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10 transition-colors">
               <span className="text-sm">➡</span>
            </div>
          </div>
          <div className="absolute -right-4 -top-8 text-white opacity-[0.03] text-9xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">📠</div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
        </Link>

        {/* Card 2: Clientes Activos */}
        <button 
          onClick={irACartera}
          className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 flex justify-between items-center text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer group"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Clientes Activos</p>
            <p className="text-4xl font-black text-slate-800">{totalClientesActivos}</p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">👥</div>
        </button>

        {/* Card 3: Capital en Calle */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 flex justify-between items-center hover:-translate-y-1 transition-transform duration-300">
          <div>
            <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Capital en Calle</p>
            <p className="text-4xl font-black text-emerald-600 tracking-tight">S/ {totalCapitalEnCalle.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl">💸</div>
        </div>
      </div>

      {/* --- AGENDA AGRUPADA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* VENCIDOS (ROJO) */}
        <div className="bg-white rounded-3xl border border-rose-100/50 shadow-[0_8px_30px_rgb(225,29,72,0.04)] overflow-hidden flex flex-col h-[450px]">
            <div className="px-6 py-4 border-b border-rose-100/50 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white shrink-0">
                <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                   🚨 Mora Activa <span className="text-xs bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full">{vencidosOrdenados.length}</span>
                </h3>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                {vencidosOrdenados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <span className="text-4xl mb-2">🎉</span>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">¡Cartera Mantenida al Día!</p>
                    </div>
                ) : (
                    vencidosOrdenados.map((item) => (
                        <div key={item.prestamoId} className="p-4 rounded-xl hover:bg-rose-50/50 transition-colors flex justify-between items-center group">
                            <div>
                                <p className="text-base font-bold text-slate-800">{item.clienteNombre}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                        {item.cantidadCuotas} cuotas
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-400">
                                        Desde el {new Date(item.fechaVencimiento).toLocaleDateString('es-PE', {day:'2-digit', month:'short'})}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-base font-black text-rose-600">S/ {item.totalDeuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                <Link href={`/prestamo/${item.prestamoId}`} className="text-xs font-bold bg-white border border-rose-200 text-rose-600 px-4 py-1.5 rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                    Recaudar
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* PRÓXIMOS (AMARILLO) */}
        <div className="bg-white rounded-3xl border border-amber-100/50 shadow-[0_8px_30px_rgb(245,158,11,0.04)] overflow-hidden flex flex-col h-[450px]">
            <div className="px-6 py-4 border-b border-amber-100/50 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white shrink-0">
                <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                   📅 Agenda de Cobros <span className="text-xs bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full">{porVencerOrdenados.length}</span>
                </h3>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                {porVencerOrdenados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <span className="text-4xl mb-2">🏖️</span>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Agenda Despejada</p>
                    </div>
                ) : (
                    porVencerOrdenados.map((item) => {
                        const esHoy = new Date(item.fechaVencimiento).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
                        return (
                            <div key={item.prestamoId} className="p-4 rounded-xl hover:bg-amber-50/30 transition flex justify-between items-center">
                                <div>
                                    <p className="text-base font-bold text-slate-800">{item.clienteNombre}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${esHoy ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {esHoy ? 'ES HOY' : new Date(item.fechaVencimiento).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </span>
                                        {item.cantidadCuotas > 1 && (
                                           <span className="text-[10px] font-medium text-amber-600">({item.cantidadCuotas} cuotas pendientes)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-base font-black text-slate-700">S/ {item.totalDeuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                    <Link href={`/prestamo/${item.prestamoId}`} className="text-xs font-bold bg-white border border-amber-200 text-amber-600 px-4 py-1.5 rounded-lg hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm">
                                        Revisar
                                    </Link>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

      </div>

      {/* LISTA CLIENTES */}
      <div id="seccion-cartera" className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{clientesFiltrados.length} Registros Totales</p>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-lg mx-auto md:mx-0">
            <span className="absolute left-4 top-3.5 text-slate-400 text-lg">🔍</span>
            <input 
              type="text"
              placeholder="Buscar por nombre o alias..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-slate-900 font-medium placeholder:text-slate-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100/80">
          {clientesFiltrados.length === 0 ? (
             <div className="p-16 text-center text-slate-400">
               <span className="text-4xl mb-4 block">👻</span>
               <p className="font-bold text-lg">No hay clientes con ese nombre.</p>
             </div>
          ) : (
            clientesFiltrados.map((cliente) => {
              const tieneDeuda = cliente.prestamos.length > 0
              return (
                <div key={cliente.id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start lg:items-center flex-col lg:flex-row gap-4">
                    
                    <Link href={`/cliente/${cliente.id}`} className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md ${tieneDeuda ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20' : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{cliente.nombre}</p>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5 opacity-80">
                            📱 {cliente.telefono || 'Sin número de contacto'}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="w-full lg:w-auto flex justify-between lg:justify-end items-center gap-6 mt-2 lg:mt-0 pl-0 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                       {tieneDeuda ? (
                         <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                            {cliente.prestamos.map((p: any, index: number) => (
                              <Link key={p.id} href={`/prestamo/${p.id}`} className="block">
                                <span className="inline-block px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm">
                                  {p.montoCapital ? `S/ ${Number(p.montoCapital).toLocaleString('es-PE')} • ${new Date(p.fechaInicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}` : `Préstamo ${index + 1}`}
                                </span>
                              </Link>
                            ))}
                         </div>
                       ) : (
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">Libre de Deuda</span>
                       )}

                       <button
                          onClick={() => handleBorrarCliente(cliente.id, cliente.nombre)}
                          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                          title="Eliminar Cliente"
                        >
                          🗑️
                        </button>
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