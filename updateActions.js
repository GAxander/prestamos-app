const fs = require('fs')

let content = fs.readFileSync('app/actions.ts', 'utf-8')

// 1. Add CRUD CATEGORIAS at the top
if (!content.includes('export async function crearCategoria')) {
  const insertIndex = content.indexOf('export async function registro')
  content = content.slice(0, insertIndex) + `// --- CRUD CATEGORIAS ---
export async function crearCategoria(nombre: string, color?: string) {
  const userId = await verificarSesion()
  await prisma.categoria.create({
    data: { nombre, color: color || '#3b82f6', usuarioId: userId }
  })
  revalidatePath('/configuracion')
  revalidatePath('/')
}

export async function editarCategoria(id: number, nombre: string, color: string) {
  const userId = await verificarSesion()
  await prisma.categoria.update({
    where: { id, usuarioId: userId },
    data: { nombre, color }
  })
  revalidatePath('/configuracion')
  revalidatePath('/')
}

export async function eliminarCategoria(id: number) {
  const userId = await verificarSesion()
  let categoriaMio = await prisma.categoria.findFirst({
    where: { nombre: 'Mío', usuarioId: userId }
  })
  if(!categoriaMio) {
    categoriaMio = await prisma.categoria.create({ data: { nombre: 'Mío', color: '#3b82f6', usuarioId: userId }})
  }
  await prisma.prestamo.updateMany({
    where: { categoriaId: id, cliente: { usuarioId: userId } },
    data: { categoriaId: categoriaMio.id }
  })
  await prisma.categoria.delete({
    where: { id, usuarioId: userId }
  })
  revalidatePath('/configuracion')
  revalidatePath('/')
}

export async function obtenerCategorias() {
  const userId = await verificarSesion()
  return await prisma.categoria.findMany({ where: { usuarioId: userId }, orderBy: { id: 'asc' } })
}

` + content.slice(insertIndex)
}

// 2. Modify crearPrestamo variables
if (!content.includes("const categoriaId = formData.get('categoriaId')")) {
  content = content.replace(
    "const tipoMensual = formData.get('tipoMensual') as string || '30_DIAS'",
    "const tipoMensual = formData.get('tipoMensual') as string || '30_DIAS'\n  const categoriaId = formData.get('categoriaId') ? Number(formData.get('categoriaId')) : null"
  )
}

// 3. Modify crearPrestamo db insert
if (!content.includes("categoriaId: categoriaId,")) {
  content = content.replace(
    "moraDiaria: moraDiaria,\r\n      cuotas:",
    "moraDiaria: moraDiaria,\r\n      categoriaId: categoriaId,\r\n      cuotas:"
  ).replace(
    "moraDiaria: moraDiaria,\n      cuotas:",
    "moraDiaria: moraDiaria,\n      categoriaId: categoriaId,\n      cuotas:"
  )
}

// 4. Modify actualizarPrestamo variables
if (!content.includes("const tipoMensual = formData.get('tipoMensual') as string || 'FECHA_FIJA'\n  const categoriaId =")) {
  content = content.replace(
    "const tipoMensual = formData.get('tipoMensual') as string || 'FECHA_FIJA'",
    "const tipoMensual = formData.get('tipoMensual') as string || 'FECHA_FIJA'\n  const categoriaId = formData.get('categoriaId') ? Number(formData.get('categoriaId')) : null"
  )
}

// 5. Modify actualizarPrestamo db updates
content = content.replace(
  "data: { clienteId: clienteIdFinal }",
  "data: { clienteId: clienteIdFinal, categoriaId: categoriaId }"
)

content = content.replace(
  "moraDiaria: moraDiaria,\r\n          cuotas: { create: nuevasCuotas }",
  "moraDiaria: moraDiaria,\r\n          categoriaId: categoriaId,\r\n          cuotas: { create: nuevasCuotas }"
).replace(
  "moraDiaria: moraDiaria,\n          cuotas: { create: nuevasCuotas }",
  "moraDiaria: moraDiaria,\n          categoriaId: categoriaId,\n          cuotas: { create: nuevasCuotas }"
)

fs.writeFileSync('app/actions.ts', content)
console.log("Modificado app/actions.ts exitosamente")
