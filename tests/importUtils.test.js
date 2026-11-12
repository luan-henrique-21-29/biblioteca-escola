import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, validateSpreadsheet } from '../src/importUtils.js'

test('lê CSV com ponto e vírgula, acentos e campos entre aspas',()=>{
  const matrix=parseCsv('\uFEFFcódigo;título;autor;gênero;sinopse;ano;capa\r\n0005;"Livro; especial";"Ana ""B""";Romance;"linha 1\nlinha 2";2001;\r\n')
  assert.equal(matrix[1][0],'0005')
  assert.equal(matrix[1][1],'Livro; especial')
  assert.equal(matrix[1][2],'Ana "B"')
  const result=validateSpreadsheet(matrix)
  assert.equal(result.errors.length,0)
  assert.equal(result.rows[0].codigo,'0005')
  assert.equal(result.rows[0].sinopse,'linha 1\nlinha 2')
})

test('lê CSV separado por vírgula',()=>{
  const x=parseCsv('codigo,titulo,autor,genero\n10,Primeiro,Ana,Aventura\n')
  assert.equal(validateSpreadsheet(x).rows.length,1)
})

test('rejeita cabeçalhos ausentes',()=>{
  const r=validateSpreadsheet([['titulo','autor'],['Livro','Ana']])
  assert.match(r.errors[0],/Colunas obrigatórias/)
})

test('rejeita códigos inválidos e duplicados na mesma planilha',()=>{
  const r=validateSpreadsheet([['codigo','titulo','autor','genero'],['a','Livro','Ana','Ficção'],['12','Outro','João','Ficção'],['12','Mais','João','Ficção']])
  assert.equal(r.rows.length,0)
  assert.ok(r.errors.some(x=>x.includes('código deve')))
  assert.ok(r.errors.some(x=>x.includes('código repetido')))
})

test('rejeita anos e links incorretos',()=>{
  const r=validateSpreadsheet([['codigo','titulo','autor','genero','ano','capa'],['45','Livro','Ana','Aventura','3000','javascript:alert(1)']])
  assert.equal(r.rows.length,0)
  assert.ok(r.errors.some(x=>x.includes('ano inválido')))
  assert.ok(r.errors.some(x=>x.includes('URL http(s)')))
})

test('ignora linhas em branco e aceita vários exemplares do mesmo título',()=>{
  const r=validateSpreadsheet([['Código','Título','Autor','Gênero'],['007','Livro','Ana','Romance'],['','','',''],['008','Livro','Ana','Romance']])
  assert.deepEqual(r.errors,[])
  assert.equal(r.rows.length,2)
})

test('rejeita mais de 200 exemplares',()=>{
  const matrix=[['codigo','titulo','autor','genero']]
  for(let i=1;i<=201;i++)matrix.push([String(i),'Livro','Ana','Romance'])
  assert.match(validateSpreadsheet(matrix).errors[0],/200/)
})
