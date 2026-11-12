import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import SetupGuide from './SetupGuide.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './styles.css'
import './demo.css'
import './setup.css'

// A demonstração deve abrir rapidamente, mesmo quando a escola ainda não
// configurou seu projeto Supabase. O painel real só é carregado quando necessário.
const connected=Boolean(import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('SEU-PROJETO'))
const RealApp=lazy(()=>import('./App.jsx'))
const content=connected
  ? <Suspense fallback={<div className="page-loading"><strong>Biblioteca Joaquim</strong><p>Carregando o aplicativo...</p></div>}><RealApp/></Suspense>
  : <SetupGuide/>

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary>{content}</ErrorBoundary></React.StrictMode>
)
