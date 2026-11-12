import React from 'react'
import { BookOpenText } from 'lucide-react'
// Emblema mostrado em material escolar divulgado pela Rádio Litorânea (2024).
// Recorte via CSS, sem alteração gráfica do emblema. Trocar pelo arquivo
// autorizado da instituição em produção para evitar dependência externa.
const PUBLICATION_IMAGE = 'https://litoranea.fm/wp-content/uploads/2024/01/495e1c5c-5185-47e7-94f1-6d66480e0a6e-1024x1024.jpg'
export default function Brand({compact=false}) {
  return <div className={'brand ' + (compact ? 'brand--compact' : '')}>
    <span className="brand-mark" title="Emblema do Colégio Joaquim Mafra, reproduzido de publicação escolar">
      <img src={PUBLICATION_IMAGE} alt="Emblema do Colégio Prefeito Joaquim da Silva Mafra" onError={e => {e.currentTarget.style.display='none'; e.currentTarget.parentElement.classList.add('brand-mark--fallback')}}/>
      <BookOpenText className="brand-fallback" size={30}/>
    </span>
    <span className="brand-name"><strong>Biblioteca Joaquim</strong><small>Colégio Pref. Joaquim da Silva Mafra</small></span>
  </div>
}
