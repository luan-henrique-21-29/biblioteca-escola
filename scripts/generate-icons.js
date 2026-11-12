// Gera ícones PNG diretamente com Node.js, sem fontes ou bibliotecas extras.
// Símbolo original de livro aberto em branco, fundo azul-escuro.
import {deflateSync} from 'node:zlib'
import {writeFileSync,mkdirSync} from 'node:fs'
import {join} from 'node:path'

const table=new Uint32Array(256)
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=table[(c^byte)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function chunk(type,bytes){
 const body=Buffer.concat([Buffer.from(type),bytes])
 const header=Buffer.alloc(4);header.writeUInt32BE(bytes.length)
 const trailer=Buffer.alloc(4);trailer.writeUInt32BE(crc32(body))
 return Buffer.concat([header,body,trailer])
}
function render(n){
 const raw=Buffer.alloc((n*4+1)*n)
 for(let y=0;y<n;y++){
  const row=y*(n*4+1);raw[row]=0
  for(let x=0;x<n;x++){
   const u=x/n,v=y/n
   let rgb=[23,59,100]
   const left=u>.19&&u<.485&&v>.29+.035*Math.sin(u*14)&&v<.72+.03*(u-.36)
   const right=u>=.515&&u<.81&&v>.29+.035*Math.sin(u*14)&&v<.72-.03*(u-.65)
   const center=u>.485&&u<.515&&v>.32&&v<.74
   if(left||right)rgb=[247,250,255]
   if(center)rgb=[126,175,220]
   const line=((left&&u>.24&&u<.43)||(right&&u>.57&&u<.76))
   if(line&&(Math.abs(v-.45)<.008||Math.abs(v-.56)<.008))rgb=[159,189,220]
   const p=row+1+x*4;raw[p]=rgb[0];raw[p+1]=rgb[1];raw[p+2]=rgb[2];raw[p+3]=255
  }
 }
 const sig=Buffer.from([137,80,78,71,13,10,26,10])
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(n,0);ihdr.writeUInt32BE(n,4);ihdr[8]=8;ihdr[9]=6
 const png=Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])
 return png
}
mkdirSync('public',{recursive:true})
for(const n of [192,512]){
 const filepath=join('public','pwa-'+n+'.png')
 writeFileSync(filepath,render(n))
 console.log('Ícone PWA gerado:',filepath)
}
