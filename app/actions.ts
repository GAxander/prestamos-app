'use server'

import { prisma } from '@/lib/prisma'
import { generarCronograma } from '@/lib/finance'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import bcrypt from 'bcryptjs'
import { createSession, logout, verificarSesion } from '@/lib/auth'

// app/actions.ts (Solo reemplaza la función crearPrestamo)

// app/actions.ts

export async function registro(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.usuario.create({
    data: { username, password: hashedPassword }
  })

  await createSession(user.id)
  redirect('/')
}

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const user = await prisma.usuario.findUnique({ where: { username } })
  if (!user) throw new Error('Usuario no encontrado')

  const esCorrecta = await bcrypt.compare(password, user.password)
  if (!esCorrecta) throw new Error('Contraseña incorrecta')

  await createSession(user.id)
  redirect('/')
}

export async function cerrarSesion() {
  await logout()
}

export async function crearPrestamo(formData: FormData) {
  const userId = await verificarSesion()
  
  const clienteIdForm = formData.get('clienteId') as string 
  const nombre = formData.get('nombre') as string
  const telefono = formData.get('telefono') as string
  const monto = Number(formData.get('monto'))
  const interesMensual = Number(formData.get('interes')) 
  const numeroCuotas = Number(formData.get('cuotas')) 
  const frecuencia = formData.get('frecuencia') as 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
  const fechaInicio = new Date(formData.get('fechaInicio') as string)
  const moraDiaria = Number(formData.get('moraDiaria') || 0)

  const tipoMensual = formData.get('tipoMensual') as string || '30_DIAS'

  if (!nombre || monto <= 0 || numeroCuotas <= 0) {
    throw new Error("Datos inválidos")
  }

  // ------------------------------------------------------------------
  // 🧠 LÓGICA INTELIGENTE DE CLIENTE
  // ------------------------------------------------------------------
  let clienteIdFinal: number

  if (clienteIdForm) {
    clienteIdFinal = Number(clienteIdForm)
    await prisma.cliente.update({
      where: { id: clienteIdFinal },
      data: { telefono }
    })
  } else {
    let cliente = await prisma.cliente.findFirst({ 
      where: { nombre: nombre, usuarioId: userId } 
    })
    
    if (cliente) {
      clienteIdFinal = cliente.id
      await prisma.cliente.update({
        where: { id: clienteIdFinal },
        data: { telefono }
      })
    } else {
      const nuevoCliente = await prisma.cliente.create({ 
        data: { nombre, telefono, usuarioId: userId } 
      })
      clienteIdFinal = nuevoCliente.id
    }
  }

  // 1. Determinar días por cuota
  let diasPorCuota = 1
  if (frecuencia === 'SEMANAL') diasPorCuota = 7
  if (frecuencia === 'QUINCENAL') diasPorCuota = 15
  if (frecuencia === 'MENSUAL') diasPorCuota = 30 

  // 2. Calcular duraciones e intereses
  const duracionTotalDias = numeroCuotas * diasPorCuota
  const gananciaInteres = monto * (interesMensual / 100) * (duracionTotalDias / 30)
  const totalAPagar = monto + gananciaInteres
  const montoPorCuota = totalAPagar / numeroCuotas

  // ------------------------------------------------------------------
  // 🗓️ NUEVA GENERACIÓN DE CUOTAS (Sin deriva de fechas)
  // ------------------------------------------------------------------
  const cuotas = []

  for (let i = 1; i <= numeroCuotas; i++) {
    // Siempre clonamos la fecha inicial original para no perder el día exacto
    let fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setHours(12, 0, 0, 0)
    
    if (frecuencia === 'MENSUAL' && tipoMensual === 'FECHA_FIJA') {
      // Sumamos la cantidad de meses directamente a la fecha raíz
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)
    } else {
      // Sumamos los días exactos acumulados
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (diasPorCuota * i))
    }
    
    cuotas.push({
      numero: i,
      fechaVencimiento: fechaVencimiento,
      monto: montoPorCuota
    })
  }

  // Guardar en Base de Datos
  await prisma.prestamo.create({
    data: {
      clienteId: clienteIdFinal, 
      montoCapital: monto,
      interesPorcentaje: interesMensual,
      frecuencia: frecuencia,
      plazo: numeroCuotas, 
      fechaInicio: fechaInicio,
      moraDiaria: moraDiaria,
      cuotas: {
        create: cuotas.map((c) => ({
          numero: c.numero,
          fechaVencimiento: c.fechaVencimiento,
          montoEsperado: c.monto,
          estado: 'PENDIENTE'
        }))
      }
    }
  })

  // Los imports ya no están aquí abajo, asumimos que están en la línea 1 de tu archivo :)
  revalidatePath('/')
  redirect('/')
}

