// Local review only. Do not upload before rights and acceptance gates pass.
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const dist = path.join(root, 'dist'), destination = path.join(dist, 'site-preview')
const allowed = ['world.anyo.json','anyo.project.json','assets','web-surface']
const extensions = new Set(['.json','.html','.css','.js','.mjs','.svg','.webp','.png','.jpg','.jpeg','.mp3','.ogg','.txt','.gif','.ico','.woff','.woff2','.glb','.gltf','.vrm','.vrma','.ktx2','.hdr','.wasm','.mp4','.webm'])
async function hash(file) {
  const h=createHash('sha256')
  for await (const chunk of createReadStream(file)) h.update(chunk)
  return h.digest('hex')
}
async function exists(file) { try { return await lstat(file) } catch(e) { if(e.code==='ENOENT') return null; throw e } }
async function collect(rel,files) {
  const file=path.join(root,rel),info=await lstat(file)
  if(info.isSymbolicLink()) throw Error('Refusing symbolic link: '+rel)
  if(info.isDirectory()) {
    for(const name of (await readdir(file)).sort()) {
      if(name==='.gitkeep') continue
      if(name.startsWith('.')||name==='node_modules') throw Error('Unexpected private path: '+rel+'/'+name)
      await collect(rel+'/'+name,files)
    }
  } else {
    if(!info.isFile()||!extensions.has(path.extname(file).toLowerCase())) throw Error('Unexpected runtime file: '+rel)
    files.push({path:rel,bytes:info.size,sha256:await hash(file)})
  }
}
const files=[]
for(const rel of allowed) await collect(rel,files)
const fileSet=new Set(files.map(f=>f.path))
const world=JSON.parse(await readFile(path.join(root,'world.anyo.json'),'utf8'))
for(const [id,asset] of Object.entries(world.assets??{})) {
  if(typeof asset.src!=='string'||!asset.src.startsWith('./')||!fileSet.has(asset.src.slice(2))) throw Error('Missing or nonlocal runtime asset: '+id)
}
for(const file of ['assets/audio/soundscapes.json','web-surface/reception/index.html','web-surface/artwork-viewer/index.html']) if(!fileSet.has(file)) throw Error('Missing runtime entry: '+file)
const previousDist=await exists(dist)
if(previousDist&&(!previousDist.isDirectory()||previousDist.isSymbolicLink())) throw Error('Unsafe dist directory')
await mkdir(dist,{recursive:true})
const previous=await exists(destination)
if(previous&&(!previous.isDirectory()||previous.isSymbolicLink())) throw Error('Unsafe preview destination')
const inventoryPath=path.join(dist,'review-inventory.json'),oldInventory=await exists(inventoryPath)
if(oldInventory&&(!oldInventory.isFile()||oldInventory.isSymbolicLink())) throw Error('Unsafe inventory destination')
const temp=await mkdtemp(path.join(dist,'.site-preview-'))
try {
  for(const file of files) {
    const target=path.join(temp,file.path)
    await mkdir(path.dirname(target),{recursive:true})
    await copyFile(path.join(root,file.path),target)
    if(await hash(target)!==file.sha256) throw Error('Copy integrity mismatch: '+file.path)
  }
  if(previous) await rm(destination,{recursive:true})
  await rename(temp,destination)
} finally { await rm(temp,{recursive:true,force:true}) }
const inventory={schema:'aeternum-review-inventory@1',status:'review-only-rights-and-acceptance-pending',revision:world.revision,files}
await writeFile(inventoryPath,JSON.stringify(inventory,null,2)+'\n')
console.log(`Review-only export: ${files.length} files, ${files.reduce((n,f)=>n+f.bytes,0)} bytes; ${destination}`)
console.log('Do not publish until M8 rights and acceptance gates pass.')
