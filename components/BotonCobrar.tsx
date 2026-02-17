'use client'

import { useState, useEffect } from 'react'
import { registrarPago } from '@/app/actions'

type Props = {
  cuota: {
    id: number
    numero: number
    montoEsperado: number
    montoPagado: number
    fechaVencimiento: string 
  }
  prestamoId: number
  interesDiario: number 
}

export default function BotonCobrar({ cuota, prestamoId, interesDiario }: Props) {
  const [abierto, setAbierto] = useState(false)
  
  const deudaRestante = cuota.montoEsperado - cuota.montoPagado
  const [monto, setMonto] = useState(deudaRestante)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  
  // Estados para Mora y Descuento
  const [diasDiferencia, setDiasDiferencia] = useState(0)
  const [calculoExtra, setCalculoExtra] = useState(0) // Puede ser Mora (+) o Descuento (-)
  const [liquidarDeuda, setLiquidarDeuda] = useState(false) // Checkbox para cerrar cuota

  // EFECTO: Calcular Mora O Descuento
  useEffect(() => {
    if (!cuota.fechaVencimiento) return;

    const fechaPago = new Date(fechaSeleccionada);
    const fechaVenc = new Date(cuota.fechaVencimiento);
    
    // Normalizamos horas
    fechaPago.setHours(12,0,0,0);
    fechaVenc.setHours(12,0,0,0);

    const diferenciaMs = fechaPago.getTime() - fechaVenc.getTime();
    const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    
    setDiasDiferencia(dias);

    if (dias > 0) {
      // MORA (Positivo)
      setCalculoExtra(dias * interesDiario);
    } else if (dias < 0) {
      // DESCUENTO (Positivo visualmente, pero resta)
      // Math.abs(dias) * interesDiario
      setCalculoExtra(Math.abs(dias) * interesDiario);
    } else {
      setCalculoExtra(0);
    }

  }, [fechaSeleccionada, cuota.fechaVencimiento, interesDiario])

  // Botón para aplicar Mora
  const aplicarMora = () => {
     setMonto(prev => Number((prev + calculoExtra).toFixed(2)));
  }

  // Botón para aplicar Descuento
  const aplicarDescuento = () => {
     const nuevoMonto = deudaRestante - calculoExtra;
     setMonto(nuevoMonto > 0 ? Number(nuevoMonto.toFixed(2)) : 0);
     setLiquidarDeuda(true); // Marcamos automáticamente que queremos cerrar la cuota
  }

  if (abierto) {
    return (
      <form 
        action={registrarPago} 
        onSubmit={() => setAbierto(false)} 
        className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-blue-200 shadow-2xl absolute right-0 z-50 w-72 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Registrar Pago</p>
            <button type="button" onClick={() => setAbierto(false)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
        </div>
        
        <input type="hidden" name="cuotaId" value={cuota.id} />
        <input type="hidden" name="prestamoId" value={prestamoId} />
        
        {/* INPUT FECHA */}
        <div>
          <label className="text-[10px] text-gray-500 font-bold block mb-1">Fecha del Pago</label>
          <input 
            type="date" 
            name="fecha"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700 bg-gray-50"
          />
        </div>

        {/* --- LÓGICA DE ALERTAS --- */}
        
        {/* CASO A: MORA (ROJO) */}
        {diasDiferencia > 0 && (
          <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-red-600 font-bold">⚠ {diasDiferencia} días tarde</span>
                <span className="text-xs text-red-700 font-black">+ S/ {calculoExtra.toFixed(2)}</span>
             </div>
             <button 
               type="button" 
               onClick={aplicarMora}
               className="w-full bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-600 text-[10px] font-bold py-1.5 rounded transition-colors"
             >
               Sumar Mora
             </button>
          </div>
        )}

        {/* CASO B: DESCUENTO (VERDE) */}
        {diasDiferencia < 0 && (
          <div className="bg-green-50 border border-green-100 p-2.5 rounded-lg">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-green-600 font-bold">🎉 {Math.abs(diasDiferencia)} días antes</span>
                <span className="text-xs text-green-700 font-black">- S/ {calculoExtra.toFixed(2)}</span>
             </div>
             <p className="text-[9px] text-green-500 mb-2">Ahorro por interés diario</p>
             <button 
               type="button" 
               onClick={aplicarDescuento}
               className="w-full bg-white border border-green-200 hover:bg-green-600 hover:text-white text-green-600 text-[10px] font-bold py-1.5 rounded transition-colors"
             >
               Aplicar Descuento
             </button>
          </div>
        )}

        {/* INPUT MONTO FINAL */}
        <div>
           <label className="text-[10px] text-gray-500 font-bold block mb-1">Monto a Abonar</label>
           <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm font-bold">S/</span>
              <input 
                type="number" 
                name="monto"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 text-lg border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 font-black text-gray-800"
                autoFocus
              />
           </div>
        </div>

        {/* CHECKBOX DE LIQUIDACIÓN (Importante para descuentos) */}
        <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              name="liquidar" 
              id="liquidarCheck"
              checked={liquidarDeuda}
              onChange={(e) => setLiquidarDeuda(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="liquidarCheck" className="text-[10px] text-gray-600 font-medium cursor-pointer leading-tight">
              Marcar cuota como <strong>PAGADA TOTALMENTE</strong> (ajustar deuda)
            </label>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95">
          Confirmar Pago
        </button>
      </form>
    )
  }

  return (
    <div className="relative">
        <button 
          onClick={() => setAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shadow-blue-200 transition-transform active:scale-95"
        >
          Cobrar
        </button>
    </div>
  )
}