// --- 2. REGISTRAR PAGO DE UNA CUOTA ---
// app/actions.ts

// ... (otras funciones)

// app/actions.ts

// ... dentro de app/actions.ts ...

// app/actions.ts

export async function registrarPago(formData: FormData) {
  const cuotaId = Number(formData.get('cuotaId'))
  const prestamoId = Number(formData.get('prestamoId'))
  const montoIngresado = Number(formData.get('monto'))
  const fechaInput = formData.get('fecha') as string
  const fechaPago = fechaInput ? new Date(fechaInput + 'T12:00:00') : new Date()
  
  // NUEVO: Checkbox para decir "Ya está pagado, no cobres lo que falta"
  const liquidar = formData.get('liquidar') === 'on'

  if (montoIngresado <= 0) throw new Error("El monto debe ser mayor a 0")

  const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } })
  if (!cuota) throw new Error("Cuota no encontrada")

  const nuevoMontoPagado = Number(cuota.montoPagado) + montoIngresado
  let montoEsperado = Number(cuota.montoEsperado)

  // SI LIQUIDAMOS (DESCUENTO):
  // Ajustamos el monto esperado para que sea igual a lo pagado.
  // Así la deuda queda en 0.00 y no sale como "pendiente" en los reportes.
  if (liquidar && nuevoMontoPagado < montoEsperado) {
    montoEsperado = nuevoMontoPagado
  }

  // Verificamos si se pagó todo (ahora comparamos con el monto posiblemente ajustado)
  const estaPagadoTotalmente = nuevoMontoPagado >= (montoEsperado - 0.1);

  // 1. Registrar Pago
  await prisma.pago.create({
    data: {
      prestamoId: prestamoId,
      monto: montoIngresado,
      fecha: fechaPago,
      tipo: 'CUOTA',
      nota: liquidar && nuevoMontoPagado < Number(cuota.montoEsperado) 
        ? `Pago con DESCUENTO por adelanto (Ajustado de S/ ${cuota.montoEsperado} a S/ ${nuevoMontoPagado})`
        : `Abono a cuota #${cuota.numero}`
    }
  })

  // 2. Actualizar Cuota
  await prisma.cuota.update({
    where: { id: cuotaId },
    data: {
      estado: estaPagadoTotalmente ? 'PAGADO' : 'PENDIENTE',
      montoPagado: nuevoMontoPagado,
      montoEsperado: montoEsperado // Guardamos el nuevo monto esperado (con descuento)
    }
  })

  // 3. Verificar si el préstamo terminó
  const pendientes = await prisma.cuota.count({
    where: { prestamoId: prestamoId, estado: { not: 'PAGADO' } }
  })

  if (pendientes === 0) {
    await prisma.prestamo.update({ where: { id: prestamoId }, data: { estado: 'FINALIZADO' } })
  }

  revalidatePath(`/prestamo/${prestamoId}`)
}

// app/actions.ts

