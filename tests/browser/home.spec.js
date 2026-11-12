import { test, expect } from '@playwright/test'

test('a página compilada do GitHub Pages mostra o sistema, sem tela branca', async ({ page }) => {
  const errors=[]
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type()==='error') errors.push('console: '+m.text()) })
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).hostname === '127.0.0.1') errors.push(response.status()+': '+response.url())
  })
  await page.goto('./', { waitUntil: 'networkidle' })
  console.log('URL de teste:',page.url())
  console.log('Título:',await page.title())
  console.log('Texto do body:',(await page.locator('body').innerText()).slice(0,1000))
  console.log('Erros do navegador:',JSON.stringify(errors))
  await expect(page.getByRole('heading',{name:'Uma biblioteca melhor para a escola.'})).toBeVisible({timeout:15000})
  await expect(page.getByRole('button',{name:/Explorar demonstração/})).toBeVisible()
  expect(errors).toEqual([])
  await page.getByRole('button',{name:/Explorar demonstração/}).click()
  await expect(page.getByRole('heading',{name:/Olá, Ana!/})).toBeVisible()
  await page.getByRole('button',{name:'Catálogo',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Catálogo de livros'})).toBeVisible()
})


test('demonstração pública é apenas de aluno, sem escolha de cargo de bibliotecário',async ({page})=>{
  await page.goto('/',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:/Explorar demonstração/}).click()
  await expect(page.getByText('Prévia de aluno')).toBeVisible()
  await expect(page.getByLabel('Testar como:')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Solicitações',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Catálogo',exact:true}).click()
  await page.getByRole('button',{name:'Ver detalhes',exact:true}).first().click()
  await page.getByRole('button',{name:/Solicitar empréstimo|Entrar na fila de espera/}).click()
  await page.getByRole('button',{name:'Meus livros',exact:true}).click()
  await expect(page.getByText(/Posição 1 de 1 na fila/)).toBeVisible()
  await page.reload()
  await page.getByRole('button',{name:/Explorar demonstração/}).click()
  await page.getByRole('button',{name:'Meus livros',exact:true}).click()
  await expect(page.getByText(/Posição 1 de 1 na fila/)).toBeVisible()
})
