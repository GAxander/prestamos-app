import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuarios = await prisma.usuario.findMany()

  for (const usuario of usuarios) {
    let categoriaMio = await prisma.categoria.findFirst({
      where: {
        usuarioId: usuario.id,
        nombre: 'Mío'
      }
    })

    if (!categoriaMio) {
      categoriaMio = await prisma.categoria.create({
        data: {
          nombre: 'Mío',
          color: '#3b82f6',
          usuarioId: usuario.id
        }
      })
    }

    const prestamosSinCategoria = await prisma.prestamo.findMany({
      where: {
        cliente: { usuarioId: usuario.id },
        categoriaId: null
      }
    })

    if (prestamosSinCategoria.length > 0) {
      await prisma.prestamo.updateMany({
        where: {
          id: { in: prestamosSinCategoria.map(p => p.id) }
        },
        data: {
          categoriaId: categoriaMio.id
        }
      })
      console.log(`Asignados ${prestamosSinCategoria.length} prestamos a la categoria Mío para el usuario ${usuario.username}`)
    }
  }

  console.log('Seed terminado')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
