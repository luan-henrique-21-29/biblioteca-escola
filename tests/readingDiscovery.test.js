import test from 'node:test'
import assert from 'node:assert/strict'
import {bookSearchScore,searchBooks,recommendForReader} from '../src/readingDiscovery.js'

const readings=[
{id:1,title:'O Hobbit',author:'J.R.R. Tolkien',genre:'Fantasia',platform:'Leia Paraná',cover_url:'https://covers.odilo.io/img.jpg',access_url:'https://leiaparana.odilo.us/info/o-hobbit-1',cover_verified_at:'2026-11-17',individual_link_verified_at:'2026-11-17'},
{id:2,title:'Harry Potter e a Pedra Filosofal',author:'J. K. Rowling',genre:'Fantasia',platform:'Leia Paraná',cover_url:'https://covers.odilo.io/img2.jpg',access_url:'https://leiaparana.odilo.us/info/harry-potter-2',cover_verified_at:'2026-11-17',individual_link_verified_at:'2026-11-17'},
{id:3,title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance brasileiro',platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/Dom_Casmurro'},
{id:4,title:'A Cartomante',author:'Machado de Assis',genre:'Conto',platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/A_Cartomante'},
{id:5,title:'Livro sem verificação',author:'Autor',genre:'Fantasia',platform:'Leia Paraná',access_url:'https://leiaparana.odilo.us/'}
]
test('pesquisa tolera acento ausente e erros curtos de digitação',()=>{
 assert.equal(searchBooks(readings,'hobit')[0].id,1)
 assert.equal(searchBooks(readings,'harry pottr')[0].id,2)
 assert.equal(searchBooks(readings,'dom casmuro')[0].id,3)
 assert.ok(bookSearchScore(readings[0],'hobit')>0)
})
test('pesquisa não devolve livros sem relação com consulta',()=>{
 assert.deepEqual(searchBooks(readings,'zimbábue'),[])
 assert.deepEqual(searchBooks(readings,''),readings)
 assert.equal(searchBooks(readings,'rowling')[0].id,2)
})
test('recomenda gêneros lidos ou desejados e exclui títulos já na lista',()=>{
 const result=recommendForReader(readings,[{book_id:1,status:'lido'}],5)
 assert.equal(result.personalized,true)
 assert.equal(result.books[0].id,2)
 assert.equal(result.books.some(book=>book.id===1),false)
 assert.equal(result.books.some(book=>book.id===5),false)
})
test('sem histórico não inventa personalização',()=>{
 const result=recommendForReader(readings,[],3)
 assert.equal(result.personalized,false)
 assert.equal(result.books.length,3)
})
test('itens de diferentes usuários não entram em uma mesma recomendação',()=>{
 const own=recommendForReader(readings,[{book_id:3,status:'quero_ler'}],3)
 assert.equal(own.personalized,true)
 assert.equal(own.books.some(book=>book.id===3),false)
 assert.equal(own.books[0].author,'Machado de Assis')
})
