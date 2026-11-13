import React,{useEffect,useMemo,useState} from 'react'
import {ArrowRight,ArrowUpRight,BookOpen,ExternalLink,Search,X} from 'lucide-react'
import {PUBLIC_READINGS,LEIA_PARANA_URL} from './readingCatalog.js'

const normalized=value=>String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('pt-BR')

function FullTextReader({onClose}) {
  const [status,setStatus]=useState('loading'),[paragraphs,setParagraphs]=useState([])
  useEffect(()=>{
    let active=true
    const controller=new AbortController()
    const api='https://pt.wikisource.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&page=A_Cartomante&origin=*'
    fetch(api,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('Servidor não respondeu');return r.json()})
      .then(data=>{
        const documentText=new DOMParser().parseFromString(data?.parse?.text||'','text/html')
        const main=documentText.querySelector('.mw-parser-output')||documentText.body
        const lines=[...main.querySelectorAll('p')].map(el=>el.textContent?.trim()).filter(t=>t&&t.length>25)
        if(lines.join('').length<1000)throw new Error('Leitura indisponível')
        if(active){setParagraphs(lines);setStatus('ready')}
      })
      .catch(e=>{if(active&&e.name!=='AbortError')setStatus('error')})
    return()=>{active=false;controller.abort()}
  },[])
  useEffect(()=>{
    const onKey=e=>{if(e.key==='Escape')onClose()}
    document.addEventListener('keydown',onKey)
    return()=>document.removeEventListener('keydown',onKey)
  },[onClose])
  return <div className="reader-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="reader-dialog" role="dialog" aria-modal="true" aria-label="Ler A Cartomante">
      <header className="reader-dialog-head"><div><small>LEITURA NO SITE · WIKISOURCE</small><h2>A Cartomante</h2><span>Machado de Assis · 1884</span></div><button className="reader-close" type="button" onClick={onClose} aria-label="Fechar leitura"><X size={20}/></button></header>
      <main className="reader-prose">{status==='loading'?<p>Preparando o conto...</p>:status==='error'?<p>Não foi possível carregar o texto agora. Abra a obra na fonte original pelo link abaixo.</p>:paragraphs.map((p,i)=><p key={i}>{p}</p>)}</main>
      <footer className="reader-dialog-foot"><small>Fonte: Wikisource · obra em domínio público. Texto carregado da fonte original.</small><a href="https://pt.wikisource.org/wiki/A_Cartomante" target="_blank" rel="noopener noreferrer">Ler no Wikisource <ArrowUpRight size={15}/></a></footer>
    </div>
  </div>
}

export default function ReadingShelf({books,compact=false}) {
  const [category,setCategory]=useState('livre'),[search,setSearch]=useState(''),[readerOpen,setReaderOpen]=useState(false)
  const allBooks=books?.length?books:PUBLIC_READINGS
  const list=useMemo(()=>allBooks.filter(b=>(category==='livre'?b.platform==='Wikisource':b.platform==='Leia Paraná')&&normalized([b.title,b.author].join(' ')).includes(normalized(search.trim()))),[allBooks,category,search])
  return <section className={'reading-shelf '+(compact?'reading-shelf--compact':'')} aria-label="Livros digitais para ler">
    <div className="reading-shelf-head"><div><span className="eyebrow">ESTANTE DIGITAL</span><h2>Livros para ler de verdade</h2><p>Clássicos gratuitos em domínio público e acesso à plataforma oficial Leia Paraná.</p></div><span className="shelf-mini-stamp"><BookOpen size={17}/> Leitura aberta</span></div>
    <div className="reading-controls"><div className="reading-tabs" role="group" aria-label="Tipo de leitura"><button type="button" className={category==='livre'?'active':''} onClick={()=>setCategory('livre')}>Ler gratuitamente</button><button type="button" className={category==='leia'?'active':''} onClick={()=>setCategory('leia')}>Leia Paraná</button></div><label className="reading-search"><Search size={17}/><input aria-label="Pesquisar livros digitais" placeholder="Buscar título ou autor" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
    {category==='leia'&&<div className="reading-platform-note"><strong>Leitura na plataforma da Secretaria da Educação.</strong> Entre com sua conta @escola no <a href={LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer">Leia Paraná <ExternalLink size={12}/></a>. Os títulos disponíveis variam conforme a turma e as licenças.</div>}
    <div className="reading-grid">{list.map((book,i)=><article className="reading-card" key={book.id}>
      <div className={'reading-cover reading-cover--'+(i%6)} aria-hidden="true"><span className="reading-cover-top">BIBLIOTECA JOAQUIM</span><BookOpen size={24}/><strong>{book.title}</strong><small>{book.author}</small><span className="reading-cover-lines"/></div>
      <div className="reading-card-copy"><span className="reading-kicker">{book.platform==='Wikisource'?'DOMÍNIO PÚBLICO':'LEIA PARANÁ'}</span><h3>{book.title}</h3><p className="reading-author">{book.author}</p><p className="reading-description">{book.note}</p><div className="reading-card-actions">{Number(book.id)===104&&book.platform==='Wikisource'&&<button type="button" className="reading-action-primary" onClick={()=>setReaderOpen(true)}>Ler aqui <ArrowRight size={15}/></button>}<a href={book.access_url} target="_blank" rel="noopener noreferrer" className={Number(book.id)===104?'reading-action-secondary':'reading-action-primary'}>{book.platform==='Wikisource'?'Abrir livro':'Acessar Leia Paraná'} <ArrowUpRight size={15}/></a></div></div>
    </article>)}</div>
    {!list.length&&<div className="reading-empty">{category==='leia'&&!allBooks.some(b=>b.platform==='Leia Paraná')?<><p>Consulte as obras disponíveis na plataforma oficial.</p><a className="btn btn--primary" href={LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer">Abrir Leia Paraná <ArrowUpRight size={15}/></a></>:<p>Nenhum livro encontrado. Tente outro título ou autor.</p>}</div>}
    <p className="reading-footnote">Os livros digitais não são exemplares físicos da escola. As obras do Wikisource estão disponíveis gratuitamente; o Leia Paraná exige acesso autorizado da rede estadual.</p>
    {readerOpen&&<FullTextReader onClose={()=>setReaderOpen(false)}/>}
  </section>
}
