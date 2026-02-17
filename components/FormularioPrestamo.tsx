'use client'

import { useState, useEffect } from 'react'
import { crearPrestamo } from '@/app/actions'

export default function FormularioPrestamo() {
  // Estados
  const [monto, setMonto] = useState(1000)
  const [interes, setInteres] = useState(10)
  const [cuotas, setCuotas] = useState(1)
  const [frecuencia, setFrecuencia] = useState('MENSUAL')
  
  // NUEVO: Estado para la mora automática
  const [mora, setMora] = useState(0)
  
  // Resultados calculados
  const [calculo, setCalculo] = useState({ total: 0, cuota: 0, ganancia: 0, tiempo: '' })

  useEffect(() => {
    // 1. Determinar días por cuota
    let dias = 1
    if (frecuencia === 'SEMANAL') dias = 7
    if (frecuencia === 'QUINCENAL') dias = 15
    if (frecuencia === 'MENSUAL') dias = 30

    // 2. Duración real del préstamo en días
    const duracionDias = cuotas * dias
    
    // 3. Calcular Ganancia (Interés Proporcional)
    // Fórmula: Capital * (TasaMensual/100) * (DíasReales / 30)
    const ganancia = monto * (interes / 100) * (duracionDias / 30)
    
    const total = monto + ganancia
    const valorCuota = total / cuotas

    // 4. CÁLCULO AUTOMÁTICO DE MORA
    // Lógica: La mora diaria justa es igual a lo que ganas en un día normal.
    // Si ganas 100 soles en 20 días, tu mora diaria debería ser 5 soles.
    const moraSugerida = duracionDias > 0 ? (ganancia / duracionDias) : 0

    // Actualizamos el estado de la mora automáticamente
    setMora(Number(moraSugerida.toFixed(2)))

    // Texto de tiempo estimado
    let textoTiempo = `${duracionDias} días`
    if (duracionDias > 30) textoTiempo = `${(duracionDias/30).toFixed(1)} meses`

    setCalculo({
      total,
      cuota: valorCuota,
      ganancia,
      tiempo: textoTiempo
    })

  }, [monto, interes, cuotas, frecuencia]) // Se recalcula cada vez que cambias algo

  return (
    <form action={crearPrestamo} className="p-6 space-y-6">
      
      {/* 1. CLIENTE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input name="nombre" type="text" placeholder="Ej: Juan Perez" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono (WhatsApp)</label>
            <input name="telefono" type="tel" placeholder="999 000 000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
          </div>
        </div>
      </div>

      {/* 2. PRÉSTAMO */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Condiciones del Préstamo</h3>
        
        {/* MONTO Y FRECUENCIA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Monto a Prestar (S/)</label>
            <input 
              name="monto" 
              type="number" 
              value={monto} 
              onChange={e => setMonto(Number(e.target.value))}
              className="w-full p-3 font-bold text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Frecuencia de Pago</label>
            <select 
              name="frecuencia" 
              value={frecuencia}
              onChange={e => setFrecuencia(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none"
            >
              <option value="DIARIO">Diario (Cada día)</option>
              <option value="SEMANAL">Semanal (Cada 7 días)</option>
              <option value="QUINCENAL">Quincenal (Cada 15 días)</option>
              <option value="MENSUAL">Mensual (Cada 30 días)</option>
            </select>
          </div>
        </div>

        {/* INTERÉS Y CUOTAS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Interés Mensual (%)</label>
            <div className="relative">
              <input 
                name="interes" 
                type="number" 
                value={interes}
                onChange={e => setInteres(Number(e.target.value))}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none" 
              />
              <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">N° de Cuotas</label>
            <input 
              name="cuotas" 
              type="number" 
              value={cuotas}
              onChange={e => setCuotas(Number(e.target.value))}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none" 
            />
          </div>
        </div>

        {/* FECHA INICIO Y MORA (AUTOMÁTICA) */}
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Inicio</label>
              <input name="fechaInicio" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none" />
           </div>
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                 <span>Mora x Día (S/)</span>
                 <span className="text-[10px] text-blue-500 font-normal self-center">Automático ✨</span>
              </label>
              <input 
                 name="moraDiaria" 
                 type="number" 
                 step="0.01" 
                 // AQUÍ USAMOS EL ESTADO CALCULADO
                 value={mora}
                 // Pero permitimos editar si tú quieres cambiarlo manualmente
                 onChange={e => setMora(Number(e.target.value))}
                 className="w-full p-3 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors" 
              />
           </div>
        </div>
      </div>

      {/* 3. RESUMEN EN TIEMPO REAL */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Resumen del Cálculo</h4>
        
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Monto Cuota</p>
                <p className="text-lg font-black text-blue-900">S/ {calculo.cuota.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Ganancia</p>
                <p className="text-lg font-black text-green-600">S/ {calculo.ganancia.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Total a Recibir</p>
                <p className="text-lg font-black text-blue-900">S/ {calculo.total.toFixed(2)}</p>
            </div>
        </div>
        <div className="mt-3 text-center border-t border-blue-100 pt-2">
            <p className="text-xs text-blue-500">
               El crédito durará aprox: <strong>{calculo.tiempo}</strong>
            </p>
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95 text-lg">
        Crear Préstamo 🚀
      </button>
    </form>
  )
}