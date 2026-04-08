import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    // 1. Configurar Nodemailer (usando variables de entorno seguras)
    // El usuario debe colocar esto en su .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Contraseña de aplicación
      },
    })

    // 2. Buscar usuarios candidatos a Backups
    const usuarios = await prisma.usuario.findMany({
      where: {
        emailDestino: { not: null },
        frecuenciaBackup: { not: 'NUNCA' }
      }
    })

    let enviados = 0

    for (const usuario of usuarios) {
      if (!usuario.emailDestino) continue;

      // Evaluar frecuencia temporal
      const ahora = new Date()
      const ultimo = usuario.ultimoBackupEnviado

      let tocaEnviar = false

      if (!ultimo) {
        tocaEnviar = true
      } else {
        // En Javascript getDay() da 0 para Domingo, 1 para Lunes. Lo ajustamos: 1 Lunes a 7 Domingo.
        const diaSemanaActual = ahora.getDay() === 0 ? 7 : ahora.getDay()
        const diaMesActual = ahora.getDate()
        
        const ultimoIso = ultimo.toISOString().split('T')[0]
        const hoyIso = ahora.toISOString().split('T')[0]
        const seEnvioHoy = ultimoIso === hoyIso

        if (!seEnvioHoy) {
          if (usuario.frecuenciaBackup === 'DIARIO') {
            tocaEnviar = true
          } else if (usuario.frecuenciaBackup === 'SEMANAL' && diaSemanaActual === (usuario.diaSemanaBackup || 1)) {
            tocaEnviar = true
          } else if (usuario.frecuenciaBackup === 'MENSUAL' && diaMesActual === (usuario.diaMesBackup || 1)) {
            tocaEnviar = true
          }
        }
      }

      if (tocaEnviar) {
        // --- EXTRAER DATOS (Misma lógica que el dashboard, adaptada para backend) ---
        const clientesRaw = await prisma.cliente.findMany({
          where: { usuarioId: usuario.id },
          include: {
            prestamos: {
              include: { 
                pagos: { where: { tipo: { not: 'ANULACION' } } },
                cuotas: { where: { estado: 'PENDIENTE' } }
              }
            }
          },
          orderBy: { nombre: 'asc' }
        })

        const resumenClientes = clientesRaw.map(cliente => {
          let totalPrestado = 0
          let totalPagado = 0
          let deudaPendienteExacta = 0

          cliente.prestamos.forEach(p => {
            let diasPorCuota = 1
            if (p.frecuencia === 'SEMANAL') diasPorCuota = 7
            if (p.frecuencia === 'QUINCENAL') diasPorCuota = 15
            if (p.frecuencia === 'MENSUAL') diasPorCuota = 30

            const duracionDias = p.plazo * diasPorCuota
            const ganancia = Number(p.montoCapital) * (Number(p.interesPorcentaje) / 100) * (duracionDias / 30)
            const totalAPagar = Number(p.montoCapital) + ganancia

            totalPrestado += totalAPagar
            p.pagos.forEach(pago => totalPagado += Number(pago.monto))

            if (p.estado === 'ACTIVO' || p.estado === 'PENDIENTE') {
              p.cuotas.forEach(cuota => {
                 deudaPendienteExacta += (Number(cuota.montoEsperado) - Number(cuota.montoPagado))
              })
            }
          })

          return {
            "ID": cliente.id,
            "Cliente": cliente.nombre,
            "Teléfono": cliente.telefono || 'Sin número',
            "Préstamos Activos": cliente.prestamos.filter(p => p.estado === 'ACTIVO').length,
            "Total Histórico (S/)": Number(totalPrestado.toFixed(2)),
            "Total Pagado (S/)": Number(totalPagado.toFixed(2)),
            "Deuda Pendiente (S/)": Number(deudaPendienteExacta.toFixed(2)),
            "Fecha Registro": cliente.createdAt.toLocaleDateString('es-PE')
          }
        })

        const prestamos = await prisma.prestamo.findMany({
          where: { cliente: { usuarioId: usuario.id } },
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
          "Fecha Inicio": p.fechaInicio.toLocaleDateString('es-PE', { timeZone: 'UTC' })
        })))

        const pagos = await prisma.pago.findMany({
          where: { prestamo: { cliente: { usuarioId: usuario.id } } },
          include: { prestamo: { include: { cliente: true } } },
          orderBy: { fecha: 'desc' }
        }).then(res => res.map(p => ({
          "Pago #": p.id,
          "Cliente": p.prestamo.cliente.nombre,
          "Préstamo #": p.prestamoId,
          "Monto Pagado (S/)": Number(p.monto),
          "Fecha": p.fecha.toLocaleDateString('es-PE', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })
        })))

        // --- CREAR ARCHIVO EXCEL ---
        if (!resumenClientes.length && !prestamos.length && !pagos.length) {
            // Usuario sin datos, no enviamos spam
            continue;
        }

        const wb = XLSX.utils.book_new()
        const wsClientes = XLSX.utils.json_to_sheet(resumenClientes.length ? resumenClientes : [{ Vacio: "Sin datos" }])
        const wsPrestamos = XLSX.utils.json_to_sheet(prestamos.length ? prestamos : [{ Vacio: "Sin datos" }])
        const wsPagos = XLSX.utils.json_to_sheet(pagos.length ? pagos : [{ Vacio: "Sin datos" }])
        
        XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes")
        XLSX.utils.book_append_sheet(wb, wsPrestamos, "Préstamos")
        XLSX.utils.book_append_sheet(wb, wsPagos, "Pagos")

        // Generar Buffer del archivo de Excel
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // --- ENVIAR CORREO ---
        const fechaStr = ahora.toISOString().split('T')[0]
        
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail({
            from: `"Sistema de Préstamos" <${process.env.SMTP_USER}>`,
            to: usuario.emailDestino,
            subject: `📊 Respaldo Automático - ${fechaStr}`,
            text: `Hola,\n\nAdjunto encontrarás el respaldo de tu sistema de gestión de préstamos, programado para tu cuenta.\n\nFrecuencia configurada: ${usuario.frecuenciaBackup}\n\nUn saludo.`,
            attachments: [
                {
                filename: `Backup_Prestamos_${fechaStr}.xlsx`,
                content: excelBuffer
                }
            ]
            })
            
            // Actualizar Timestamp
            await prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimoBackupEnviado: ahora }
            })

            enviados++
        }
      }
    }

    return NextResponse.json({ success: true, respaldosEnviados: enviados })

  } catch (error: any) {
    console.error("Error en cron backup:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
