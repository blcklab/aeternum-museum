// Pure collection and geometry helpers shared by the UI and offline tests.
export function originalUrl(root, path) {
  if(typeof path!=='string'||!/^\.\/assets\/museum\/paintings\/[a-zA-Z0-9_-]+\.webp$/.test(path)) throw Error('Invalid original artwork path')
  return new URL(path,root).href
}
export function filterExhibits(records, query='', room='') {
  const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return records.filter(r=>(!room||r.room===room)&&words.every(w=>[r.title,r.artist,r.date,r.gallery].join(' ').toLowerCase().includes(w)))
}
export function fitScale(width,height,viewportWidth,viewportHeight) {
  return Math.max(.01,Math.min(1,(viewportWidth-32)/width,(viewportHeight-32)/height))
}
export function safeSource(value){try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:null}catch{return null}}
