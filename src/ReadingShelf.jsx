import React,{useEffect,useMemo,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,BookMarked,ChevronLeft,ChevronRight,ExternalLink,Info,LibraryBig,Search,X} from 'lucide-react'
import {PUBLIC_READINGS,LEIA_PARANA_URL,NORMALIZE_TITLE,isLeia,urlForBook} from './readingCatalog.js'

function IllustratedCover({book,large=false}) {
  const variant=(Number(book.id)||0)%6
  return <div className={'story-cover story-cover--'+variant+(large?' story-cover--large':'')} aria-label={'Capa ilustrativa de '+book.title}>
    <span className="story-cover-imprint">BIBLIOTECA JOAQUIM</span>
    <span className="story-cover-art" aria-hidden="true"><span/><span/><BookOpen size={large?39:24}/></span>
    <div className="story-cover-copy"><strong>{book.title}</strong><span>{book.author}</span></div>
    <span className="story-cover-bottom">EDIÇÃO ILUSTRATIVA</span>
  </div>
}

function BookDetails({book,onClose,onChoosePhysical,physicalBooks=[],inventory=[],onReadHere}) {
  const closeRef=useRef(null)
  const physical=physicalBooks.find(b=>NORMALIZE_TITLE(b.title)===NORMALIZE_TITLE(book.title))
  const physicalCount=physical?Number(inventory.find(item=>item.book_id===physical.id)?.total||0):0
  const freeCount=physical?Number(inventory.find(item=>item.book_id===physical.id)?.free||0):0
  const hasCopy=Boolean(physical&&physicalCount>0&&onChoosePhysical)
  const isPortal=isLeia(book)
  const mainUrl=urlForBook(book)
  useEffect(()=>{
    const oldOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    closeRef.current?.focus()
    const onKey=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',onKey)
    return()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',onKey)}
  },[onClose])
  return <div className="book-sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="book-sheet" role="dialog" aria-modal="true" aria-label={'Ficha do livro: '+book.title}>
      <button type="button" className="book-sheet-close" aria-label="Fechar ficha do livro" onClick={onClose} ref={closeRef}><X size={20}/></button>
      <div className="book-sheet-cover-panel"><IllustratedCover book={book} large/><small>Capa ilustrativa do projeto. Não é a arte original de uma edição.</small></div>
      <div className="book-sheet-content">
        <span className="book-sheet-eyebrow">BIBLIOTECA JOAQUIM · FICHA DE LEITURA</span>
        <h2>{book.title}</h2>
        <p className="book-sheet-subtitle">{book.author}</p>
        <dl className="book-sheet-facts">
          <div><dt>Gênero</dt><dd>{book.genre||'Não informado'}</dd></div>
          <div><dt>Ano da obra</dt><dd>{book.published_year||'Não informado'}</dd></div>
          <div><dt>Fonte digital</dt><dd>{book.platform}</dd></div>
        </dl>
        <div className="book-sheet-synopsis"><h3>Sinopse</h3><p>{book.synopsis||book.note||'Sinopse ainda não cadastrada para esta obra.'}</p></div>
        <h3 className="book-sheet-choose-title">Como você quer ler?</h3>
        <div className="book-sheet-choices">
          <button type="button" className="book-format-option" disabled={!hasCopy} onClick={()=>{if(hasCopy){onClose();onChoosePhysical(physical)}}}>
            <LibraryBig size={21}/><strong>Livro físico</strong>
            <small>{hasCopy?(freeCount>0?freeCount+' exemplar(es) disponível(is)':'Exemplar cadastrado · consultar fila'):'Nenhum exemplar físico cadastrado'}</small>
          </button>
          <a className="book-format-option book-format-option--digital" href={LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer">
            <BookOpen size={21}/><strong>{isPortal?'Ler no Leia Paraná':'Consultar no Leia Paraná'}</strong>
            <small>{isPortal?'Abre a plataforma oficial; procure o título na sua turma':'Disponibilidade desta obra não confirmada na plataforma'}</small>
            <ArrowUpRight className="book-format-arrow" size={17}/>
          </a>
        </div>
        {!isPortal&&mainUrl&&<div className="book-sheet-extra"><a href={mainUrl} target="_blank" rel="noopener noreferrer">Ler gratuitamente no Wikisource <ArrowUpRight size={15}/></a>{Number(book.id)===104&&<button type="button" onClick={()=>{onClose();onReadHere()}}>Ler o conto aqui <ArrowRight size={15}/></button>}</div>}
        <p className="book-sheet-disclaimer">Os links do Leia Paraná levam ao portal oficial. A leitura requer conta @escola e a obra precisa estar disponível no Clube de Leitura. A biblioteca física só mostra exemplares realmente registrados.</p>
      </div>
    </section>
  </div>
}

function ReadingRow({title,subtitle,books,onOpen}) {
  const railRef=useRef(null)
  if(!books.length)return null
  const move=direction=>{
    const node=railRef.current
    if(!node)return
    node.scrollBy({left:direction*Math.max(280,node.clientWidth*.76),behavior:'smooth'})
  }
  return <section className="story-row" aria-label={title}>
    <div className="story-row-header"><div><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="story-row-nav"><button type="button" onClick={()=>move(-1)} aria-label={'Voltar fileira '+title}><ChevronLeft size={19}/></button><button type="button" onClick={()=>move(1)} aria-label={'Avançar fileira '+title}><ChevronRight size={19}/></button></div>
    </div>
    <div className="story-rail" ref={railRef}>
      {books.map(book=><article className="story-tile" key={book.platform+'-'+book.id}>
        <button type="button" className="story-cover-button" onClick={()=>onOpen(book)} aria-label={'Abrir capa e ficha de '+book.title}>
          <IllustratedCover book={book}/>
          <span className="story-cover-overlay"><Info size={16}/> Ver ficha e capa</span>
        </button>
        <div className="story-tile-meta"><span className="story-tile-kicker">{isLeia(book)?'LEIA PARANÁ':'DOMÍNIO PÚBLICO'}</span><h4>{book.title}</h4><p>{book.author}</p><div className="story-tile-actions">
          <button type="button" className="story-detail-button" onClick={()=>onOpen(book)}><Info size={14}/> Informações</button>
          <a className="story-read-button" href={urlForBook(book)||LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer">{isLeia(book)?'Ler no Leia Paraná':'Ler grátis'} <ArrowUpRight size={15}/></a>
        </div></div>
      </article>)}
    </div>
  </section>
}

function FullTextReader({onClose}) {
  const [status,setStatus]=useState('loading'),[paragraphs,setParagraphs]=useState([])
  useEffect(()=>{
    let active=true
    const controller=new AbortController()
    const api='https://pt.wikisource.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&page=A_Cartomante&origin=*'
    fetch(api,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('Servidor não respondeu');return r.json()})
      .then(data=>{
        const html=new DOMParser().parseFromString(data?.parse?.text||'','text/html')
        const main=html.querySelector('.mw-parser-output')||html.body
        const lines=[...main.querySelectorAll('p')].map(el=>el.textContent?.trim()).filter(t=>t&&t.length>25)
        if(lines.join('').length<1000)throw new Error('Leitura indisponível')
        if(active){setParagraphs(lines);setStatus('ready')}
      })
      .catch(e=>{if(active&&e.name!=='AbortError')setStatus('error')})
    return()=>{active=false;controller.abort()}
  },[])
  useEffect(()=>{
    const oldOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const onKey=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',onKey)
    return()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',onKey)}
  },[onClose])
  return <div className="reader-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="reader-dialog" role="dialog" aria-modal="true" aria-label="Ler A Cartomante">
      <header className="reader-dialog-head"><div><small>LEITURA NO SITE · WIKISOURCE</small><h2>A Cartomante</h2><span>Machado de Assis · 1884</span></div><button className="reader-close" type="button" onClick={onClose} aria-label="Fechar leitura"><X size={20}/></button></header>
      <main className="reader-prose">{status==='loading'?<p>Preparando o conto...</p>:status==='error'?<p>Não foi possível carregar o texto agora. Abra a obra na fonte original pelo link abaixo.</p>:paragraphs.map((p,i)=><p key={i}>{p}</p>)}</main>
      <footer className="reader-dialog-foot"><small>Fonte: Wikisource · obra em domínio público.</small><a href="https://pt.wikisource.org/wiki/A_Cartomante" target="_blank" rel="noopener noreferrer">Ler no Wikisource <ArrowUpRight size={15}/></a></footer>
    </div>
  </div>
}

export default function ReadingShelf({books,physicalBooks=[],inventory=[],onChoosePhysical,compact=false}) {
  const [filter,setFilter]=useState('todos'),[search,setSearch]=useState(''),[selected,setSelected]=useState(null),[readerOpen,setReaderOpen]=useState(false)
  const items=Array.isArray(books)&&books.length?books:PUBLIC_READINGS
  const normalizedSearch=NORMALIZE_TITLE(search)
  const matching=useMemo(()=>items.filter(b=>NORMALIZE_TITLE([b.title,b.author,b.genre].join(' ')).includes(normalizedSearch)),[items,normalizedSearch])
  const leia=matching.filter(isLeia),free=matching.filter(b=>b.platform==='Wikisource')
  return <section className={'reading-shelf story-shelf '+(compact?'reading-shelf--compact':'')} aria-label="Livros digitais para ler">
    <div className="reading-shelf-head"><div><span className="eyebrow">ESTANTE DIGITAL DO JOAQUIM</span><h2>Escolha uma história. Comece a ler.</h2><p>Clique na capa para ver a ficha. A leitura e as informações têm botões separados.</p></div><span className="shelf-mini-stamp"><BookMarked size={17}/> Sua estante</span></div>
    <div className="reading-controls"><div className="reading-tabs" role="group" aria-label="Filtrar fontes de livros"><button type="button" className={filter==='todos'?'active':''} aria-pressed={filter==='todos'} onClick={()=>setFilter('todos')}>Todos</button><button type="button" className={filter==='leia'?'active':''} aria-pressed={filter==='leia'} onClick={()=>setFilter('leia')}>Leia Paraná</button><button type="button" className={filter==='livre'?'active':''} aria-pressed={filter==='livre'} onClick={()=>setFilter('livre')}>Gratuitos</button></div><label className="reading-search"><Search size={17}/><input aria-label="Pesquisar livros digitais" placeholder="Buscar livro, autor ou gênero" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
    {filter!=='livre'&&<div className="story-platform-banner"><BookOpen size={23}/><div><strong>Leia Paraná · plataforma da rede estadual</strong><p>Botão “Ler no Leia Paraná” abre o portal oficial. Entre com @escola e escolha o título no Clube de Leitura; o acesso varia conforme a turma.</p></div><a href={LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer">Abrir portal <ExternalLink size={15}/></a></div>}
    {filter!=='livre'&&<ReadingRow title="Leia Paraná" subtitle="Escolha sua leitura na plataforma oficial" books={leia} onOpen={setSelected}/>}
    {filter!=='leia'&&<ReadingRow title="Clássicos para ler gratuitamente" subtitle="Obras em domínio público com texto disponível no Wikisource" books={free} onOpen={setSelected}/>}
    {!matching.length||((filter==='leia'&&!leia.length)||(filter==='livre'&&!free.length))?<div className="reading-empty"><p>Nenhum livro encontrado neste filtro.</p><button type="button" className="btn btn--outline" onClick={()=>{setFilter('todos');setSearch('')}}>Limpar filtros</button></div>:null}
    <p className="reading-footnote">As capas são ilustrações próprias do projeto, não reproduções das edições oficiais. Recomendações digitais não significam exemplares físicos disponíveis na escola.</p>
    {selected&&<BookDetails book={selected} onClose={()=>setSelected(null)} physicalBooks={physicalBooks} inventory={inventory} onChoosePhysical={onChoosePhysical} onReadHere={()=>setReaderOpen(true)}/>}
    {readerOpen&&<FullTextReader onClose={()=>setReaderOpen(false)}/>}
  </section>
}
