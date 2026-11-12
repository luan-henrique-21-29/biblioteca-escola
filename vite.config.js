import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages publica este repositório em /biblioteca-escola/.
// No desenvolvimento local e em outras hospedagens mantemos a base '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/biblioteca-escola/' : '/'
})
