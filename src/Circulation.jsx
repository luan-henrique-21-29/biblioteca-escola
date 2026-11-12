import React, {useState} from 'react'
import {BookOpen,Check,Printer,ClipboardList,CalendarDays,ShieldCheck,Clock3} from 'lucide-react'
const conditions=['novo','bom','regular','danificado']
const conditionLabel={novo:'Novo',bom:'Bom',regular:'Regular',danificado:'Danificado'}
const eventNames={approved:'Pedido aprovado',pickup:'Retirada confirmada',renewed:'Empréstimo renovado',returned:'Devolução registrada'}
const date=v=>v?new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—'

export function ConditionForm({mode,loan,title,copyCode,busy,onSubmit}){
 const [condition,setCondition]=useState('bom')
 const [notes,setNotes]=useState('')
 const pickup=mode==='pickup'
 return <form className="condition-form" onSubmit={e=>{e.preventDefault();onSubmit(condition,notes)}}>
   <p><BookOpen size={17}/> <strong>{title}</strong> · Exemplar nº {copyCode||'—'}</p>
   <p className="condition-hint">{pickup?'Confira o livro pessoalmente e registre o estado ANTES de entregá-lo ao aluno. A data de devolução começará a contar a partir da retirada.':'Confira o livro físico antes de registrar a devolução. O histórico guardará quem recebeu e qual era o estado do exemplar.'}</p>
   <label className="field"><span>Estado do livro na {pickup?'retirada':'devolução'} *</span><select required value={condition} onChange={e=>setCondition(e.target.value)}>{conditions.map(c=><option key={c} value={c}>{conditionLabel[c]}</option>)}</select></label>
   <label className="field"><span>Observações (opcional)</span><textarea maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: capa um pouco amassada, páginas intactas..." rows={3}/></label>
   <button className="btn btn--primary" type="submit" disabled={busy}><Check size={17}/> {pickup?'Confirmar entrega física':'Confirmar devolução física'}</button>
 </form>
}

export function LoanReceipt({loan,book,reader,copyCode,events=[]}){
 return <div className="receipt-root">
   <div className="receipt-toolbar"><p>Comprovante digital de movimentação. Para guardar, use <strong>Imprimir → Salvar como PDF</strong>.</p><button type="button" className="btn btn--primary" onClick={()=>window.print()}><Printer size={17}/> Imprimir / salvar PDF</button></div>
   <div className="receipt-page">
     <div className="receipt-header"><div className="receipt-symbol"><BookOpen size={30}/></div><div><strong>Biblioteca Joaquim</strong><span>Colégio Prefeito Joaquim da Silva Mafra · Guaratuba, PR</span></div></div>
     <h2>Comprovante de {loan.returned_at?'devolução':loan.picked_up_at?'retirada':'aprovação'}</h2>
     <span className="receipt-code">Registro nº {loan.id}</span>
     <div className="receipt-data">
       <div><small>Livro</small><strong>{book?.title||'Livro'}</strong></div>
       <div><small>Autor</small><strong>{book?.author||'—'}</strong></div>
       <div><small>Leitor</small><strong>{reader?.full_name||'Seu empréstimo'}</strong></div>
       <div><small>Turma</small><strong>{reader?.classroom||'—'}</strong></div>
       <div><small>Código numérico do exemplar</small><strong>{copyCode||'—'}</strong></div>
       <div><small>Data da aprovação</small><strong>{date(loan.approved_at)}</strong></div>
       <div><small>Entrega física</small><strong>{date(loan.picked_up_at)}</strong></div>
       <div><small>Prazo de devolução</small><strong>{date(loan.due_at)}</strong></div>
       <div><small>Devolução realizada</small><strong>{date(loan.returned_at)}</strong></div>
       <div><small>Estado na retirada</small><strong>{conditionLabel[loan.condition_out]||'—'}</strong></div>
       <div><small>Estado na devolução</small><strong>{conditionLabel[loan.condition_in]||'—'}</strong></div>
     </div>
     {(loan.pickup_notes||loan.return_notes)&&<div className="receipt-notes">
       {loan.pickup_notes&&<p><strong>Observação na retirada:</strong> {loan.pickup_notes}</p>}
       {loan.return_notes&&<p><strong>Observação na devolução:</strong> {loan.return_notes}</p>}
     </div>}
     <h3>Histórico de movimentações</h3>
     {events.length?<ol className="receipt-history">{events.map(ev=><li key={ev.id}><strong>{eventNames[ev.event_type]||ev.event_type}</strong><span>{date(ev.created_at)}{ev.condition?' · Estado: '+conditionLabel[ev.condition]:''}</span>{ev.notes&&<small>{ev.notes}</small>}</li>)}</ol>:<p className="receipt-empty">Histórico anterior à ativação desta funcionalidade.</p>}
     <p className="receipt-disclaimer">Documento informativo gerado pelo sistema da biblioteca. Não substitui a conferência presencial do exemplar.</p>
   </div>
 </div>
}
