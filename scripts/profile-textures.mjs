import {readFile} from 'node:fs/promises'
const read=async f=>JSON.parse(await readFile(new URL('../'+f,import.meta.url),'utf8'))
const catalog=await read('assets/museum/manifest.json'), variants=await read('assets/museum/texture-variants.json'), {exhibits}=await read('assets/museum/exhibits.json'), {profile:activeProfile}=await read('scripts/texture-profile.json')
const mobileIndex=await read('assets/museum/mobile-textures.json'), mobileMaps=Object.fromEntries(Object.entries(mobileIndex.profiles).map(([id,p])=>[id,new Map(p.artworks.map(a=>[a.artworkId,a]))]))
const original=new Map(catalog.artworks.map(a=>[a.id,a])), balanced=new Map(variants.artworks.map(a=>[a.artworkId,a]))
const ids=[...new Set(exhibits.map(e=>e.artworkId))]
function estimate(profile){
 const select=id=>(profile==='balanced'?balanced.get(id):mobileMaps[profile]?.get(id))??original.get(id)
 const bytes=id=>{const a=select(id);return a.width*a.height*4}
 return {uniqueRGBABytes:ids.reduce((s,id)=>s+bytes(id),0),perPlacementRGBABytes:exhibits.reduce((s,e)=>s+bytes(e.artworkId),0),uniqueEncodedBytes:ids.reduce((s,id)=>s+select(id).imageBytes,0)}
}
const hd=estimate('hd'),b=estimate('balanced'),audit={kind:'estimated-uncompressed-RGBA8-not-GPU-telemetry',activeProfile,uniqueExhibitedArtworks:ids.length,placements:exhibits.length,variants:balanced.size,hd,balanced:b,mobile:estimate('mobile'),'mobile-low':estimate('mobile-low'),uniqueReductionPercent:100*(1-b.uniqueRGBABytes/hd.uniqueRGBABytes)}
if(process.argv.includes('--json'))console.log(JSON.stringify(audit,null,2))
else{
 const mib=n=>(n/1048576).toFixed(1)+' MiB'
 console.log(`Active profile: ${activeProfile}; ${ids.length} unique artworks / ${exhibits.length} placements`)
 console.table(Object.fromEntries(Object.entries({hd,balanced:b,mobile:audit.mobile,'mobile-low':audit['mobile-low']}).map(([k,v])=>[k,{uniqueRGBA:mib(v.uniqueRGBABytes),perPlacementRGBA:mib(v.perPlacementRGBABytes),encoded:mib(v.uniqueEncodedBytes)}])))
 console.log(`Estimated unique decoded pixel reduction: ${audit.uniqueReductionPercent.toFixed(1)}%`)
 console.log('Excludes mipmaps, text, architecture, GPU allocation overhead, and runtime sharing/eviction. Not measured GPU memory.')
}
