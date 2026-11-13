import { chromium } from '@playwright/test'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
try {
 const responses=[]
 page.on('response',r=>{if(responses.length<60 && /(?:odilo|api)/i.test(r.url()) && (r.request().resourceType()==='xhr'||r.request().resourceType()==='fetch'))responses.push({url:r.url(),status:r.status(),type:r.request().resourceType()})})
 await page.goto('https://leiaparana.odilo.us/?locale=pt',{waitUntil:'domcontentloaded',timeout:35000})
 await page.waitForTimeout(8000)
 console.log('PAGE',page.url(),'TITLE',await page.title())
 console.log('VISIBLE_TEXT',JSON.stringify((await page.locator('body').innerText()).slice(0,1700)))
 console.log('PUBLIC_FETCHES',JSON.stringify(responses.slice(0,25)))
 const audit=await page.evaluate(()=>{
  const bookTerms=['Diário de um Banana','Entregas expressas da Kiki','O Hobbit','O Mágico de Oz','Vidas secas']
  const all=[...document.querySelectorAll('a[href]')].map(el=>({href:el.getAttribute('href'),text:el.textContent?.trim().slice(0,80),img:el.querySelector('img')?.getAttribute('src')}))
  const photos=[...document.querySelectorAll('img')].map(el=>({alt:el.alt,src:el.src})).filter(i=>i.src)
  const examples=bookTerms.map(term=>{const nodes=[...document.querySelectorAll('body *')].filter(el=>el.children.length===0&&el.textContent?.trim()===term);return {term,found:nodes.length,html:nodes[0]?.parentElement?.parentElement?.outerHTML.slice(0,2000)}})
  return {anchorCount:all.length,linkExamples:all.filter(x=>/info|di[aá]rio|hobbit|kiki/i.test(x.href+' '+x.text)).slice(0,60),imageCount:photos.length,imageExamples:photos.slice(0,18),examples}
 })
 console.log('AUDIT',JSON.stringify(audit))
 const source=page.url()
 console.log('DETAIL_SOURCE',source)
 if(audit.examples.some(e=>e.found)){
   const title=page.getByText('Entregas expressas da Kiki',{exact:true}).first()
   if(await title.count()){await title.click({timeout:5000}).catch(e=>console.log('CLICK_ERR',e.message.slice(0,160)));await page.waitForTimeout(2500);console.log('AFTER_CLICK',page.url());console.log('DETAIL_BODY',JSON.stringify((await page.locator('body').innerText()).slice(0,1100)));console.log('DETAIL_IMAGES',JSON.stringify(await page.evaluate(()=>[...document.images].slice(0,15).map(x=>({src:x.src,alt:x.alt})))) )}
 }
} catch(e){console.log('ERROR',e.message.slice(0,1000));process.exitCode=1} finally{await browser.close()}
