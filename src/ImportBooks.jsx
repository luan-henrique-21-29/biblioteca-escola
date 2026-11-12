import React, { useState } from 'react'
import { FileSpreadsheet, Upload, Download, AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react'
import { MAX_FILE_BYTES, parseCsv, spreadsheetExample, validateSpreadsheet } from './importUtils.js'

export default function ImportBooks({ onImport, busy }) {
  const [rows,setRows]=useState([])
  const [name,setName]=useState('')
  const [errors,setErrors]=useState([])
  const [reading,setReading]=useState(false)
  const [done,setDone]=useState(false)

  async function chooseFile(e) {
    const file=e.target.files?.[0]
    setRows([]);setErrors([]);setDone(false);setName(file?.name||'')
    if(!file)return
    if(file.size>MAX_FILE_BYTES){setErrors(['O arquivo deve ter no máximo 2 MB.']);return}
    setReading(true)
    try{
      let matrix
      if(/\.csv$/i.test(file.name)){
        matrix=parseCsv(await file.text())
      }else if(/\.xlsx$/i.test(file.name)){
        const { readSheet }=await import('read-excel-file/browser')
        matrix=await readSheet(file)
      }else throw new Error('Escolha um arquivo .xlsx (Excel) ou .csv.')
      const parsed=validateSpreadsheet(matrix)
      setRows(parsed.rows);setErrors(parsed.errors)
    }catch(err){setErrors([err?.message||'Não foi possível ler a planilha.'])}
    finally{setReading(false)}
  }
  function downloadExample(){
    const blob=new Blob(['\uFEFF'+spreadsheetExample],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url;a.download='modelo-biblioteca-joaquim.csv';document.body.appendChild(a);a.click();a.remove()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  async function submit(e){
    e.preventDefault()
    if(!rows.length||busy||reading)return
    const ok=await onImport(rows)
    if(ok){setDone(true);setRows([]);setName('')}
  }
  return <div className="import-panel">
    <div className="import-intro"><FileSpreadsheet size={32}/><div>
      <h3>Adicionar vários livros de uma vez</h3>
      <p>Importe uma planilha Excel (.xlsx) ou CSV. Cada linha representa um exemplar com código numérico único.</p>
    </div></div>
    <button type="button" onClick={downloadExample} className="btn btn--outline"><Download size={16}/> Baixar modelo CSV</button>
    <label className="import-drop">
      <Upload size={26}/>
      <strong>{name||'Selecionar planilha'}</strong>
      <span>Arquivo .xlsx ou .csv · até 2 MB · máximo de 200 exemplares</span>
      <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} disabled={reading||busy}/>
    </label>
    <p className="helper-text">Colunas obrigatórias: <strong>codigo, titulo, autor, genero</strong>. Opcionais: sinopse, ano, capa. Títulos com o mesmo nome e autor ganham novos exemplares, sem duplicar o cadastro do livro.</p>
    {reading&&<p className="loading-inline"><LoaderCircle size={17} className="spin"/> Lendo planilha...</p>}
    {errors.length>0&&<div className="alert alert--error import-errors"><AlertTriangle size={19}/><div><strong>Corrija a planilha antes de importar:</strong>{errors.map((error,i)=><p key={i}>{error}</p>)}</div></div>}
    {done&&<p className="alert alert--ok"><CheckCircle2 size={19}/> Importação concluída.</p>}
    {rows.length>0&&<form onSubmit={submit}>
      <div className="import-preview-header"><h3>Prévia da importação</h3><strong>{rows.length} exemplar(es)</strong></div>
      <div className="table-wrap"><table className="import-table"><thead><tr><th>Código</th><th>Livro</th><th>Autor</th><th>Gênero</th><th>Ano</th></tr></thead><tbody>{rows.slice(0,8).map((r,i)=><tr key={i}><td>{r.codigo}</td><td><strong>{r.titulo}</strong></td><td>{r.autor}</td><td>{r.genero}</td><td>{r.ano||'—'}</td></tr>)}</tbody></table></div>
      {rows.length>8&&<p className="helper-text">Exibindo 8 de {rows.length} linhas. Todas as linhas válidas serão importadas.</p>}
      <p className="helper-text">A importação é transacional: se houver código duplicado no banco, nenhum livro deste arquivo será gravado.</p>
      <button className="btn btn--primary import-submit" disabled={busy||reading} type="submit">{busy?<LoaderCircle className="spin" size={17}/>:<Upload size={17}/>} Confirmar importação de {rows.length} exemplares</button>
    </form>}
  </div>
}
