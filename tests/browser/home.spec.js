import {test,expect} from '@playwright/test'

test('a página abre, mostra login por e-mail e estante pública',async ({page})=>{
  const errors=[]
  page.on('pageerror',e=>errors.push(String(e)))
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.getByRole('heading',{name:'Que bom te ver por aqui.'})).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByLabel('CGM do aluno')).toHaveCount(0)
  await expect(page.getByRole('button',{name:/Google/})).toHaveCount(0)
  await page.getByRole('button',{name:'Ver livros'}).click()
  await expect(page.getByRole('heading',{name:'Livros para ler agora'})).toBeVisible()
  await expect(page.getByLabel('Pesquisar livros digitais')).toBeVisible()
  expect(errors).toEqual([])
})
test('estante pública contém obras reais, não permite operações de funcionário',async ({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Ver livros'}).click()
  for(const label of ['Aprovar','Meus livros','Registrar devolução']){
    await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(0)
  }
  await page.getByLabel('Pesquisar livros digitais').fill('Dom Casmurro')
  await expect(page.getByRole('heading',{name:'Dom Casmurro'})).toBeVisible()
  await expect(page.getByRole('link',{name:/Abrir livro/}).first()).toHaveAttribute('href',/pt\.wikisource\.org/)
  await page.getByLabel('Pesquisar livros digitais').fill('')
  await page.getByRole('button',{name:'Ler aqui'}).click()
  await expect(page.getByRole('dialog',{name:'Ler A Cartomante'})).toBeVisible()
  await page.getByRole('button',{name:'Fechar leitura'}).click()
  await page.getByRole('button',{name:'Leia Paraná'}).click()
  await expect(page.getByRole('link',{name:/Leia Paraná/}).first()).toHaveAttribute('href',/leiaparana\.odilo\.us/)
  await page.getByRole('button',{name:'Voltar ao login'}).click()
  await expect(page.getByRole('heading',{name:'Que bom te ver por aqui.'})).toBeVisible()
})
test('manifesto e ícones de instalação continuam acessíveis',async ({page})=>{
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
test('cadastro pede e-mail e senha, sem CGM',async ({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:/Ainda não tenho conta/}).click()
  await expect(page.getByRole('heading',{name:'Crie sua conta'})).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toBeVisible()
  await expect(page.getByLabel('Turma')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByLabel('CGM do aluno')).toHaveCount(0)
  await expect(page.getByRole('button',{name:/Criar minha conta/})).toBeVisible()
})
