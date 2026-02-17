// lib/finance.ts

// 1. REGLA DE REDONDEO A 0.50 (La técnica del "Techo")
export function redondearEspecial(monto: number): number {
  return Math.ceil(monto * 2) / 2;
}

// 2. GENERADOR DE FECHAS (Lineal, incluye domingos)
export function sumarDias(fechaBase: Date, diasASumar: number): Date {
  const nuevaFecha = new Date(fechaBase);
  nuevaFecha.setDate(nuevaFecha.getDate() + diasASumar);
  return nuevaFecha;
}

// 3. GENERAR CRONOGRAMA (Actualizado para recibir fechaInicio)
export function generarCronograma(
  monto: number, 
  tasa: number, 
  frecuencia: 'DIARIO'|'SEMANAL'|'QUINCENAL'|'MENSUAL', 
  duracionMeses: number,
  fechaInicio?: Date // <--- NUEVO PARÁMETRO OPCIONAL
) {
  // Cálculo del Interés Simple: (Capital * Tasa * Tiempo)
  const interesTotal = monto * (tasa / 100) * duracionMeses;
  const totalPagar = monto + interesTotal;
  
  let numeroCuotas = 0;
  let intervaloDias = 0;

  switch (frecuencia) {
    case 'DIARIO':
      numeroCuotas = duracionMeses * 30; // Mes comercial de 30 días
      intervaloDias = 1; 
      break;
    case 'SEMANAL':
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
  
  // APLICAMOS EL REDONDEO ESPECIAL
  const montoCuotaFinal = redondearEspecial(montoCuotaRaw);

  // Recalculamos el total real
  const totalReal = montoCuotaFinal * numeroCuotas;

  const cuotas = [];
  
  // Usamos la fecha que nos pasaron o "HOY" si no hay ninguna
  let fechaActual = fechaInicio ? new Date(fechaInicio) : new Date();

  for (let i = 1; i <= numeroCuotas; i++) {
    fechaActual = sumarDias(fechaActual, intervaloDias);
    
    cuotas.push({
      numero: i,
      fechaVencimiento: new Date(fechaActual), 
      monto: montoCuotaFinal
    });
  }

  return { cuotas, totalReal, montoCuotaFinal, interesTotal };
}