export async function procesarRenovacion(formData: FormData) {
  const prestamoId = Number(formData.get('prestamoId'))
  
  // 1. Datos Financieros
  const pagoHoy = Number(formData.get('pagoHoy') || 0)
  const aumentoCapital = Number(formData.get('aumentoCapital') || 0)
  
  // 2. Nuevas Condiciones
  const nuevoInteres = Number(formData.get('nuevoInteres'))
  const nuevasCuotas = Number(formData.get('nuevasCuotas'))
  const nuevaFrecuencia = formData.get('nuevaFrecuencia') as string
  const moraDiaria = Number(formData.get('moraDiaria') || 0)

  // 3. Obtener el préstamo viejo para cerrarlo
  const prestamoAnterior = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: { cuotas: true }
  })

  if (!prestamoAnterior) throw new Error("Préstamo no encontrado")

  // Calcular deuda actual real
  const deudaActual = prestamoAnterior.cuotas.reduce((sum, c) => {
    return sum + (Number(c.montoEsperado) - Number(c.montoPagado))
  }, 0)

  // 4. Calcular el NUEVO CAPITAL BASE
  // (Lo que debía - Lo que pagó hoy + Dinero extra que le doy)
  const nuevoMontoCapital = (deudaActual - pagoHoy) + aumentoCapital

  // 5. Calcular Intereses del Nuevo Préstamo (Lógica de Días)
  let diasPorCuota = 1
  if (nuevaFrecuencia === 'SEMANAL') diasPorCuota = 7
  if (nuevaFrecuencia === 'QUINCENAL') diasPorCuota = 15
  if (nuevaFrecuencia === 'MENSUAL') diasPorCuota = 30

  const duracionDias = nuevasCuotas * diasPorCuota
  
  // Interés proporcional: Capital * Tasa * (Tiempo/30)
  const gananciaInteres = nuevoMontoCapital * (nuevoInteres / 100) * (duracionDias / 30)

  const totalAPagar = nuevoMontoCapital + gananciaInteres
  const montoPorCuota = totalAPagar / nuevasCuotas

  // --- TRANSACCIÓN ---
  // A. Marcar el anterior como REFINANCIADO (o Finalizado)
  await prisma.prestamo.update({
    where: { id: prestamoId },
    data: { estado: 'REFINANCIADO' } // O 'FINALIZADO' según prefieras
  })

  // B. Crear el NUEVO PRÉSTAMO
  const fechaInicio = new Date()
  const cuotas = []
  let fechaActual = new Date(fechaInicio)
  fechaActual.setHours(12, 0, 0, 0)

  for (let i = 1; i <= nuevasCuotas; i++) {
    fechaActual.setDate(fechaActual.getDate() + diasPorCuota)
    cuotas.push({
      numero: i,
      fechaVencimiento: new Date(fechaActual),
      monto: montoPorCuota
    })
  }

  await prisma.prestamo.create({
    data: {
      clienteId: prestamoAnterior.clienteId,
      montoCapital: nuevoMontoCapital, // Este es el nuevo saldo base
      interesPorcentaje: nuevoInteres,
      plazo: nuevasCuotas,
      frecuencia: nuevaFrecuencia,
      fechaInicio: fechaInicio,
      moraDiaria: moraDiaria,
      cuotas: {
        create: cuotas.map(c => ({
          numero: c.numero,
          fechaVencimiento: c.fechaVencimiento,
          montoEsperado: c.monto,
          estado: 'PENDIENTE'
        }))
      }
    }
  })

  // C. Si pagó algo hoy, registramos ese pago en el historial del VIEJO (opcional, para cuadrar caja)
  if (pagoHoy > 0) {
    await prisma.pago.create({
      data: {
        prestamoId: prestamoId,
        monto: pagoHoy,
        fecha: new Date(),
        tipo: 'CUOTA',
        nota: 'Pago inicial por refinanciamiento'
      }
    })
  }

  revalidatePath('/')
  redirect(`/cliente/${prestamoAnterior.clienteId}`)
}

// --- 4. ACTUALIZAR CLIENTE (EDITAR) ---
// app/actions.ts

export async function actualizarCliente(formData: FormData) {
  const userId = await verificarSesion()
  const id = Number(formData.get('id'))
  const nombre = formData.get('nombre') as string
  const telefono = formData.get('telefono') as string
  
  // 1. EL GUARDIÁN: Verificamos si OTRO tiene ese nombre
  const existeOtro = await prisma.cliente.findFirst({
    where: {
      nombre: nombre,
      id: { not: id } ,
      usuarioId: userId
    }
  })

  if (existeOtro) {
    // CAMBIO AQUÍ: Enviamos el nombre que intentaste poner en la URL
    redirect(`/cliente/${id}/editar?error=duplicado&nombreIntento=${encodeURIComponent(nombre)}`)
  }

  // 2. Si pasa, actualizamos
  await prisma.cliente.update({
    where: { id },
    data: { nombre, telefono } 
  })

  revalidatePath('/')
  revalidatePath(`/cliente/${id}`)
  redirect(`/cliente/${id}`) 
}


