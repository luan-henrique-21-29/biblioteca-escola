import {test} from 'node:test'
import assert from 'node:assert/strict'
import {getSupabaseConfigStatus} from '../src/configStatus.js'

test('sem projeto o site permanece na tela de configuração, sem falhar ao importar cliente',()=>{
 assert.equal(getSupabaseConfigStatus('','').ready,false)
 assert.equal(getSupabaseConfigStatus('https://SEU-PROJETO.supabase.co','SUA_CHAVE_PUBLICAVEL_ANON').ready,false)
})
test('URL inválida e insegura não aciona o login',()=>{
 assert.equal(getSupabaseConfigStatus('not-a-url','publica').ready,false)
 assert.equal(getSupabaseConfigStatus('http://example.com','publica').ready,false)
 assert.equal(getSupabaseConfigStatus('https://user:pass@example.com','publica').ready,false)
})
test('projeto HTTPS e ambiente local são aceitos',()=>{
 assert.equal(getSupabaseConfigStatus('https://abc.supabase.co','sb_publishable_abcdefghijklmnop').ready,true)
 assert.equal(getSupabaseConfigStatus('http://localhost:54321','publica').ready,true)
 assert.equal(getSupabaseConfigStatus('https://biblioteca-joaquim-test.invalid','chave-publica-ficticia').ready,true)
})
