export const MAX_IMPORT_ROWS = 200
export const MAX_FILE_BYTES = 2 * 1024 * 1024

const aliases = {
  codigo: ['codigo','codigodoexemplar','codigodolivro','tombo','identificador'],
  titulo: ['titulo','nomedolivro','livro'],
  autor: ['autor','autora','autores'],
  genero: ['genero','categoria'],
  sinopse: ['sinopse','descricao','resumo'],
  ano: ['ano','anodepublicacao','publicacao'],
  capa: ['capa','urlcapa','urldacapa','linkdacapa']
}
const required = ['codigo','titulo','autor','genero']
const normalize = value => String(value ?? '').trim().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')

export function parseCsv(content) {
  const text = String(content ?? '').replace(/^\uFEFF/,'')
  const head = text.split(/\r?\n/,1)[0] || ''
  const delimiter = (head.match(/;/g)||[]).length > (head.match(/,/g)||[]).length ? ';' : ','
  const rows=[]
  let row=[],field='',quoted=false
  for(let i=0;i<text.length;i++){
    const c=text[i]
    if(c==='"'){
      if(quoted && text[i+1]==='"'){field+='"';i++}
      else quoted=!quoted
    } else if(c===delimiter && !quoted){
      row.push(field);field=''
    } else if((c==='\n'||c==='\r') && !quoted){
      if(c==='\r'&&text[i+1]==='\n')i++
      row.push(field);rows.push(row);row=[];field=''
    } else field+=c
  }
  if(quoted) throw new Error('CSV com aspas não fechadas. Corrija a planilha e tente novamente.')
  if(field.length||row.length){row.push(field);rows.push(row)}
  return rows
}

export function validateSpreadsheet(matrix) {
  if(!Array.isArray(matrix)||matrix.length<2) return {rows:[],errors:['A planilha precisa ter cabeçalho e pelo menos uma linha de livro.']}
  const headers=matrix[0].map(normalize)
  const index={}
  Object.entries(aliases).forEach(([key,options])=>{
    const found=headers.findIndex(h=>options.includes(h))
    if(found>=0)index[key]=found
  })
  const missing=required.filter(k=>index[k]===undefined)
  if(missing.length) return {rows:[],errors:['Colunas obrigatórias ausentes: '+missing.join(', ')+'. Use o modelo de planilha.']}
  const data=matrix.slice(1).filter(r=>Array.isArray(r)&&r.some(c=>String(c??'').trim()!==''))
  if(!data.length)return {rows:[],errors:['Nenhum livro encontrado na planilha.']}
  if(data.length>MAX_IMPORT_ROWS)return {rows:[],errors:['Importe no máximo '+MAX_IMPORT_ROWS+' exemplares por arquivo.']}
  const rows=[],errors=[],seen=new Map()
  for(let i=0;i<data.length;i++){
    const cells=data[i],cell=key=>index[key]===undefined?'':String(cells[index[key]]??'').trim()
    const row={codigo:cell('codigo'),titulo:cell('titulo'),autor:cell('autor'),
      genero:cell('genero'),sinopse:cell('sinopse'),ano:cell('ano'),capa:cell('capa')}
    const line=i+2
    if(!/^[0-9]{1,32}$/.test(row.codigo))errors.push('Linha '+line+': código deve conter de 1 a 32 números.')
    if(!row.titulo||row.titulo.length>200)errors.push('Linha '+line+': título obrigatório (até 200 caracteres).')
    if(!row.autor||row.autor.length>200)errors.push('Linha '+line+': autor obrigatório (até 200 caracteres).')
    if(!row.genero||row.genero.length>100)errors.push('Linha '+line+': gênero obrigatório (até 100 caracteres).')
    if(row.sinopse.length>2000)errors.push('Linha '+line+': sinopse muito longa.')
    if(row.ano&&(!/^[0-9]{1,4}$/.test(row.ano)||Number(row.ano)>2100))errors.push('Linha '+line+': ano inválido.')
    if(row.capa&&(row.capa.length>2000||!/^https?:\/\/\S+$/i.test(row.capa)))errors.push('Linha '+line+': capa precisa de URL http(s).')
    if(row.codigo){
      if(seen.has(row.codigo))errors.push('Linha '+line+': código repetido (linha '+seen.get(row.codigo)+').')
      else seen.set(row.codigo,line)
    }
    rows.push(row)
  }
  return {rows:errors.length?[]:rows,errors:errors.slice(0,20)}
}

export const spreadsheetExample = [
  'codigo;titulo;autor;genero;sinopse;ano;capa',
  '1001;Dom Casmurro;Machado de Assis;Romance;Literatura brasileira;1899;',
  '1002;O Pequeno Príncipe;Antoine de Saint-Exupéry;Ficção;História de um jovem príncipe;1943;'
].join('\r\n')
