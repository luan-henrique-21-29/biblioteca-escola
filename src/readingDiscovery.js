import {NORMALIZE_TITLE,isLeia,isVerifiedLeia} from './readingCatalog.js'

const wordParts=value=>NORMALIZE_TITLE(value).split(/[^a-z0-9]+/).filter(Boolean)
const similar=(a,b)=>{
  if(a===b)return true
  if(a.length>=3&&(b.startsWith(a)||a.startsWith(b)))return true
  if(a.length<4||b.length<4||Math.abs(a.length-b.length)>2)return false
  const limit=a.length>=8?2:1
  let previous=Array.from({length:b.length+1},(_,i)=>i)
  for(let i=1;i<=a.length;i++){
    const current=[i]
    let smallest=i
    for(let j=1;j<=b.length;j++){
      const distance=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1))
      current.push(distance)
      smallest=Math.min(smallest,distance)
    }
    if(smallest>limit)return false
    previous=current
  }
  return previous[b.length]<=limit
}

export function bookSearchScore(book,query){
  const search=NORMALIZE_TITLE(query)
  if(!search)return 1
  const title=NORMALIZE_TITLE(book.title)
  const author=NORMALIZE_TITLE(book.author)
  const genre=NORMALIZE_TITLE(book.genre)
  const synopsis=NORMALIZE_TITLE(book.synopsis||book.note)
  if(title===search)return 120
  if(title.startsWith(search))return 100
  if(title.includes(search))return 90
  if(author.includes(search))return 75
  if(genre.includes(search))return 65
  const terms=wordParts(search)
  if(!terms.length)return 1
  const titleTerms=wordParts(title),authorTerms=wordParts(author),genreTerms=wordParts(genre),synopsisTerms=wordParts(synopsis)
  let score=0
  for(const term of terms){
    if(titleTerms.some(word=>word===term))score+=35
    else if(titleTerms.some(word=>similar(term,word)))score+=23
    else if(authorTerms.some(word=>similar(term,word)))score+=18
    else if(genreTerms.some(word=>similar(term,word)))score+=12
    else if(synopsisTerms.some(word=>word===term||(term.length>5&&word.startsWith(term))))score+=5
    else return 0
  }
  return score
}
export function searchBooks(books,query){
  if(!NORMALIZE_TITLE(query))return [...books]
  return books.map((book,index)=>({book,index,score:bookSearchScore(book,query)}))
    .filter(item=>item.score>0)
    .sort((a,b)=>b.score-a.score||a.index-b.index)
    .map(item=>item.book)
}

export function recommendForReader(books,progress,limit=8){
  const eligible=books.filter(book=>book.platform==='Wikisource'||(isLeia(book)&&isVerifiedLeia(book)))
  const read=Array.isArray(progress)?progress:[]
  const saved=new Set(read.map(item=>Number(item.book_id)))
  const genreWeights=new Map()
  const authorWeights=new Map()
  for(const entry of read){
    const book=eligible.find(x=>Number(x.id)===Number(entry.book_id))
    if(!book)continue
    const weight=entry.status==='lido'?3:entry.status==='lendo'?4:2
    const genre=NORMALIZE_TITLE(book.genre)
    const author=NORMALIZE_TITLE(book.author)
    genreWeights.set(genre,(genreWeights.get(genre)||0)+weight)
    authorWeights.set(author,(authorWeights.get(author)||0)+weight)
  }
  const recommendations=eligible.filter(book=>!saved.has(Number(book.id)))
    .map((book,index)=>({
      book,index,score:(genreWeights.get(NORMALIZE_TITLE(book.genre))||0)*10
        +(authorWeights.get(NORMALIZE_TITLE(book.author))||0)*3
    }))
    .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit)
  return {books:recommendations.map(x=>x.book),
    personalized:genreWeights.size>0,
    genres:[...genreWeights.entries()].sort((a,b)=>b[1]-a[1]).map(([genre])=>genre).slice(0,3)}
}
