// utils/finance.ts (VERSIÓN CORREGIDA: SÍ COBRA DOMINGOS)

// 1. REGLA DE REDONDEO A 0.50 (Se mantiene igual)
export function redondearEspecial(monto: number): number {
  // Multiplicamos por 2, redondeamos al techo, dividimos entre 2
  // Ejemplo: 23.10 -> 46.20 -> Ceil(46.20) = 47 -> 47 / 2 = 23.50
  return Math.ceil(monto * 2) / 2;
}

// 2. GENERADOR DE FECHAS
// Como SÍ cobra domingos, simplemente sumamos días linealmente.
export function sumarDias(fechaBase: Date, diasASumar: number): Date {
  const nuevaFecha = new Date(fechaBase);
  nuevaFecha.setDate(nuevaFecha.getDate() + diasASumar);
  return nuevaFecha;
}

// 3. GENERAR CRONOGRAMA
export function generarCronograma(
  monto: number, 
  tasa: number, // Tasa mensual (ej. 10 para 10%)
  frecuencia: 'DIARIO'|'SEMANAL'|'QUINCENAL'|'MENSUAL', 
  duracionMeses: number
) {
  // Cálculo del total a pagar (Interés Simple)
  const interesTotal = monto * (tasa / 100) * duracionMeses;
  const totalPagar = monto + interesTotal;
  
  let numeroCuotas = 0;
  let intervaloDias = 0;

  switch (frecuencia) {
    case 'DIARIO':
      // Al cobrar domingos, usamos el mes comercial estándar de 30 días
      numeroCuotas = duracionMeses * 30; 
      intervaloDias = 1; 
      break;
    case 'SEMANAL':
      // 4 semanas por mes aprox (ajustable según prefiera ella exactitud de calendario)
      numeroCuotas = duracionMeses * 4; 
      intervaloDias = 7;
      break;
    case 'QUINCENAL':
      numeroCuotas = duracionMeses * 2;
      intervaloDias = 15;
      break;
    case 'MENSUAL':
      numeroCuotas = duracionMeses;
      intervaloDias = 30;
      break;
  }

  // Calculamos monto base
  const montoCuotaRaw = totalPagar / numeroCuotas;
  
  // APLICAMOS LA REGLA DEL 0.50
  const montoCuotaFinal = redondearEspecial(montoCuotaRaw);

  // Recalculamos el total real (puede subir un poco por el redondeo)
  const totalReal = montoCuotaFinal * numeroCuotas;

  const cuotas = [];
  let fechaActual = new Date(); // Fecha de inicio (Hoy)

  for (let i = 1; i <= numeroCuotas; i++) {
    // Sumamos los días correspondientes
    fechaActual = sumarDias(fechaActual, intervaloDias);
    
    cuotas.push({
      numero: i,
      fechaVencimiento: new Date(fechaActual), // Guardamos copia de la fecha
      monto: montoCuotaFinal,
      estado: 'PENDIENTE'
    });
  }

  return { 
    resumen: {
      capital: monto,
      interesGanado: totalReal - monto,
      totalPagar: totalReal,
      tasaMensual: tasa,
      numeroCuotas
    },
    cuotas 
  };
}