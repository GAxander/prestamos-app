// prueba-db.ts
import { PrismaClient } from '@prisma/client'
import { generarCronograma } from './lib/finance'

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Iniciando prueba del sistema...")

  // 1. Crear un Cliente de prueba (Tu primer cliente ficticio)
  const cliente = await prisma.cliente.create({
    data: {
      nombre: "Juan Perez (El Vecino)",
      dni: "12345678",
      telefono: "999888777",
      direccion: "Calle Falsa 123"
    }
  })
  console.log(`✅ Cliente creado: ${cliente.nombre}`)

  // 2. Definir el Préstamo (Datos de ejemplo)
  const MONTO = 1000;
  const TASA = 10; // 10% mensual
  const MESES = 2;
  const FRECUENCIA = 'DIARIO';

  // 3. Calcular la matemática usando nuestra función
  const { cuotas, totalReal } = generarCronograma(MONTO, TASA, FRECUENCIA, MESES);

  console.log(`📊 Calculando: Prestamo de ${MONTO} a ${MESES} meses (${FRECUENCIA})`)
  console.log(`💰 Cuota diaria calculada: S/ ${cuotas[0].monto}`)
  console.log(`📈 Total a recuperar: S/ ${totalReal}`)

  // 4. Guardar todo en la Base de Datos (Préstamo + 60 Cuotas)
  const prestamo = await prisma.prestamo.create({
    data: {
      clienteId: cliente.id,
      montoCapital: MONTO,
      interesPorcentaje: TASA,
      frecuencia: FRECUENCIA,
      plazo: MESES,
      cuotas: {
        create: cuotas.map(c => ({
          numero: c.numero,
          fechaVencimiento: c.fechaVencimiento,
          montoEsperado: c.monto
        }))
      }
    }
  })

  console.log(`✅ Préstamo guardado con ID: ${prestamo.id}`)
  console.log("🎉 ¡Prueba exitosa! Revisa Prisma Studio para ver los datos.")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())