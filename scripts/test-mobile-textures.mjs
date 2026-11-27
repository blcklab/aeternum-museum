import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const root=new URL('../',import.meta.url), read=async f=>JSON.parse(await readFile(new URL(f,root)))
const {artworks}=await read('assets/museum/manifest.json'), index=await read('assets/museum/mobile-textures.json'), world=await read('world.anyo.json')
const hash=b=>createHash('sha256').update(b).digest('hex')
assert.equal(index.schema,'blcklab-museum-mobile-textures@1');assert.equal(world.revision,34)
for(const [profile,edge] of [['mobile',1024],['mobile-low',768]]){
 const p=index.profiles[profile];assert.equal(p.maxEdge,edge)
 const expected=artworks.filter(a=>a.displayByDefault&&Math.max(a.width,a.height)>edge)
 assert.deepEqual(p.artworks.map(a=>a.artworkId),expected.map(a=>a.id));assert.deepEqual(world.data.museum.mobileTextures.profiles[profile],{maxEdge:edge,artworkIds:expected.map(a=>a.id)})
 for(const a of expected){const v=p.artworks.find(x=>x.artworkId===a.id);assert.equal(v.image,`variants/${profile}/${a.id}.webp`);assert.equal(v.sourceSha256,a.sha256);assert.equal(Math.max(v.width,v.height),edge);assert.ok(Math.abs(v.width/v.height-a.width/a.height)<.02);const b=await readFile(new URL('assets/museum/'+v.image,root));assert.equal(b.length,v.imageBytes);assert.equal(hash(b),v.sha256)}
}
console.log('Mobile texture checks PASS: complete source coverage, bounded dimensions, hashes and embedded profile index.')
