import {readFile,stat} from 'node:fs/promises'
import {gzipSync,brotliCompressSync,constants} from 'node:zlib'
const root=new URL('../',import.meta.url)
const source=await readFile(new URL('world.anyo.json',root)), world=JSON.parse(source)
const artworkUrls=world.entities.filter(e=>e.type==='image').map(e=>e.src)
const urls=[...new Set([...artworkUrls,...Object.values(world.assets??{}).filter(a=>a.type==='texture').map(a=>a.src)])]
const sizes=await Promise.all(urls.map(url=>stat(new URL(url,root)).then(s=>s.size)))
const raw=source.length,gzip=gzipSync(source).length,br=brotliCompressSync(source,{params:{[constants.BROTLI_PARAM_QUALITY]:4}}).length
const result={kind:'encoded-body-size-not-network-timing',world:{raw,gzip,brotli:br,gzipReductionPercent:100*(1-gzip/raw),brotliReductionPercent:100*(1-br/raw)},artworkPlacements:artworkUrls.length,uniqueArtworkUrls:new Set(artworkUrls).size,uniqueTextureUrls:urls.length,uniqueTextureBytes:sizes.reduce((a,b)=>a+b,0)}
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2))
else {console.table(result.world);console.log(`${result.uniqueArtworkUrls} unique artwork URLs / ${result.artworkPlacements} placements; ${result.uniqueTextureUrls} total distinct texture URLs, ${(result.uniqueTextureBytes/1048576).toFixed(2)} MiB of encoded files.`);console.log('Sizes exclude HTTP headers and latency; caching and transfer depend on the host and client.')}
