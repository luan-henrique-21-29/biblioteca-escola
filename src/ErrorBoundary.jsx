import React from 'react'
import {AlertTriangle, RefreshCw, BookOpen} from 'lucide-react'
export default class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false}}
  static getDerivedStateFromError(){return {failed:true}}
  componentDidCatch(error,details){console.error('Biblioteca Joaquim: erro de interface',error,details)}
  render(){
    if(!this.state.failed)return this.props.children
    return <main style={{maxWidth:680,margin:'10vh auto',padding:28,fontFamily:'Arial,sans-serif',color:'#15385d'}}>
      <BookOpen size={37}/><h1>Biblioteca Joaquim</h1>
      <div role="alert" style={{padding:24,background:'#f0f5fb',border:'1px solid #d7e4f1',borderRadius:14}}>
        <AlertTriangle size={30}/><h2>Não foi possível exibir esta tela.</h2>
        <p>O aplicativo encontrou um problema inesperado. Seus dados salvos no banco de dados não foram apagados.</p>
        <button onClick={()=>window.location.reload()} style={{padding:13,border:0,background:'#173b64',color:'#fff',borderRadius:8,cursor:'pointer',display:'inline-flex',gap:8,alignItems:'center'}}><RefreshCw size={17}/> Recarregar aplicativo</button>
        <p style={{fontSize:13,color:'#677d97',marginTop:20}}>Se continuar, envie um print da tela ao responsável pelo projeto.</p>
      </div>
    </main>
  }
}
