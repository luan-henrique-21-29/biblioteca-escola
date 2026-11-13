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

 const cards=await page.evaluate(()=>[...document.querySelectorAll('.slider-component__item')].map(el=>({title:el.getAttribute('aria-label')?.replace(/, Formato.*$/,'').trim()||'',cover:el.querySelector('img')?.src||'',style:el.querySelector('.image-container')?.getAttribute('style')||''})).filter(x=>x.title&&x.cover))
 console.log('CANDIDATES_COUNT',cards.length)
 console.log('CANDIDATES_JSON',JSON.stringify(cards.slice(0,120)))
 const one=page.locator('.slider-component__item').filter({hasText:'O Hobbit'}).first()
 if(await one.count()){
  await one.scrollIntoViewIfNeeded()
  await one.click({timeout:10000})
  await page.waitForTimeout(4000)
  console.log('HOBBIT_DETAIL_URL',page.url())
  console.log('HOBBIT_DETAIL_BODY',JSON.stringify((await page.locator('body').innerText()).slice(0,2600)))
  console.log('HOBBIT_DETAIL_IMGS',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('img')].map(el=>({src:el.src,alt:el.alt})).filter(x=>x.src).slice(0,20))))
 }
} catch(e){console.log('ERROR',e.message.slice(0,1000));process.exitCode=1} finally{await browser.close()}
