import {test,expect} from '@playwright/test'
test('site público não fica branco e abre prévia sem contas',async ({page})=>{
  const errors=[]
  page.on('pageerror',e=>errors.push(String(e)))
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.getByRole('heading',{name:'Entre na sua conta'})).toBeVisible()
  await page.getByRole('button',{name:'Ver prévia do catálogo'}).click()
  await expect(page.getByRole('heading',{name:'Prévia do catálogo'})).toBeVisible()
  await expect(page.getByLabel('Pesquisar livros de exemplo')).toBeVisible()
  expect(errors).toEqual([])
})
test('prévia pública não oferece menus nem ações de aluno e bibliotecário',async ({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Ver prévia do catálogo'}).click()
  for(const label of ['Entrar como bibliotecário','Aprovar','Meus livros','Registrar devolução']){
    await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(0)
  }
  await page.getByLabel('Pesquisar livros de exemplo').fill('Machado')
  await expect(page.getByRole('heading',{name:'Dom Casmurro'})).toBeVisible()
  await page.getByRole('button',{name:'Voltar ao login'}).click()
  await expect(page.getByRole('heading',{name:'Entre na sua conta'})).toBeVisible()
})

test('o aplicativo oferece ícones e manifesto de instalação',async ({page})=>{
  await page.goto('/',{waitUntil:'networkidle'})
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href',/manifest\.webmanifest/)
  const manifestUrl=await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest=await page.evaluate(async url=>(await (await fetch(url)).json()),manifestUrl)
  expect(manifest.name).toBe('Biblioteca Joaquim')
  expect(manifest.icons.length).toBeGreaterThan(1)
  for(const icon of manifest.icons){
    const response=await page.request.get(new URL(icon.src,new URL(manifestUrl,page.url())).toString())
    expect(response.status()).toBe(200)
  }
})

test('cadastro usa somente CGM e senha, sem e-mail',async ({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.getByLabel('CGM do aluno')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toHaveCount(0)
  await page.getByRole('button',{name:'Criar conta de aluno'}).click()
  await expect(page.getByLabel('Nome completo')).toBeVisible()
  await expect(page.getByLabel('Turma')).toBeVisible()
  await expect(page.getByLabel('CGM do aluno')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toHaveCount(0)
})
