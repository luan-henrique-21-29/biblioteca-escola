import { test, expect } from '@playwright/test'

test('a página compilada do GitHub Pages mostra o sistema, sem tela branca', async ({ page }) => {
  const errors=[]
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type()==='error') errors.push('console: '+m.text()) })
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).hostname === '127.0.0.1') errors.push(response.status()+': '+response.url())
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading',{name:'Bem-vindo à Biblioteca Joaquim'})).toBeVisible({timeout:15000})
  await expect(page.getByRole('button',{name:/Explorar demonstração/})).toBeVisible()
  expect(errors).toEqual([])
  await page.getByRole('button',{name:/Explorar demonstração/}).click()
  await expect(page.getByRole('heading',{name:/Boas-vindas à biblioteca/})).toBeVisible()
  await page.getByRole('button',{name:'Catálogo'}).click()
  await expect(page.getByRole('heading',{name:'Catálogo de livros'})).toBeVisible()
})
