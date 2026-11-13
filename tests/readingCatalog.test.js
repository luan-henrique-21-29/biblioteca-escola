import test from 'node:test'
import assert from 'node:assert/strict'
import {PUBLIC_READINGS,LEIA_PARANA_URL,urlForBook,NORMALIZE_TITLE,isLeia} from '../src/readingCatalog.js'

test('todas as referências do Leia Paraná levam apenas ao site oficial validado',()=>{
  const leia=PUBLIC_READINGS.filter(isLeia)
  assert.equal(leia.length,6)
  for(const book of leia){
    assert.equal(urlForBook(book),LEIA_PARANA_URL)
    assert.ok(book.genre&&book.published_year&&book.synopsis)
  }
})
test('links externos não confiáveis são rejeitados, sem inserir endereços falsos',()=>{
  assert.equal(urlForBook({platform:'Wikisource',access_url:'https://exemplo.tld/teste'}),null)
  assert.equal(urlForBook({platform:'Wikisource',access_url:'javascript:alert(1)'}),null)
  assert.equal(urlForBook({platform:'Leia Paraná',access_url:'https://site-invalido.test/livro/123'}),LEIA_PARANA_URL)
  assert.equal(urlForBook({platform:'Wikisource',access_url:'https://pt.wikisource.org/wiki/O_Alienista'}),'https://pt.wikisource.org/wiki/O_Alienista')
})
test('títulos sem acento podem ser pareados entre as versões física e digital',()=>{
  assert.equal(NORMALIZE_TITLE('Memórias Póstumas de Brás Cubas'),NORMALIZE_TITLE('memorias postumas de bras cubas'))
})
