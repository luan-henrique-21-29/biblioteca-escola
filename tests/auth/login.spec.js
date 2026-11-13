import {test,expect} from '@playwright/test'

test('site com Supabase configurado mostra login, nunca painel aberto',async({page})=>{
 const errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto('./',{waitUntil:'networkidle'})
 await expect(page.getByRole('heading',{name:'Entre na sua conta'})).toBeVisible()
 await expect(page.getByRole('button',{name:/Continuar com Google/})).toBeVisible()
 await expect(page.getByRole('button',{name:'Entrar',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Criar conta de aluno'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Aprovar',exact:true})).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Relatórios',exact:true})).toHaveCount(0)
 await expect(page.getByText('Resumo por turma')).toHaveCount(0)
 await expect(page.getByRole('button',{name:/Entrar como bibliotecário/})).toHaveCount(0)
 expect(errors).toEqual([])
})

test('cadastro público só oferece dados de aluno e exige senha',async({page})=>{
 await page.goto('./',{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Criar conta de aluno'}).click()
 await expect(page.getByRole('heading',{name:'Criar sua conta'})).toBeVisible()
 await expect(page.getByText('Nome completo')).toBeVisible()
 await expect(page.getByText('Turma')).toBeVisible()
 await expect(page.getByText('Matrícula / CGM')).toBeVisible()
 await expect(page.getByRole('button',{name:'Criar conta',exact:true})).toBeVisible()
 await expect(page.getByText(/Acesso dos bibliotecários concedido somente por um administrador/)).toBeVisible()
 await expect(page.getByRole('radio')).toHaveCount(0)
})

test('recuperação de senha aparece só para quem já tem conta',async({page})=>{
 await page.goto('./',{waitUntil:'networkidle'})
 await expect(page.getByRole('button',{name:'Esqueci minha senha'})).toBeVisible()
 await page.getByRole('button',{name:'Criar conta de aluno'}).click()
 await expect(page.getByRole('button',{name:'Esqueci minha senha'})).toHaveCount(0)
})
