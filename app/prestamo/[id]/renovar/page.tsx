'use client' // Importante para la interactividad

import { useState, useEffect, use } from 'react' // Importamos 'use'
import { procesarRenovacion } from '@/app/actions'
import Link from 'next/link'

export default function RenovarPage(props: { params: Promise<{ id: string }> }) {
  // Desempaquetamos los params usando 'use'
  const params = use(props.params);
  const id = Number(params.id);

  // ESTADOS DEL CLIENTE (Simulamos fetch rápido o podrías pasarlo como prop si prefieres server component mixto)
  // Para hacerlo simple y rápido visualmente, asumiremos que traemos la deuda como prop o hacemos un fetch client side
  // PERO, para no complicar tu estructura, vamos a usar un truco:
  // Como es un Client Component, no podemos hacer prisma.findUnique aquí directo.
  // Lo ideal es recibir los datos desde un Server Component padre o pasarlos.
  // *Por ahora, pondremos un deuda estática o un fetch effect.*
  
  // NOTA: Para que esto funcione perfecto, este archivo debería recibir la deuda actual.
  // Asumiré que me pasas la deuda actual en la URL o hacemos un fetch.
  // Para este ejemplo, pondré un input manual de "Deuda Actual" que se puede pre-llenar.
  
  const [deudaActual, setDeudaActual] = useState(0) // Esto se debería cargar de la DB
  const [nombreCliente, setNombreCliente] = useState("Cargando...")

  // ESTADOS DEL FORMULARIO
  const [pagoHoy, setPagoHoy] = useState(0)
  const [aumentoCapital, setAumentoCapital] = useState(0)
  const [nuevoInteres, setNuevoInteres] = useState(10)
  const [nuevasCuotas, setNuevasCuotas] = useState(1) // Default
  const [nuevaFrecuencia, setNuevaFrecuencia] = useState('MENSUAL')
  const [moraDiaria, setMoraDiaria] = useState(0)

  // CÁLCULOS
  const [resumen, setResumen] = useState({
    nuevoCapitalBase: 0,
    interesGenerado: 0,
    totalDeudaNueva: 0,
    montoCuota: 0,
    tiempoEstimado: ''
  })

  // EFECTO: Cargar datos del préstamo (Simulado fetch a una API interna o Server Action)
  useEffect(() => {
    // Aquí idealmente llamarías a una Server Action que te de los datos del préstamo ID
    // Por simplicidad, asumiremos que el usuario ve la deuda arriba.
    // Si quieres hacerlo 100% real, necesitamos crear una función 'obtenerPrestamo(id)' en actions.ts
    // y llamarla aquí.
    
    // Simulación:
    // obtenerPrestamo(id).then(data => { setDeudaActual(data.saldo); setNombreCliente(data.cliente) })
    
    // Por ahora, permite editar la deuda actual manualmente si no carga
    setDeudaActual(660) // Valor de ejemplo de tu imagen
    setNombreCliente("Cliente")
  }, [id])

  // EFECTO: CÁLCULO EN TIEMPO REAL 🧮
  useEffect(() => {
    // 1. Capital Base
    const capitalBase = (deudaActual - pagoHoy) + aumentoCapital

    // 2. Tiempo
    let dias = 1
    if (nuevaFrecuencia === 'SEMANAL') dias = 7
    if (nuevaFrecuencia === 'QUINCENAL') dias = 15
    if (nuevaFrecuencia === 'MENSUAL') dias = 30
    
    const duracionDias = nuevasCuotas * dias

    // 3. Interés
    const ganancia = capitalBase * (nuevoInteres / 100) * (duracionDias / 30)

    // 4. Totales
    const total = capitalBase + ganancia
    const cuota = nuevasCuotas > 0 ? total / nuevasCuotas : 0
    
    // 5. Mora automática sugerida
    const moraSugerida = duracionDias > 0 ? (ganancia / duracionDias) : 0
    setMoraDiaria(Number(moraSugerida.toFixed(2)))

    // Texto tiempo
    let textoTiempo = `${duracionDias} días`
    if (duracionDias > 30) textoTiempo = `${(duracionDias/30).toFixed(1)} meses`

    setResumen({
      nuevoCapitalBase: capitalBase,
      interesGenerado: ganancia,
      totalDeudaNueva: total,
      montoCuota: cuota,
      tiempoEstimado: textoTiempo
    })

  }, [deudaActual, pagoHoy, aumentoCapital, nuevoInteres, nuevasCuotas, nuevaFrecuencia])


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* HEADER AMARILLO */}
        <div className="bg-yellow-500 p-6 text-white">
            <h1 className="text-xl font-black">Refinanciar Préstamo 🔄</h1>
            <p className="text-yellow-100 text-sm">{nombreCliente} • Préstamo #{id}</p>
        </div>

        <form action={procesarRenovacion} className="p-6 space-y-6">
            <input type="hidden" name="prestamoId" value={id} />
            
            {/* 1. SITUACIÓN ACTUAL */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Deuda Pendiente Real</label>
                    <span className="text-xs text-blue-500 cursor-pointer hover:underline">Recalcular</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold">S/</span>
                    <input 
                        type="number" 
                        value={deudaActual} 
                        onChange={e => setDeudaActual(Number(e.target.value))}
                        className="bg-transparent text-2xl font-black text-gray-800 outline-none w-full"
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">* Esta es la base para el nuevo cálculo.</p>
            </div>

            {/* 2. MOVIMIENTOS DE CAJA */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">¿Cuánto paga HOY?</label>
                    <input 
                        name="pagoHoy" 
                        type="number" 
                        value={pagoHoy}
                        onChange={e => setPagoHoy(Number(e.target.value))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none font-bold text-green-600 focus:border-green-500" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">¿Capital Extra? (Mano)</label>
                    <input 
                        name="aumentoCapital" 
                        type="number" 
                        value={aumentoCapital}
                        onChange={e => setAumentoCapital(Number(e.target.value))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none font-bold text-blue-600 focus:border-blue-500" 
                    />
                </div>
            </div>

            {/* 3. NUEVAS CONDICIONES (FLEXIBLES) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nuevas Condiciones</h3>
                
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Frecuencia</label>
                        <select 
                            name="nuevaFrecuencia" 
                            value={nuevaFrecuencia}
                            onChange={e => setNuevaFrecuencia(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none"
                        >
                            <option value="DIARIO">Diario</option>
                            <option value="SEMANAL">Semanal</option>
                            <option value="QUINCENAL">Quincenal</option>
                            <option value="MENSUAL">Mensual</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">N° Cuotas</label>
                        <input 
                            name="nuevasCuotas" 
                            type="number" 
                            value={nuevasCuotas}
                            onChange={e => setNuevasCuotas(Number(e.target.value))}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none" 
                        />
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Interés Mensual (%)</label>
                        <input 
                            name="nuevoInteres" 
                            type="number" 
                            value={nuevoInteres}
                            onChange={e => setNuevoInteres(Number(e.target.value))}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none" 
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mora x Día (Auto)</label>
                        <input 
                            name="moraDiaria" 
                            type="number" 
                            step="0.01"
                            value={moraDiaria}
                            onChange={e => setMoraDiaria(Number(e.target.value))}
                            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none text-gray-500" 
                        />
                     </div>
                </div>
            </div>

            {/* 4. TARJETA DE RESUMEN EN TIEMPO REAL */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-inner">
                <div className="flex justify-between items-start mb-4 border-b border-blue-100 pb-2">
                    <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Nuevo Capital Base</p>
                        <p className="text-xl font-black text-gray-800">S/ {resumen.nuevoCapitalBase.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-green-500 uppercase">Interés a Ganar</p>
                        <p className="text-xl font-black text-green-600">+ S/ {resumen.interesGenerado.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Nueva Cuota ({nuevasCuotas})</p>
                        <p className="text-2xl font-black text-blue-700">S/ {resumen.montoCuota.toFixed(2)}</p>
                        <p className="text-[10px] text-blue-400 font-medium">Cada {nuevaFrecuencia.toLowerCase()}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Total Final</p>
                         <p className="text-lg font-bold text-gray-600">S/ {resumen.totalDeudaNueva.toFixed(2)}</p>
                         <p className="text-[10px] text-gray-400">Duración: {resumen.tiempoEstimado}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <Link href={`/prestamo/${id}`} className="flex-1 py-4 text-center text-gray-500 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200">
                    Cancelar
                </Link>
                <button type="submit" className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-yellow-200 transition-transform active:scale-95">
                    Confirmar Refinanciamiento
                </button>
            </div>

        </form>
      </div>
    </div>
  )
}