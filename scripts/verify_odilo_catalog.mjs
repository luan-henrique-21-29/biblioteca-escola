import {chromium} from '@playwright/test'
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({locale:'pt-BR',viewport:{width:1200,height:760}})
const home=await context.newPage()
const origin='https://leiaparana.odilo.us'
function normal(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function slug(x){return normal(x).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function clean(x){return String(x||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&quot;/gi,'"').replace(/&amp;/gi,'&').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim()}
function shortText(x){let text=clean(x);let i=text.search(/[.!?]\s/);if(i>65&&i<265)text=text.slice(0,i+1);else if(text.length>235)text=text.slice(0,234).replace(/\s+\S*$/,'')+'…';return text.slice(0,280)}
function genreFor(r){
 const x=normal(r.subject||r.subjects?.[0]||'')
 if(/ciencia ficcion|science fiction/.test(x))return 'Ficção científica'
 if(/fantas/.test(x))return 'Fantasia'
 if(/hist[oó]ria|histor/.test(x))return 'História'
 if(/comic|graph|quadrin|historieta|manga/.test(x))return 'HQ e graphic novel'
 if(/romant|romance/.test(x))return 'Romance'
 if(/mister|crime|suspens|polic/.test(x))return 'Mistério e suspense'
 if(/aventur|action/.test(x))return 'Aventura'
 if(/biograf|memoir/.test(x))return 'Biografia'
 if(/desenvolv|autoajuda|self.help|psico/.test(x))return 'Desenvolvimento pessoal'
 if(/filosof|sociolog|social/.test(x))return 'Sociedade e ideias'
 if(/juvenil|teen|joven|infantil|children/.test(x))return 'Infantojuvenil'
 if(/classic|clasica/.test(x))return 'Clássicos'
 if(/ficc/.test(x))return 'Ficção'
 return 'Literatura e conhecimento'
}
function titleKey(x){return slug(x).replace(/-\d{4}$/,'')}
let sourceRequest
try{
 home.on('response',response=>{if(response.url().includes('/records/collections?'))sourceRequest=response.request()})
 await home.goto(origin+'/?locale=pt',{waitUntil:'domcontentloaded',timeout:35000})
 await home.waitForTimeout(5300)
 if(!sourceRequest)throw Error('O catálogo público não respondeu')
 const headers=await sourceRequest.allHeaders()
 const response=await home.request.get(origin+'/opac/api/v2/records?limit=200&query=format_facet_ss:%22EBOOK%22',{
    headers:{authorization:headers.authorization||'',accept:'application/json'},timeout:25000
 })
 if(response.status()!==200)throw Error('Catálogo HTTP '+response.status())
 const records=await response.json()
 if(!Array.isArray(records))throw Error('Estrutura do catálogo desconhecida')
 const eligible=records.filter(r=>r.active!==false&&r.formats?.some(x=>String(x).includes('EBOOK'))&&r.id&&r.title&&r.author&&r.coverImageUrl?.startsWith('https://covers.odilo.io/'))
 const distinct=[...new Map(eligible.map(r=>[titleKey(r.title),r])).values()]
 console.log('SOURCE_RECORDS',records.length,'ELIGIBLE',eligible.length,'DISTINCT_TITLES',distinct.length)
 const group=new Map()
 for(const r of distinct){const key=genreFor(r);if(!group.has(key))group.set(key,[]);group.get(key).push(r)}
 console.log('CATEGORY_DISTRIBUTION',JSON.stringify([...group].map(([k,v])=>[k,v.length])))
 const priorities=['O Hobbit','Harry Potter e a Pedra Filosofal','O ladrão de raios','Vidas secas - Edição Oficial','O Mágico de Oz','Diário de um Banana','Turma de Mônica: Laços','Auto da compadecida','A Máquina do Tempo (Edição especial)','O menino que descobriu o vento']
 const candidates=[]
 const seen=new Set()
 function add(r){if(!r||seen.has(r.id))return;seen.add(r.id);candidates.push(r)}
 for(const p of priorities){const r=distinct.find(x=>normal(x.title)===normal(p));add(r)}
 const groups=[...group.values()].map(r=>[...r])
 let has=true
 while(has){has=false;for(const arr of groups){const r=arr.shift();if(r){add(r);has=true}}}
 const verified=[]
 const fails=[]
 const chunkSize=4
 for(let start=0;start<candidates.length&&verified.length<50;start+=chunkSize){
   const batch=candidates.slice(start,start+chunkSize)
   const answers=await Promise.all(batch.map(async r=>{
     const url=origin+'/info/'+slug(r.title)+'-'+r.id
     const tab=await context.newPage()
     try{
      const image=await tab.request.get(r.coverImageUrl,{timeout:12000,failOnStatusCode:false})
      const bytes=await image.body()
      const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255
      const isPng=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71
      const isWebp=bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP'
      if(image.status()!==200||!(isJpeg||isPng||isWebp))return {fail:r.title+' cover invalid '+image.status()+' MIME '+String(image.headers()['content-type']||'')+' bytes '+bytes.subarray(0,9).toString('hex')}
      const pageResponse=await tab.goto(url,{waitUntil:'domcontentloaded',timeout:22000})
      await tab.waitForTimeout(1300)
      const text=await tab.locator('body').innerText({timeout:5000})
      const titleOkay=normal(text).includes(normal(r.title))
      const authorOkay=normal(text).includes(normal(r.author))
      const borrowOkay=/EMPRESTAR|BORROW|PRÉ-VISUALIZAÇÃO|PREVIEW/i.test(text)
      if(pageResponse?.status()!==200||tab.url()!==url||!titleOkay||!authorOkay||!borrowOkay)return {fail:r.title+' direct '+pageResponse?.status()+' title='+titleOkay+' author='+authorOkay+' borrow='+borrowOkay}
      const year=/^\d{4}/.test(String(r.publicationDate||''))?Number(String(r.publicationDate).slice(0,4)):null
      return {book:{
        title:String(r.title).trim().slice(0,200),
        author:String(r.author).trim().slice(0,200),
        genre:genreFor(r),
        published_year:year,
        synopsis:shortText(r.description)||'Consulte a sinopse e informações da edição na ficha oficial do Leia Paraná.',
        isbn:String(r.isbn||'').slice(0,30),
        cover_url:r.coverImageUrl,
        access_url:url,
        source_catalog_url:origin+'/'
      }}
     }catch(e){return {fail:r.title+' '+e.message.slice(0,130)}}
     finally{await tab.close()}
   }))
   for(const ans of answers){if(ans.book&&verified.length<50)verified.push(ans.book);else if(ans.fail)fails.push(ans.fail)}
   console.log('PROGRESS',Math.min(start+batch.length,candidates.length),candidates.length,'VERIFIED',verified.length,'FAILED',fails.length)
 }
 console.log('VERIFIED_COUNT',verified.length)
 console.log('VERIFIED_CATEGORIES',JSON.stringify([...new Set(verified.map(b=>b.genre))]))
 console.log('FAILED_COUNT',fails.length,'FAILED_SAMPLE',JSON.stringify(fails.slice(0,18)))
 console.log('VERIFIED_CATALOG_JSON='+JSON.stringify(verified))
 if(verified.length<10)process.exitCode=2
} catch(e){console.log('ERROR',e.message.slice(0,900));process.exitCode=1} finally{await browser.close()}
