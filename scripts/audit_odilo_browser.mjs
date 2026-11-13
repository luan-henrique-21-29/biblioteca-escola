import { chromium } from '@playwright/test'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
try {
 const responses=[]
 const detailApis=[]
 page.on('response',async r=>{
   const url=r.url()
   if(!url.includes('/opac/api/v2/')||/\/token(?:[?\/]|$)/.test(url))return
   if(detailApis.length>=55)return
   let sample=''
   try{const ct=r.headers()['content-type']||'';if(ct.includes('json'))sample=(await r.text()).slice(0,1000)}catch{}
   detailApis.push({url,status:r.status(),sample})
 })
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

 const cards=await page.evaluate(()=>[...document.querySelectorAll('.slider-component__item')].map(el=>({title:el.getAttribute('aria-label')?.replace(/, Formato.*$/,'').trim()||'',cover:el.querySelector('img')?.src||'',style:el.querySelector('.image-container')?.getAttribute('style')||''})).filter(x=>x.title&&x.cover))
 console.log('CANDIDATES_COUNT',cards.length)
 console.log('CANDIDATES_JSON',JSON.stringify(cards.slice(0,120)))

 console.log('MODAL_TEXT',JSON.stringify((await page.locator('app-modal-handler').innerText().catch(()=>'' )).slice(0,1400)))
 console.log('MODAL_BUTTONS',JSON.stringify(await page.locator('app-modal-handler button').evaluateAll(els=>els.map(x=>({text:x.textContent?.trim().slice(0,80),aria:x.getAttribute('aria-label'),title:x.title})).slice(0,15))))

 const reject=page.getByRole('button',{name:/recusar todos os cookies/i})
 console.log('COOKIE_REJECT_VISIBLE',await reject.count())
 if(await reject.count()) await reject.first().click({timeout:5000}).catch(e=>console.log('COOKIE_REJECT_ERR',e.message.slice(0,120)))
 console.log('OVERLAYS',await page.locator('.dialog-backdrop:visible').count())
 for(let i=0;i<10;i++){
   await page.evaluate(n=>window.scrollTo(0,Math.min(document.body.scrollHeight,(n+1)*950)),i)
   await page.waitForTimeout(450)
 }
 const more=await page.evaluate(()=>[...document.querySelectorAll('.slider-component__item')].map(el=>({title:el.getAttribute('aria-label')?.replace(/, Formato.*$/,'').trim()||'',cover:el.querySelector('img')?.src||'',format:el.getAttribute('aria-label')?.split('Formato ')[1]||''})).filter(x=>x.title&&x.cover))
 console.log('ALL_CANDIDATES_COUNT',more.length)
 console.log('ALL_CANDIDATES_JSON',JSON.stringify(more.slice(0,165)))
 const one=page.locator('.slider-component__item[aria-label="O Hobbit, Formato eBook"]').first()
 if(await one.count()){
  await one.scrollIntoViewIfNeeded()
  await one.click({timeout:12000})
  await page.waitForTimeout(2500)
  console.log('HOBBIT_AFTER_CLICK_URL',page.url())
  console.log('HOBBIT_AFTER_CLICK_TEXT',JSON.stringify((await page.locator('body').innerText()).slice(0,2200)))
  console.log('HOBBIT_DETAIL_IMG',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('img')].map(x=>({src:x.src,alt:x.alt})).filter(x=>x.src).slice(0,15))))
  console.log('BOOK_MODAL_ACTIONS',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('app-modal-handler button,app-modal-handler a')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'}).slice(0,45).map(el=>({tag:el.tagName,text:el.textContent?.trim().slice(0,100),label:el.getAttribute('aria-label'),title:el.getAttribute('title'),href:el.getAttribute('href')})))))
  console.log('API_DETAILS',JSON.stringify(detailApis.slice(-22)))

 }
} catch(e){console.log('ERROR',e.message.slice(0,1000));process.exitCode=1} finally{await browser.close()}
