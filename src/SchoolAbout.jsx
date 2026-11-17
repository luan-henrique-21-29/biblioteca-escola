import React from 'react'
import {ArrowLeft,ArrowUpRight,BookOpen,CalendarDays,GraduationCap,LibraryBig,Mail,MapPin,Phone,ShieldCheck} from 'lucide-react'
import Brand from './Brand.jsx'
const schoolUrl='https://www.consultaescolas.pr.gov.br/consultaescolas/pages/templates/initial2.xhtml?codigoEstab=417&codigoMunicipio=970'
const stories=[
 {year:'2009',title:'Inclusão e participação',description:'A Secretaria da Educação publicou uma reportagem sobre práticas de inclusão desenvolvidas no Colégio Joaquim Mafra.',source:'https://www.educacao.pr.gov.br/Noticia/Metodo-de-escola-de-Guaratuba-atrai-estudantes-especiais'},
 {year:'2017',title:'Destaque na gestão escolar',description:'A escola recebeu o primeiro lugar regional no Prêmio de Gestão, segundo notícia publicada pela Secretaria da Educação.',source:'https://www.educacao.pr.gov.br/Noticia/Escolas-estaduais-do-Litoral-recebem-Premio-de-Gestao'},
 {year:'2019',title:'Feira de Ciências',description:'O colégio recebeu uma feira de ciências com atividades e participação de instituições da região, registrada pela Faculdade ISEPE.',source:'https://isepe.edu.br/noticias/momento-isepe/360-faculdade-isepe-na-feira-de-ciencias-do-colegio-joaquim-mafra'},
 {year:'2026',title:'Novas possibilidades de formação',description:'O colégio foi incluído na oferta estadual do Curso Técnico em Inteligência Artificial e Dados, anunciada pela Secretaria da Educação.',source:'https://www.educacao.pr.gov.br/Noticia/Parana-sera-um-dos-primeiros-estados-do-Brasil-ofertar-curso-tecnico-de-IA-na-rede-publica'}
]
export default function SchoolAbout({onBack}) {
 return <div className="school-about-page">
   {onBack&&<div className="school-about-back"><Brand compact/><button className="btn btn--outline" onClick={onBack} type="button"><ArrowLeft size={16}/> Voltar</button></div>}
   <div className="school-about-hero">
     <div><span className="eyebrow">GUARATUBA · PARANÁ</span><h1>O Joaquim Mafra também é feito de histórias.</h1><p>Um espaço para conhecer o colégio que dá nome à nossa biblioteca digital — com informações públicas e registros de diferentes momentos da comunidade escolar.</p></div>
     <div className="school-about-cover"><img src="https://litoranea.fm/wp-content/uploads/2024/01/12076847225_b441fe56c6_b.jpg" alt="Quadra coberta do Colégio Estadual Prefeito Joaquim da Silva Mafra, em Guaratuba" loading="lazy"/><a href="https://litoranea.fm/colegio-joaquim-mafra-de-guaratuba-lembra-que-prazo-para-matriculas-e-rematriculas-termina-nesta-sexta-feira-12/" target="_blank" rel="noopener noreferrer">Imagem da quadra · Grupo Litorânea, 2024 <ArrowUpRight size={13}/></a></div>
   </div>
   <div className="school-about-contact" aria-label="Informações oficiais da escola">
     <div><GraduationCap size={21}/><span>Rede de ensino</span><strong>Estadual · NRE Paranaguá</strong></div>
     <div><MapPin size={21}/><span>Localização</span><strong>R. José Nicolau Abagge, 1500 · Cohapar</strong></div>
     <div><Phone size={21}/><span>Telefone</span><strong>(41) 3472-1259</strong></div>
     <div><Mail size={21}/><span>Contato</span><a href="mailto:grujoaquimmafra@seed.pr.gov.br">grujoaquimmafra@seed.pr.gov.br</a></div>
   </div>
   <div className="school-about-content">
     <section className="school-about-timeline">
       <div className="school-about-section-title"><CalendarDays size={21}/><div><span className="eyebrow">MEMÓRIAS DOCUMENTADAS</span><h2>Momentos da nossa escola</h2></div></div>
       <p className="school-about-intro">Não encontramos uma data de fundação oficialmente confirmada nas fontes consultadas. Esta linha do tempo apresenta acontecimentos documentados, sem inventar a origem do colégio.</p>
       <div className="school-moments">{stories.map(item=><article className="school-moment" key={item.year}><div className="school-moment-year">{item.year}</div><div><h3>{item.title}</h3><p>{item.description}</p><a href={item.source} target="_blank" rel="noopener noreferrer">Conferir fonte <ArrowUpRight size={14}/></a></div></article>)}</div>
     </section>
     <aside className="school-about-sidebar">
       <div className="school-about-info"><LibraryBig size={27}/><h3>Biblioteca e leitura</h3><p>O cadastro público da Secretaria da Educação registra a existência de uma biblioteca no estabelecimento. Este site é um projeto digital para facilitar a descoberta de livros e acompanhar empréstimos.</p><p>Os exemplares físicos só aparecerão como disponíveis após cadastro real pela escola.</p><a href={schoolUrl} target="_blank" rel="noopener noreferrer">Consultar dados oficiais <ArrowUpRight size={14}/></a></div>
       <figure className="school-about-photo"><img src="https://isepe.edu.br/images/momento-isepe/2019/21-11/04.jpg" alt="Registro fotográfico da Feira de Ciências no Colégio Joaquim Mafra, em 2019" loading="lazy"/><figcaption>Feira de Ciências no Joaquim Mafra · foto e reportagem: <a href="https://isepe.edu.br/noticias/momento-isepe/360-faculdade-isepe-na-feira-de-ciencias-do-colegio-joaquim-mafra" target="_blank" rel="noopener noreferrer">Faculdade ISEPE <ArrowUpRight size={12}/></a></figcaption></figure>
       <p className="school-about-disclaimer"><ShieldCheck size={16}/> Esta página é parte de um projeto escolar independente; não é o site oficial da Secretaria da Educação. Fotos de fontes externas são exibidas com indicação de origem.</p>
     </aside>
   </div>
 </div>
}
