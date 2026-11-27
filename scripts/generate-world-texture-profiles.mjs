import {readFile,writeFile,access} from 'node:fs/promises'
const root=new URL('../',import.meta.url)
const index=JSON.parse(await readFile(new URL('assets/museum/mobile-textures.json',root),'utf8'))
const profiles={}
for(const [name,profile] of Object.entries(index.profiles)){
 const images=[]
 for(const artwork of profile.artworks){
  const target='assets/museum/'+artwork.image
  await access(new URL(target,root))
  for(const source of [`assets/museum/paintings/${artwork.artworkId}.webp`,`assets/museum/variants/balanced/${artwork.artworkId}.webp`]){
   try{await access(new URL(source,root))}catch{continue}
   images.push({source,file:target})
  }
 }
 profiles[name]={maxEdge:profile.maxEdge,images}
}
await writeFile(new URL('assets/museum/world-texture-profiles.json',root),JSON.stringify({schema:'anyo-texture-profiles@1',profiles},null,2)+'\n')
console.log('World texture profiles generated:',Object.entries(profiles).map(([n,p])=>`${n}: ${p.images.length} source paths`).join(', '))