// --- 5. ANULAR PAGO (CORRECCIÓN DE ERRORES) ---
export async function anularPago(formData: FormData) {
  const cuotaId = Number(formData.get('cuotaId'))
  const prestamoId = Number(formData.get('prestamoId'))

  const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } })
  if (!cuota) throw new Error("Cuota no encontrada")

  // 1. Registrar el "Anti-Pago" (Negativo) para que cuadre la caja
  await prisma.pago.create({
    data: {
      prestamoId,
      monto: Number(cuota.montoEsperado) * -1, // Multiplicamos por -1 para restar
      tipo: 'ANULACION',
      nota: `Corrección: Anulado pago cuota #${cuota.numero}`
    }
  })

  // 2. Restaurar la cuota a "PENDIENTE"
  await prisma.cuota.update({
    where: { id: cuotaId },
    data: {
      estado: 'PENDIENTE',
      montoPagado: 0
    }
  })

  // 3. Asegurar que el préstamo siga ACTIVO (por si se había cerrado automáticamente)
  await prisma.prestamo.update({
    where: { id: prestamoId },
    data: { estado: 'ACTIVO' }
  })

  // 4. Recargar la página
  revalidatePath(`/prestamo/${prestamoId}`)
}

// ... (Mantén todo lo que ya tienes arriba: crearPrestamo, registrarPago, etc.)

// app/actions.ts

// --- 6. ELIMINAR PRÉSTAMO (VERSIÓN FUERTE) ---
export async function eliminarPrestamo(formData: FormData) {
  const prestamoId = Number(formData.get('prestamoId'))

  // 1. ELIMINAMOS EL BLOQUEO DE SEGURIDAD
  // (Antes revisábamos si había pagos, ahora lo saltamos para poder borrar errores)

  // 2. Borramos TODO en cascada dentro de una transacción
  // El orden es importante: Primero hijos (pagos/cuotas), luego el padre (préstamo)
  await prisma.$transaction([
    prisma.pago.deleteMany({ where: { prestamoId } }),   // Borra el historial de dinero
    prisma.cuota.deleteMany({ where: { prestamoId } }),  // Borra el cronograma
    prisma.prestamo.delete({ where: { id: prestamoId } }) // Borra la cabecera
  ])

  revalidatePath('/')
  redirect('/')
}
// --- 7. ACTUALIZAR PRÉSTAMO (EDICIÓN) ---
export async function actualizarPrestamo(formData: FormData) {
  const prestamoId = Number(formData.get('prestamoId'))
  const nombreCliente = formData.get('nombre') as string
  const nuevaFechaStr = formData.get('fechaInicio') as string

  const prestamo = await prisma.prestamo.findUnique({
    where: { id: prestamoId },
    include: { cuotas: true }
  })
  if (!prestamo) throw new Error("Préstamo no encontrado")

  // 1. Gestionar cambio de CLIENTE
  let nuevoClienteId = prestamo.clienteId
  if (nombreCliente) {
    const cliente = await prisma.cliente.findUnique({ where: { nombre: nombreCliente } })
    if (cliente) {
      nuevoClienteId = cliente.id
    } else {
      throw new Error("El cliente indicado no existe.")
    }
  }

  // 2. Gestionar cambio de FECHA
  if (nuevaFechaStr) {
    const nuevaFecha = new Date(nuevaFechaStr + 'T12:00:00')
    const hayPagos = prestamo.cuotas.some(c => c.estado === 'PAGADO')
    
    if (hayPagos) {
      if (nuevaFecha.getTime() !== prestamo.fechaInicio.getTime()) {
        throw new Error("No puedes cambiar la fecha si ya hay cuotas pagadas.")
      }
    } else {
      // Regenerar cronograma
      const { generarCronograma } = require('@/lib/finance')
      
      const { cuotas } = generarCronograma(
        Number(prestamo.montoCapital),
        Number(prestamo.interesPorcentaje),
        prestamo.frecuencia,
        prestamo.plazo,
        nuevaFecha
      )

      await prisma.$transaction([
        prisma.cuota.deleteMany({ where: { prestamoId } }),
        prisma.prestamo.update({
          where: { id: prestamoId },
          data: { 
            clienteId: nuevoClienteId,
            fechaInicio: nuevaFecha,
            cuotas: {
              create: cuotas.map((c: any) => ({
                numero: c.numero,
                fechaVencimiento: c.fechaVencimiento,
                montoEsperado: c.monto,
                estado: 'PENDIENTE'
              }))
            }
          }
        })
      ])
      
      revalidatePath(`/prestamo/${prestamoId}`)
      redirect(`/prestamo/${prestamoId}`)
      return
    }
  }

  // Si solo cambió cliente
  await prisma.prestamo.update({
    where: { id: prestamoId },
    data: { clienteId: nuevoClienteId }
  })

  revalidatePath(`/prestamo/${prestamoId}`)
  redirect(`/prestamo/${prestamoId}`)
}

