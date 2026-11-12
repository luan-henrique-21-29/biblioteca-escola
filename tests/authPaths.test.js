import {test} from 'node:test'
import assert from 'node:assert/strict'
import {getAuthRedirectUrl} from '../src/authPaths.js'

test('Google OAuth retorna para o caminho do GitHub Pages',()=>{
  assert.equal(getAuthRedirectUrl('/biblioteca-escola/','https://luan-henrique-21-29.github.io'),
    'https://luan-henrique-21-29.github.io/biblioteca-escola/')
})
test('desenvolvimento local retorna para a raiz',()=>{
  assert.equal(getAuthRedirectUrl('/','http://localhost:5173'),'http://localhost:5173/')
})
