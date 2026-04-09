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
  const [calculoExtra, setCalculoExtra] = useState(0) 
  const [liquidarDeuda, setLiquidarDeuda] = useState(false) 

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
      setCalculoExtra(dias * interesDiario);
    } else if (dias < 0) {
      setCalculoExtra(Math.abs(dias) * interesDiario);
    } else {
      setCalculoExtra(0);
    }

  }, [fechaSeleccionada, cuota.fechaVencimiento, interesDiario])

  const aplicarMora = () => {
     setMonto(prev => Number((prev + calculoExtra).toFixed(2)));
  }

  const aplicarDescuento = () => {
     const nuevoMonto = deudaRestante - calculoExtra;
     setMonto(nuevoMonto > 0 ? Number(nuevoMonto.toFixed(2)) : 0);
     setLiquidarDeuda(true);
  }

  if (abierto) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            action={registrarPago} 
            onSubmit={() => setAbierto(false)} 
            className="flex flex-col gap-4 bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl shadow-indigo-500/20 w-full max-w-sm ring-1 ring-white/50 relative animate-in zoom-in-95 duration-200"
          >

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                   <p className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1.5">
                       <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Recepcionar Pago
                   </p>
                   <p className="text-xs text-slate-500 font-medium mt-1">Cuota #{cuota.numero} • Vence: {new Date(cuota.fechaVencimiento).toLocaleDateString('es-PE', {timeZone: 'UTC'})}</p>
                </div>
                <button type="button" onClick={() => setAbierto(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm self-start">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <input type="hidden" name="cuotaId" value={cuota.id} />
            <input type="hidden" name="prestamoId" value={prestamoId} />
            
            {/* INPUT FECHA */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1.5 uppercase tracking-wider">Fecha de Recibo</label>
              <input 
                type="date" 
                name="fecha"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800 font-bold bg-slate-50/50 shadow-sm cursor-pointer"
              />
            </div>

            {/* --- LÓGICA DE ALERTAS --- */}
            {/* CASO A: MORA (ROJO) */}
            {diasDiferencia > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl shadow-inner">
                 <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-rose-600 font-black uppercase tracking-wider">⚠ {diasDiferencia} días {diasDiferencia === 1 ? 'tarde' : 'tardes'}</span>
                    <span className="text-sm text-rose-700 font-black">+ S/ {calculoExtra.toFixed(2)}</span>
                 </div>
                 <button 
                   type="button" 
                   onClick={aplicarMora}
                   className="w-full bg-white border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-rose-600 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-all active:scale-[0.98] shadow-sm"
                 >
                   Adicionar Mora al Cobro
                 </button>
              </div>
            )}

            {/* CASO B: DESCUENTO (VERDE) */}
            {diasDiferencia < 0 && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-inner">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">🎉 {Math.abs(diasDiferencia)} días antes</span>
                    <span className="text-sm text-emerald-700 font-black">- S/ {calculoExtra.toFixed(2)}</span>
                 </div>
                 <p className="text-[9px] text-emerald-500 mb-2 font-medium">Recompensa por pronto pago</p>
                 <button 
                   type="button" 
                   onClick={aplicarDescuento}
                   className="w-full bg-white border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-emerald-600 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-all active:scale-[0.98] shadow-sm"
                 >
                   Aplicar Descuento
                 </button>
              </div>
            )}

            {/* INPUT MONTO FINAL */}
            <div>
               <label className="text-[10px] text-slate-500 font-bold block mb-1.5 uppercase tracking-wider">Monto a Abonar</label>
               <div className="relative">
                  <span className="absolute left-4 top-2.5 text-indigo-400 font-black text-sm">S/</span>
                  <input 
                    type="number" 
                    name="monto"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 text-xl border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-black text-slate-800 shadow-inner bg-indigo-50/30"
                    autoFocus
                  />
               </div>
            </div>

            {/* CHECKBOX DE LIQUIDACIÓN */}
            <div className="flex items-start gap-2.5 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <input 
                  type="checkbox" 
                  name="liquidar" 
                  id={`liquidarCheck-${cuota.id}`}
                  checked={liquidarDeuda}
                  onChange={(e) => setLiquidarDeuda(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor={`liquidarCheck-${cuota.id}`} className="text-[10px] text-slate-600 font-medium cursor-pointer leading-tight">
                  Marcar obligatoriamente como <strong className="text-slate-800 block mt-0.5">PAGADA TOTALMENTE</strong>
                </label>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 mt-2">
              Confirmar Recibo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
      </div>
    )
  }

  return (
    <div className="relative w-full">
        <button 
          onClick={() => setAbierto(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-indigo-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Registrar Cobro
        </button>
    </div>
  )
}