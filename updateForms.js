const fs = require('fs')

function updateFormularioPrestamo() {
  let content = fs.readFileSync('components/FormularioPrestamo.tsx', 'utf-8')
  
  if (!content.includes('categorias?: any[]')) {
    content = content.replace(
      /type Props = \{[\s\S]*?\n\}/,
      `type Props = {
  clientesExistentes?: ClienteCorto[]
  categorias?: any[]
}`
    )
  }

  if (!content.includes('export default function FormularioPrestamo({ clientesExistentes = [], categorias = [] }: Props)')) {
    content = content.replace(
      /export default function FormularioPrestamo\(\{ clientesExistentes = \[\] \}\: Props\) \{/,
      `export default function FormularioPrestamo({ clientesExistentes = [], categorias = [] }: Props) {
  const [categoriaId, setCategoriaId] = useState<number | ''>(categorias.find(c => c.nombre === 'Mío')?.id || '')`
    )
  }

  // Create the category UI block
  const categoryUI = `
      {/* 1.5 CATEGORIA */}
      <div className="glass-panel p-6 md:p-8 bg-white/60">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Categoría del Préstamo
        </h3>
        <div>
           <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
             <span>Seleccionar Categoría</span>
             <a href="/configuracion" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline">Gestionar</a>
           </label>
           <select 
              name="categoriaId" 
              value={categoriaId} 
              onChange={e => setCategoriaId(Number(e.target.value))}
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all text-slate-900 font-medium cursor-pointer shadow-sm"
           >
              <option value="" disabled>-- Elige una categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
           </select>
        </div>
      </div>
`

  if (!content.includes('1.5 CATEGORIA')) {
    content = content.replace(
      /\{\/\* 2\. PRÉSTAMO \*\/\}/,
      categoryUI + '\n      {/* 2. PRÉSTAMO */}'
    )
  }

  fs.writeFileSync('components/FormularioPrestamo.tsx', content)
}

function updateFormularioEditarPrestamo() {
  let content = fs.readFileSync('components/FormularioEditarPrestamo.tsx', 'utf-8')
  
  if (!content.includes('categorias?: any[]')) {
    content = content.replace(
      /type Props = \{[\s\S]*?\n\}/,
      `type Props = {
  prestamo: any
  clientes: any[]
  categorias?: any[]
}`
    )
  }

  if (!content.includes('export default function FormularioEditarPrestamo({ prestamo, clientes, categorias = [] }: Props)')) {
    content = content.replace(
      /export default function FormularioEditarPrestamo\(\{ prestamo, clientes \}\: Props\) \{/,
      `export default function FormularioEditarPrestamo({ prestamo, clientes, categorias = [] }: Props) {
  const [categoriaId, setCategoriaId] = useState<number | ''>(prestamo.categoriaId || '')`
    )
  }

  const categoryUI = `
      {/* 1.5 CATEGORIA */}
      <div className="bg-slate-50 p-4 border-b border-slate-100">
         <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
         <select 
            name="categoriaId" 
            value={categoriaId} 
            onChange={e => setCategoriaId(Number(e.target.value))}
            required
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium cursor-pointer"
         >
            <option value="" disabled>-- Elige una categoría --</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
         </select>
      </div>
`

  if (!content.includes('1.5 CATEGORIA')) {
    content = content.replace(
      /<div className="bg-slate-50 p-4 border-b border-slate-100">\s*<label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Monto \(S\/\)/,
      categoryUI + '\n      <div className="bg-slate-50 p-4 border-b border-slate-100">\n         <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Monto (S/)'
    )
  }

  fs.writeFileSync('components/FormularioEditarPrestamo.tsx', content)
}

updateFormularioPrestamo()
updateFormularioEditarPrestamo()
console.log("Formularios actualizados exitosamente")