// --- 8. CORREGIR MONTO PAGADO (Edición Manual) ---
export async function corregirPago(formData: FormData) {
  const cuotaId = Number(formData.get('cuotaId'))
  const nuevoMonto = Number(formData.get('nuevoMonto')) // El valor final correcto

  const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } })
  if (!cuota) throw new Error("Cuota no encontrada")

  const montoAnterior = Number(cuota.montoPagado)
  const diferencia = nuevoMonto - montoAnterior

  // Si no hubo cambios, no hacemos nada
  if (diferencia === 0) return

  // 1. Ajustar la CAJA (Registrar la corrección)
  await prisma.pago.create({
    data: {
      prestamoId: cuota.prestamoId,
      monto: diferencia, // Puede ser negativo (si restaste) o positivo (si sumaste)
      tipo: 'CORRECCION',
      nota: `Corrección manual cuota #${cuota.numero}: de ${montoAnterior} a ${nuevoMonto}`
    }
  })

  // 2. Actualizar la CUOTA
  const montoEsperado = Number(cuota.montoEsperado)
  // Damos un margen de 0.10 centimos por errores de redondeo
  const estaPagado = nuevoMonto >= (montoEsperado - 0.10)

  await prisma.cuota.update({
    where: { id: cuotaId },
    data: {
      montoPagado: nuevoMonto,
      estado: estaPagado ? 'PAGADO' : 'PENDIENTE'
    }
  })

  // 3. Si la cuota volvió a estar pendiente, asegurarnos que el préstamo esté ACTIVO
  if (!estaPagado) {
    await prisma.prestamo.update({
      where: { id: cuota.prestamoId },
      data: { estado: 'ACTIVO' }
    })
  }

  // 4. Verificar si ahora sí se terminó el préstamo (por si completó la última cuota)
  if (estaPagado) {
    const pendientes = await prisma.cuota.count({
      where: { 
        prestamoId: cuota.prestamoId,
        estado: { not: 'PAGADO' }
      }
    })
    if (pendientes === 0) {
      await prisma.prestamo.update({
        where: { id: cuota.prestamoId },
        data: { estado: 'FINALIZADO' }
      })
    }
  }

  revalidatePath(`/prestamo/${cuota.prestamoId}`)
  
}

// app/actions.ts

export async function agregarNota(formData: FormData) {
  const prestamoId = Number(formData.get('prestamoId'))
  const texto = formData.get('texto') as string

  if (!texto || texto.trim() === "") return;

  await prisma.nota.create({
    data: {
      prestamoId,
      texto
    }
  })

  revalidatePath(`/prestamo/${prestamoId}`)
}

// También agregamos una para BORRAR por si te equivocas
export async function eliminarNota(formData: FormData) {
  const notaId = Number(formData.get('notaId'))
  const prestamoId = Number(formData.get('prestamoId'))

  await prisma.nota.delete({ where: { id: notaId } })
  
  revalidatePath(`/prestamo/${prestamoId}`)
}

// Al final de app/actions.ts

