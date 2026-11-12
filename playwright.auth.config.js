import {defineConfig} from '@playwright/test'

// Usa apenas uma URL e chave de teste fictícias. Nenhuma conta ou banco
// verdadeiro é acessado: a verificação cobre o layout e o fluxo inicial.
export default defineConfig({
 testDir:'./tests/auth',
 timeout:30000,
 use:{baseURL:'http://127.0.0.1:4174/biblioteca-escola/',browserName:'chromium'},
 reporter:'list',
 webServer:{
   command:'GITHUB_PAGES=true VITE_SUPABASE_URL=https://biblioteca-joaquim-test.invalid VITE_SUPABASE_ANON_KEY=chave-publica-ficticia npm run build && npm run preview -- --host 127.0.0.1 --port 4174',
   url:'http://127.0.0.1:4174/biblioteca-escola/',
   reuseExistingServer:false,
   timeout:120000
 }
})
