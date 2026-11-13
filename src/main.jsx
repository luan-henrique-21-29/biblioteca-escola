import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import SetupGuide from './SetupGuide.jsx'
import {getSupabaseConfigStatus} from './configStatus.js'
import {projectUrl,publishableKey} from './publicSupabaseConfig.js'
import ErrorBoundary from './ErrorBoundary.jsx'
import './styles.css'
import './demo.css'
import './demo-v2.css'
import './setup.css'
import './circulation.css'
import './highlights.css'
import './mobile.css'
import './reports.css'
import './preview.css'

// A demonstração deve abrir rapidamente, mesmo quando a escola ainda não
// configurou seu projeto Supabase. O painel real só é carregado quando necessário.
const connection=getSupabaseConfigStatus(import.meta.env.VITE_SUPABASE_URL||projectUrl,import.meta.env.VITE_SUPABASE_ANON_KEY||publishableKey)
const connected=connection.ready
const RealApp=lazy(()=>import('./App.jsx'))
const content=connected
  ? <Suspense fallback={<div className="page-loading"><strong>Biblioteca Joaquim</strong><p>Carregando o aplicativo...</p></div>}><RealApp/></Suspense>
  : <SetupGuide configMessage={connection.reason}/>

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary>{content}</ErrorBoundary></React.StrictMode>
)


// A versão instalável continua precisando de internet para contas e operações.
// O service worker não armazena respostas do Supabase nem dados pessoais.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL})
      .catch(error=>console.warn('Não foi possível registrar o aplicativo instalável.',error))
  })
}
