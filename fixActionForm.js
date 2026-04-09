const fs = require('fs')

// 1. Fix app/actions.ts
let actions = fs.readFileSync('app/actions.ts', 'utf-8')
const searchLiteral = `  const tipoMensual = formData.get('tipoMensual') as string || 'FECHA_FIJA'`
if (actions.includes(searchLiteral)) {
  actions = actions.replace(
    searchLiteral, 
    `  const tipoMensual = formData.get('tipoMensual') as string || 'FECHA_FIJA'\n  const categoriaIdStr = formData.get('categoriaId') as string\n  const categoriaId = categoriaIdStr ? Number(categoriaIdStr) : null`
  )
}
fs.writeFileSync('app/actions.ts', actions)

// 2. Fix components/FormularioEditarPrestamo.tsx
let formEdit = fs.readFileSync('components/FormularioEditarPrestamo.tsx', 'utf-8')
const searchEdit = `        <div className="space-y-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Condiciones Iniciales</h3>`

const categoryUI = `        <div className="space-y-2 relative mb-6">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block flex justify-between">
            <span>Categoría del Préstamo</span>
            <a href="/configuracion" target="_blank" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline">Añadir Nueva</a>
          </label>
          <select 
             name="categoriaId" 
             value={categoriaId} 
             onChange={e => setCategoriaId(Number(e.target.value) || '')}
             required
             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-bold cursor-pointer shadow-sm"
          >
             <option value="" disabled>-- Elige una categoría --</option>
             {categorias.map(cat => (
               <option key={cat.id} value={cat.id}>{cat.nombre}</option>
             ))}
          </select>
        </div>

        <div className="space-y-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Condiciones Iniciales</h3>`

if (formEdit.includes(`        <div className="space-y-5 pt-4 border-t border-slate-100">`)) {
  formEdit = formEdit.replace(searchEdit, categoryUI)
}

fs.writeFileSync('components/FormularioEditarPrestamo.tsx', formEdit)
console.log('Fixed both files')
