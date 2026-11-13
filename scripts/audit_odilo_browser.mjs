import { chromium } from '@playwright/test'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1400,height:900}})
try{
 let collectionReq
 page.on('response',r=>{if(r.url().includes('/records/collections?'))collectionReq=r.request()})
 await page.goto('https://leiaparana.odilo.us/?locale=pt',{waitUntil:'domcontentloaded',timeout:35000})
 await page.waitForTimeout(5500)
 console.log('PAGE_OK',page.url(),await page.title())
 if(!collectionReq)throw Error('O carregamento do catálogo público não retornou coleções.')
 const headers=await collectionReq.allHeaders()
 const auth=headers.authorization
 console.log('PUBLIC_CATALOG_AUTHORIZATION_PRESENT',Boolean(auth))
 const extra=auth?{authorization:auth,accept:'application/json'}:{accept:'application/json'}
 for(const url of [
   'https://leiaparana.odilo.us/opac/api/v2/records?limit=200&offset=0',
   'https://leiaparana.odilo.us/opac/api/v2/records?limit=60&query=format_facet_ss:%22EBOOK%22'
 ]){
   const r=await page.request.get(url,{headers:extra,timeout:20000})
   console.log('SEARCH_URL',url,'STATUS',r.status())
   let data
   try{data=await r.json()}catch{console.log('SEARCH_BODY',((await r.text())||'').slice(0,250));continue}
   console.log('RESPONSE_KEYS',Object.keys(data||{}),'ARRAY',Array.isArray(data),'RECORDS_COUNT',data?.records?.length,'RESULTS_COUNT',data?.results?.length)
   const books=Array.isArray(data)?data:(data.records||data.results||data.items||[])
   console.log('BOOK_SAMPLE',JSON.stringify(books.slice(0,2)).slice(0,4300))
   console.log('BOOKS_COUNT',books.length,'EBOOKS',books.filter(b=>b.specialFormat==='EBOOK'||b.formats?.some(x=>String(x).includes('EBOOK'))).length)
 }
}catch(e){console.log('ERROR',e.message.slice(0,1400));process.exitCode=1}finally{await browser.close()}
