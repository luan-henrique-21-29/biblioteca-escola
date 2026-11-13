// Catálogo de referências: metadados públicos de obras literárias.
// "Leia Paraná" oferece acesso à plataforma, não comprova disponibilidade por turma.
// Links individuais somente após validação específica pela escola/fornecedor.
export const LEIA_PARANA_URL='https://leiaparana.odilo.us/'
export const NORMALIZE_TITLE=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim()
export const isLeia=book=>book?.platform==='Leia Paraná'
export const isVerifiedLeia=book=>Boolean(isLeia(book)&&book?.individual_link_verified_at&&book?.cover_verified_at&&/^https:\/\/leiaparana\.odilo\.us\/info\/[a-z0-9_%.-]+$/i.test(String(book?.access_url||''))&&/^https:\/\/covers\.odilo\.io\//.test(String(book?.cover_url||'')))
export const urlForBook=book=>{
  if(isLeia(book))return isVerifiedLeia(book)?book.access_url:LEIA_PARANA_URL
  try{
    const url=new URL(book?.access_url||'')
    return url.protocol==='https:'&&url.hostname==='pt.wikisource.org'?url.href:null
  }catch{return null}
}
export const PUBLIC_READINGS=[
{id:1,title:'O Mágico de Oz',author:'L. Frank Baum',genre:'Fantasia',published_year:1900,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'Dorothy é levada por um ciclone a uma terra desconhecida. Para voltar ao Kansas, parte em direção à Cidade das Esmeraldas e encontra companheiros que também procuram realizar seus desejos.'},
{id:2,title:'A Ilha do Tesouro',author:'Robert Louis Stevenson',genre:'Aventura',published_year:1883,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'Após encontrar um mapa de tesouro, o jovem Jim Hawkins embarca numa viagem marítima cheia de perigos. Entre piratas e alianças inesperadas, ele precisa descobrir em quem confiar.'},
{id:3,title:'Alice no País das Maravilhas',author:'Lewis Carroll',genre:'Fantasia',published_year:1865,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'Ao seguir um coelho apressado, Alice entra num mundo de acontecimentos absurdos, personagens excêntricos e regras que mudam a todo momento.'},
{id:4,title:'Memórias Póstumas de Brás Cubas',author:'Machado de Assis',genre:'Romance brasileiro',published_year:1881,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'Narrada por Brás Cubas depois de sua morte, a história revisita sua vida, seus amores e suas ambições, expondo com ironia os costumes da sociedade de sua época.'},
{id:5,title:'Iracema',author:'José de Alencar',genre:'Romance indianista',published_year:1865,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'No Ceará colonial, Iracema, jovem indígena tabajara, e Martim, português recém-chegado, vivem um amor marcado por encontros culturais, conflitos e perdas.'},
{id:6,title:'A Volta ao Mundo em 80 Dias',author:'Júlio Verne',genre:'Aventura',published_year:1873,platform:'Leia Paraná',access_url:LEIA_PARANA_URL,synopsis:'Phileas Fogg aposta que pode dar a volta ao mundo em apenas oitenta dias. Acompanhado por seu criado Passepartout, enfrenta imprevistos para cumprir o desafio.'},
{id:101,title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance brasileiro',published_year:1899,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/Anexo:Imprimir/Dom_Casmurro',synopsis:'Bento Santiago conta suas memórias, do amor juvenil por Capitu ao casamento e às suspeitas que transformam seu olhar sobre o passado. Um romance sobre ciúme e a dificuldade de conhecer a verdade.'},
{id:102,title:'Iracema',author:'José de Alencar',genre:'Romance indianista',published_year:1865,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/Iracema',synopsis:'No Ceará colonial, Iracema, jovem indígena tabajara, e Martim, português recém-chegado, vivem um amor marcado por encontros culturais, conflitos e perdas.'},
{id:103,title:'O Alienista',author:'Machado de Assis',genre:'Novela e sátira',published_year:1882,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/O_Alienista',synopsis:'O médico Simão Bacamarte funda uma casa de tratamento em Itaguaí e passa a internar habitantes segundo suas teorias. O conto questiona os limites entre razão, poder e loucura.'},
{id:104,title:'A Cartomante',author:'Machado de Assis',genre:'Conto',published_year:1884,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/A_Cartomante',synopsis:'Camilo e Rita vivem um relacionamento secreto. Quando surgem ameaças, a confiança nas previsões de uma cartomante influencia decisões de consequências inesperadas.'},
{id:105,title:'A Moreninha',author:'Joaquim Manuel de Macedo',genre:'Romance',published_year:1844,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/A_Moreninha_(1860)',synopsis:'Na sociedade carioca do século XIX, a jovem Carolina desperta os sentimentos de Augusto durante uma temporada na Ilha de Paquetá. O romance gira em torno de promessas, encontros e amadurecimento.'},
{id:106,title:'Memórias Póstumas de Brás Cubas',author:'Machado de Assis',genre:'Romance brasileiro',published_year:1881,platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/Anexo:Imprimir/Mem%C3%B3rias_P%C3%B3stumas_de_Br%C3%A1s_Cubas',synopsis:'Narrada por Brás Cubas depois de sua morte, a história revisita sua vida, seus amores e suas ambições, expondo com ironia os costumes da sociedade de sua época.'}
]
