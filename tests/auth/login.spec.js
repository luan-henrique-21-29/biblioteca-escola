import {test,expect} from '@playwright/test'

test('com Supabase configurado mostra login por e-mail, sem Google ou CGM',async({page})=>{
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.getByRole('heading',{name:'Que bom te ver por aqui.'})).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByLabel('CGM do aluno')).toHaveCount(0)
  await expect(page.getByRole('button',{name:/Continuar com Google/})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Entrar na biblioteca',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:/Ainda não tenho conta/})).toBeVisible()
  await expect(page.getByRole('button',{name:'Aprovar',exact:true})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Relatórios',exact:true})).toHaveCount(0)
  expect(errors).toEqual([])
})
test('cadastro usa nome, turma, e-mail e senha, nunca CGM',async({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:/Ainda não tenho conta/}).click()
  await expect(page.getByRole('heading',{name:'Crie sua conta'})).toBeVisible()
  for(const label of ['Nome completo','Turma','E-mail','Senha'])await expect(page.getByLabel(label)).toBeVisible()
  await expect(page.getByText('Matrícula / CGM')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Criar minha conta'})).toBeVisible()
  await expect(page.getByRole('radio')).toHaveCount(0)
})
test('recuperação de senha fica disponível no login',async({page})=>{
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.getByRole('button',{name:'Esqueci a senha'})).toBeVisible()
  await page.getByRole('button',{name:/Ainda não tenho conta/}).click()
  await expect(page.getByRole('button',{name:'Esqueci a senha'})).toHaveCount(0)
})