export async function eliminarCliente(clienteId: number) {
  // 1. Verificar seguridad (que seas tú)
  const userId = await verificarSesion()

  // 2. Verificar que el cliente sea tuyo antes de borrarlo
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId }
  })

  // Si no existe o es de otro usuario (ej: de tu hermano), error.
  if (!cliente || cliente.usuarioId !== userId) {
    throw new Error("No tienes permiso para eliminar este cliente")
  }

  // 3. Borrar (Gracias al Paso 1, esto borra también sus préstamos)
  await prisma.cliente.delete({
    where: { id: clienteId }
  })

  // 4. Recargar la página para ver que desapareció
  revalidatePath('/')
}

// --- FUNCIÓN PARA BACKUP EN EXCEL (VERSIÓN MEJORADA) ---
export async function obtenerDatosParaBackup() {
  const userId = await verificarSesion()

  // 1. Extraer Clientes con todos sus Préstamos y Pagos anidados
  const clientesRaw = await prisma.cliente.findMany({
    where: { usuarioId: userId },
    include: {
      prestamos: {
        include: { pagos: true }
      }
    },
    orderBy: { nombre: 'asc' }
  })

  // 2. Crear un "Resumen de Cartera" para la primera pestaña del Excel
  const resumenClientes = clientesRaw.map(cliente => {
    let totalPrestado = 0
    let totalPagado = 0

    cliente.prestamos.forEach(p => {
      // Calculamos la deuda total de cada préstamo
      let diasPorCuota = 1
      if (p.frecuencia === 'SEMANAL') diasPorCuota = 7
      if (p.frecuencia === 'QUINCENAL') diasPorCuota = 15
      if (p.frecuencia === 'MENSUAL') diasPorCuota = 30

      const duracionDias = p.plazo * diasPorCuota
      const ganancia = Number(p.montoCapital) * (Number(p.interesPorcentaje) / 100) * (duracionDias / 30)
      const totalAPagar = Number(p.montoCapital) + ganancia

      totalPrestado += totalAPagar

      // Sumamos todo lo que ha pagado
      p.pagos.forEach(pago => {
        totalPagado += Number(pago.monto)
      })
    })

    return {
      "ID": cliente.id,
      "Cliente": cliente.nombre,
      "Teléfono": cliente.telefono || 'Sin número',
      "Préstamos Activos": cliente.prestamos.filter(p => p.estado === 'ACTIVO').length,
      "Total con Intereses (S/)": Number(totalPrestado.toFixed(2)),
      "Total Pagado (S/)": Number(totalPagado.toFixed(2)),
      "Deuda Pendiente (S/)": Number((totalPrestado - totalPagado).toFixed(2)),
      "Fecha Registro": cliente.createdAt.toLocaleDateString('es-PE')
    }
  })

  // 3. Extraer Préstamos (Con el nombre del cliente en vez de un ID feo)
  const prestamos = await prisma.prestamo.findMany({
    where: { cliente: { usuarioId: userId } },
    include: { cliente: true }, 
    orderBy: { fechaInicio: 'desc' }
  }).then(res => res.map(p => ({
    "Préstamo #": p.id,
    "Cliente": p.cliente.nombre,
    "Capital (S/)": Number(p.montoCapital),
    "Interés (%)": Number(p.interesPorcentaje),
    "Frecuencia": p.frecuencia,
    "Cuotas": p.plazo,
    "Estado": p.estado,
    "Fecha Inicio": p.fechaInicio.toLocaleDateString('es-PE')
  })))

  // 4. Extraer Historial de Pagos (Con nombre de cliente)
  const pagos = await prisma.pago.findMany({
    where: { prestamo: { cliente: { usuarioId: userId } } },
    include: { prestamo: { include: { cliente: true } } },
    orderBy: { fecha: 'desc' }
  }).then(res => res.map(p => ({
    "Pago #": p.id,
    "Cliente": p.prestamo.cliente.nombre,
    "Préstamo #": p.prestamoId,
    "Monto Pagado (S/)": Number(p.monto),
    "Fecha": p.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  })))

  // Retornamos la info ya masticada para el Excel
  return { 
    clientes: resumenClientes, 
    prestamos: prestamos, 
    pagos: pagos 
  }
}