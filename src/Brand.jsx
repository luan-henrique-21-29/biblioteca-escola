import React from 'react'
import { BookOpen } from 'lucide-react'

// Identidade gráfica ORIGINAL da Biblioteca Joaquim; não pretende ser o brasão oficial do colégio.
export default function Brand({compact=false}) {
  return <div className={'brand '+(compact?'brand--compact':'')}>
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 27V19C9 11.3 19 7 32 7s23 4.3 23 12v8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M32 25c-7.4-5.7-14.4-5.7-23-3.4v25.7c8.1-2.4 16-2.1 23 3.6 7-5.7 14.9-6 23-3.6V21.6c-8.6-2.3-15.6-2.3-23 3.4Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
        <path d="M32 25v26M14 29c5.2-1.3 9.7-.7 13.5 1.9M50 29c-5.2-1.3-9.7-.7-13.5 1.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </span>
    <span className="brand-name"><strong>Biblioteca Joaquim</strong><small>Colégio Estadual Pref. Joaquim da Silva Mafra</small></span>
  </div>
}