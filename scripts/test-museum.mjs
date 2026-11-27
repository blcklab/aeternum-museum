import assert from 'node:assert/strict'
import {readFile, stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
const read=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'))
const world=await read('world.anyo.json'), catalog=await read('assets/museum/manifest.json'), index=await read('assets/museum/exhibits.json')
const hash=b=>createHash('sha256').update(b).digest('hex')
const art=new Map(catalog.artworks.map(a=>[a.id,a])), entities=new Map(world.entities.map(e=>[e.id,e])), rooms=new Map(world.building.floors.flatMap(f=>f.rooms.map(r=>[r.id,r])))
assert.equal(art.size,catalog.artworks.length); assert.equal(entities.size,world.entities.length)
assert.equal(rooms.size,catalog.categories.length+2)
// Resolve authored attachments using their documented center-aligned geometry.
// This is a project-level geometry regression, not the engine compiler.
const T=world.building.defaults.wallThickness
const spine=rooms.get('spine')
assert.ok(spine.position && !spine.attachTo)
for(const r of rooms.values())if(r.id!==spine.id){
 const a=r.attachTo;assert.ok(a,`${r.id} must attach to its shared-wall owner`)
 assert.equal(a.room,spine.id);assert.equal(a.gap,0);assert.equal(a.align,'center');assert.ok(!r.position)
 const parent=rooms.get(a.room), horizontal=['north','south'].includes(a.wall), normal=horizontal?1:0,tangent=1-normal, sign=['south','east'].includes(a.wall)?1:-1
 r.position=[...parent.position];r.position[normal]+=sign*(parent.size[normal]+r.size[normal])/2;r.position[tangent]+=a.offset
 assert.ok(r.openings.some(o=>o.targetRoom===parent.id))
}
// Every overlapping collinear boundary must have exactly one declared owner.
// Unattached siblings must leave sufficient clearance between their wall shells.
const allRooms=[...rooms.values()]
for(let i=0;i<allRooms.length;i++)for(let j=i+1;j<allRooms.length;j++){
 const a=allRooms[i],b=allRooms[j]
 for(let axis=0;axis<2;axis++){
  const tang=1-axis, overlap=Math.min(a.position[tang]+a.size[tang]/2,b.position[tang]+b.size[tang]/2)-Math.max(a.position[tang]-a.size[tang]/2,b.position[tang]-b.size[tang]/2)
  if(overlap<=1e-6)continue
  const gap=Math.abs(a.position[axis]-b.position[axis])-(a.size[axis]+b.size[axis])/2
  if(Math.abs(gap)<1e-6){
   const child=a.attachTo?.room===b.id?a:b.attachTo?.room===a.id?b:null
   assert.ok(child,`Unowned coincident wall: ${a.id} / ${b.id}`)
   const parent=rooms.get(child.attachTo.room)
   const expected=axis===0?(child.position[axis]>parent.position[axis]?'east':'west'):(child.position[axis]>parent.position[axis]?'south':'north')
   assert.equal(child.attachTo.wall,expected)
  }else assert.ok(gap>=T,`Wall shells overlap: ${a.id} / ${b.id} (${gap})`)
 }
}

for(const a of art.values()){
 const f=path.resolve(root,'assets/museum',a.image)
 assert.ok(f.startsWith(path.resolve(root,'assets/museum/paintings')+path.sep))
 const b=await readFile(f);assert.equal(b.length,a.imageBytes);assert.equal(hash(b),a.sha256);assert.equal(b.subarray(8,12).toString(),'WEBP');assert.ok(a.width>0&&a.height>0);assert.ok(a.description&&a.source&&a.license)
}
const expected=catalog.categories.flatMap(c=>c.artworkIds.filter(id=>art.get(id)?.displayByDefault).map(id=>`${c.id}:${id}`))
assert.deepEqual(index.exhibits.map(e=>`${e.category}:${e.artworkId}`).sort(),expected.sort())
assert.equal(new Set(index.exhibits.map(e=>e.artworkId)).size,catalog.defaultDisplayCount)
const {profile:textureProfile}=await read('scripts/texture-profile.json')
assert.ok(['hd','balanced'].includes(textureProfile))
const textureIndex=await read('assets/museum/texture-variants.json')
assert.equal(textureIndex.schema,'blcklab-museum-texture-variants@1')
assert.equal(textureIndex.maxEdge,1536)
const balancedTextures=new Map(textureIndex.artworks.map(v=>[v.artworkId,v]))
assert.equal(balancedTextures.size,textureIndex.artworks.length)
for(const a of art.values()){
 const v=balancedTextures.get(a.id), needed=a.displayByDefault&&Math.max(a.width,a.height)>textureIndex.maxEdge
 assert.equal(!!v,needed,`Variant coverage: ${a.id}`)
 if(!v)continue
 assert.equal(v.sourceSha256,a.sha256);assert.equal(v.image,`variants/balanced/${a.id}.webp`)
 assert.equal(Math.max(v.width,v.height),textureIndex.maxEdge)
 assert.ok(v.width<=a.width&&v.height<=a.height&&v.width*v.height<a.width*a.height)
 assert.ok(Math.abs(v.width/a.width-v.height/a.height)<=1/Math.min(a.width,a.height))
 const b=await readFile(path.join(root,'assets/museum',v.image))
 assert.equal(b.length,v.imageBytes);assert.equal(hash(b),v.sha256);assert.equal(b.subarray(8,12).toString(),'WEBP')
}
const occupied=new Map()
for(const e of index.exhibits){
 const a=art.get(e.artworkId), image=entities.get(e.entityId), r=rooms.get(e.room)
 assert.equal(image.type,'image');assert.equal(image.src,'./assets/museum/'+(textureProfile==='balanced'?(balancedTextures.get(a.id)?.image??a.image):a.image));assert.equal(image.surface.room,r.id);assert.equal(image.surface.wall,e.wall);assert.equal(image.surface.offset[0],e.offset);assert.ok(image.surface.depth>=.15);assert.equal(image.interaction.action,'inspect-exhibit');assert.ok(image.interaction.params.copy.includes(a.description));assert.ok(Math.abs(image.size[0]/image.size[1]-a.width/a.height)<.0001)
 const span=['north','south'].includes(e.wall)?r.size[0]:r.size[1], half=image.size[0]/2+.09
 assert.ok(Math.abs(e.offset)+half<span/2-.1)
 assert.ok(!r.openings.some(o=>o.wall===e.wall));assert.ok(entities.has(e.entityId+'-back'));assert.ok(entities.has(e.entityId+'-credit'))
 const key=e.room+':'+e.wall, slots=occupied.get(key)||[];for(const [l,h] of slots)assert.ok(e.offset+half<=l||e.offset-half>=h);slots.push([e.offset-half,e.offset+half]);occupied.set(key,slots)
}
assert.equal(world.entities.filter(e=>e.type==='image').length,index.exhibits.length)
for(const r of rooms.values())for(const o of r.openings){
 const t=rooms.get(o.targetRoom);assert.ok(t);const opposite={north:'south',south:'north',east:'west',west:'east'}[o.wall];const back=t.openings.find(x=>x.targetRoom===r.id&&x.wall===opposite);assert.ok(back);assert.equal(back.width,o.width);assert.equal(back.height,o.height)
 const horizontal=['north','south'].includes(o.wall), normal=horizontal?1:0,tangent=1-normal,sign=['south','east'].includes(o.wall)?1:-1
 assert.equal(r.position[normal]+sign*r.size[normal]/2,t.position[normal]-sign*t.size[normal]/2)
 const center=(room,op)=>room.position[tangent]+(op.offset==='center'?0:op.offset-room.size[tangent]/2)
 assert.equal(center(r,o),center(t,back));assert.ok(o.open&&!o.collision)
}
for(const r of rooms.values())for(const t of rooms.values())if(r.id!==t.id){const overlap=r.position.every((p,i)=>Math.abs(p-t.position[i])<(r.size[i]+t.size[i])/2-1e-6);assert.ok(!overlap,`${r.id}/${t.id} overlap`)}
const seen=new Set(),pending=[world.exploration.spawn.room];while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);pending.push(...rooms.get(id).openings.map(o=>o.targetRoom))}assert.equal(seen.size,rooms.size)
for(const e of entities.values()){if(e.type==='text'&&e.surface)assert.ok(e.surface.depth>=.12);if(e.room)assert.ok(rooms.has(e.room));if(e.surface)assert.ok(rooms.has(e.surface.room));if(e.material)assert.ok(world.materials[e.material])}
// Architectural detail regression: native decorative boxes remain inside the room,
// do not intrude into the doorway aperture, and leave artwork bounds untouched.
const detail=world.entities.filter(e=>e.id.startsWith('detail-'))
const EPS=1e-4
const overlap=(a,b,c,d)=>Math.min(b,d)-Math.max(a,c)>EPS
for(const e of detail){
 assert.equal(e.type,'box');assert.equal(e.collision,false);assert.ok(e.size.every(v=>v>0));
 const r=rooms.get(e.room),[w,d]=r.size,[x,y,z]=e.position,[length,height,thickness]=e.size
 const across=Math.abs(e.rotation[1])>1, wall=across?(x<0?'west':'east'):(z<0?'north':'south')
 const tangent=across?z:x, half=(across?d:w)/2, normal=across?x:z, normalHalf=(across?w:d)/2
 const distance=normalHalf-Math.abs(normal)-T/2
 const left=tangent-length/2,right=tangent+length/2,bottom=y-height/2,top=y+height/2
 assert.ok(left>=-half-EPS&&right<=half+EPS&&bottom>=-EPS&&top<=r.height+EPS,`Detail outside wall: ${e.id}`)
 assert.ok(distance-thickness/2>=-EPS&&distance+thickness/2<=.10+EPS,`Detail clearance: ${e.id}`)
 for(const o of r.openings.filter(o=>o.wall===wall)){
   const center=o.offset==='center'?0:o.offset-half
   assert.ok(!(overlap(left,right,center-o.width/2,center+o.width/2)&&overlap(bottom,top,o.elevation??0,(o.elevation??0)+o.height)),`Detail blocks opening: ${e.id}`)
 }
 for(const exhibit of index.exhibits.filter(a=>a.room===r.id&&a.wall===wall)){
   const img=entities.get(exhibit.entityId),[iw,ih]=img.size,cy=r.height/2+img.surface.offset[1],cx=img.surface.offset[0]
   assert.ok(!(overlap(left,right,cx-iw/2-.09,cx+iw/2+.09)&&overlap(bottom,top,cy-ih/2-.09,cy+ih/2+.09)),`Detail overlaps frame: ${e.id}`)
 }
}
for(const r of rooms.values())for(const wall of ['north','south','east','west']){
 const id=`detail-${r.id}-${wall}`
 assert.ok(entities.has(id+'-crown')&&entities.has(id+'-crown-edge'))
 assert.ok(detail.some(e=>e.id.startsWith(id+'-base-')))
 for(const o of r.openings.filter(o=>o.wall===wall))for(const part of ['jamb-left','jamb-right','lintel'])assert.ok(entities.has(`${id}-${o.id}-${part}`))
}
console.log(`Architectural detail checks PASS: ${detail.length} non-colliding trim/casing/sign elements; wall bounds, opening clearance and exhibit separation.`)
// Floor materials are authored on the original slabs, with world-size-aware repeat.
const expectedFloors={marble:['ivory-marble',2],oak:['oak-herringbone',1.6],limestone:['pale-limestone',2],stone:['charcoal-stone',2]}
const floorTextures=new Set()
// Verify the runtime asset-registry contract, not merely the existence of a path.
const textureFields=['baseColorTexture','normalTexture','roughnessTexture','metalnessTexture','metallicRoughnessTexture','emissiveTexture','occlusionTexture','lightMapTexture']
for(const [materialId,material] of Object.entries(world.materials))for(const field of textureFields){
 const id=material[field];if(typeof id!=='string')continue
 const asset=world.assets?.[id]
 assert.ok(asset,`${materialId}.${field}: unregistered texture asset ${id}`)
 assert.ok(['texture','image'].includes(asset.type),`${id}: invalid material asset type`)
 assert.equal(asset.format,'webp');assert.ok(asset.src.startsWith('./assets/'));assert.ok((await stat(path.resolve(root,asset.src))).isFile())
}
for(const r of rooms.values()){
 const c=r.id.slice(0,2), kind=['lobby','spine'].includes(r.id)?'marble':['04','05'].includes(c)?'limestone':['08','10','11','12','13'].includes(c)?'stone':'oak'
 const [file,meters]=expectedFloors[kind], m=world.materials[r.materials.floor]
 assert.ok(r.materials.floor.startsWith(`floor-${kind}-`),r.id)
 assert.equal(m.baseColorTexture,`floor-texture-${file}`)
 assert.deepEqual(world.assets[m.baseColorTexture],{type:'texture',format:'webp',src:`./assets/architecture/floors/${file}.webp`})
 assert.equal(m.textureWrap,'repeat');assert.equal(m.metalness,0);assert.ok(m.roughness>=.4&&m.roughness<=.9)
 assert.deepEqual(m.textureTransform.scale,r.size.map(v=>Math.round(v/meters*1e5)/1e5))
 floorTextures.add(world.assets[m.baseColorTexture].src)
}
assert.equal(floorTextures.size,4)
let floorBytes=0
for(const file of floorTextures){
 const bytes=await readFile(path.resolve(root,file));assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.ok(bytes.length<1_000_000);floorBytes+=bytes.length
}
assert.ok(floorBytes<250_000)
console.log(`Floor checks PASS: ${rooms.size} native floor materials assigned, ${floorTextures.size} texture assets (${floorBytes} bytes), world-size texture repeat and references.`)
// M4.4: independently project native boxes onto their wall to verify clear bays.
const wallDecor=world.entities.filter(e=>/^(pilaster|panel)-/.test(e.id))
const columns=world.entities.filter(e=>e.id.startsWith('column-lobby-'))
const newDecorIds=new Set([...wallDecor,...columns].map(e=>e.id))
function projectedBounds(e,r,wall){
 const vertical=wall==='east'||wall==='west', sign=wall==='east'||wall==='south'?1:-1
 if(e.surface?.room===r.id&&e.surface.wall===wall){
  const [x,y]=e.surface.offset,[w,h]=e.size,cy=r.height/2+y
  return [x-w/2,x+w/2,cy-h/2,cy+h/2]
 }
 if(e.type!=='box'||e.room!==r.id)return null
 const [x,y,z]=e.position,[w,h,d]=e.size,ang=e.rotation?.[1]??0
 const hx=(Math.abs(Math.cos(ang))*w+Math.abs(Math.sin(ang))*d)/2,hz=(Math.abs(Math.sin(ang))*w+Math.abs(Math.cos(ang))*d)/2
 const n=vertical?x:z,nh=vertical?hx:hz,t=vertical?z:x,th=vertical?hz:hx
 const gap=r.size[vertical?0:1]/2-T/2-sign*n-nh
 if(gap>.30||gap+2*nh<-.001)return null
 return [t-th,t+th,y-h/2,y+h/2]
}
const rectOverlap=(a,b)=>overlap(a[0],a[1],b[0],b[1])&&overlap(a[2],a[3],b[2],b[3])
const decorByWall=new Map()
for(const e of wallDecor){
 assert.equal(e.type,'box');assert.equal(e.collision,false);assert.ok(e.size.every(v=>v>0))
 const r=rooms.get(e.room),wall=e.id.slice(e.id.indexOf(r.id)+r.id.length+1).split('-')[0]
 assert.ok(['north','south','east','west'].includes(wall),e.id)
 const vertical=wall==='east'||wall==='west',sign=wall==='east'||wall==='south'?1:-1
 const half=r.size[vertical?1:0]/2, normalHalf=r.size[vertical?0:1]/2
 const normal=e.position[vertical?0:2],inset=normalHalf-T/2-sign*normal, thickness=e.size[2]
 assert.ok(inset-thickness/2>=.01-EPS&&inset+thickness/2<=.18+EPS,`Wall depth: ${e.id}`)
 const rect=projectedBounds(e,r,wall);assert.ok(rect,e.id)
 assert.ok(rect[0]>=-half+.47-EPS&&rect[1]<=half-.47+EPS&&rect[2]>=.26-EPS&&rect[3]<=4.10+EPS,`Wall bounds: ${e.id}`)
 for(const o of r.openings.filter(o=>o.wall===wall)){
  const c=o.offset==='center'?0:o.offset-half,y=o.elevation??0
  assert.ok(!rectOverlap(rect,[c-o.width/2,c+o.width/2,y,y+o.height]),`Opening obstruction: ${e.id}`)
 }
 for(const old of world.entities.filter(x=>!newDecorIds.has(x.id))){
  const b=projectedBounds(old,r,wall)
  if(b)assert.ok(!rectOverlap(rect,b),`Decoration intersects existing ${old.id}: ${e.id}`)
 }
 const key=`${r.id}:${wall}`,previous=decorByWall.get(key)||[]
 for(const [id,b] of previous)assert.ok(!rectOverlap(rect,b),`Overlapping wall decoration: ${id} / ${e.id}`)
 previous.push([e.id,rect]);decorByWall.set(key,previous)
 if(e.id.startsWith('panel-'))assert.ok(!index.exhibits.some(a=>a.room===r.id&&a.wall===wall),`Panel on exhibit wall: ${e.id}`)
}
const shafts=wallDecor.filter(e=>e.id.startsWith('pilaster-')&&e.id.endsWith('-shaft'))
const panels=wallDecor.filter(e=>e.id.startsWith('panel-')&&e.id.endsWith('-top'))
for(const r of rooms.values()){
 assert.ok(shafts.some(e=>e.room===r.id),`No pilasters: ${r.id}`)
 assert.ok(panels.some(e=>e.room===r.id),`No panels: ${r.id}`)
 if(r.id!=='lobby'&&r.id!=='spine'){
  assert.equal(shafts.filter(e=>e.room===r.id&&e.id.includes('-entry-')).length,2,`Entry pair: ${r.id}`)
 }
}
assert.equal(wallDecor.length,shafts.length*5+panels.length*4)
assert.equal(columns.length,20)
const lobby=rooms.get('lobby'),[lw,ld]=lobby.size
for(const e of columns){
 assert.equal(e.room,'lobby');assert.equal(e.type,'box');const [x,y,z]=e.position,[w,h,d]=e.size
 assert.ok(Math.abs(x)+w/2<lw/2-T/2&&Math.abs(z)+d/2<ld/2-T/2)
 assert.ok(y-h/2>=-EPS&&y+h/2<=lobby.height+EPS)
 assert.ok(Math.abs(x)-w/2>=4.1,`Central lobby route blocked: ${e.id}`)
 assert.equal(e.collision,/-(plinth|foot|shaft)$/.test(e.id))
}
for(const e of columns.filter(e=>e.id.endsWith('-shaft'))){
 const prefix=e.id.slice(0,-6);for(const part of ['plinth','foot','neck','capital'])assert.ok(entities.has(`${prefix}-${part}`))
}
assert.equal(columns.filter(e=>e.id.endsWith('-shaft')).length,4)
assert.ok(world.entities.filter(e=>!e.id.startsWith('ceiling-')&&!e.id.includes('-rim-')&&!e.id.startsWith('lighting-')&&!e.id.startsWith('reception-')).length<1800,'Pre-ceiling architectural detail budget exceeded')
console.log(`Column/panel checks PASS: ${shafts.length} pilasters, ${panels.length} panel outlines, 4 lobby columns; clear openings, exhibit/label separation, wall depth, collision intent and entity budget.`)
// M4.5: ceiling relief and fixture geometry must stay below the original slab,
// outside every existing solid and well above the clear doorway/player height.
const ceilingParts=world.entities.filter(e=>e.id.startsWith('ceiling-'))
function bounds3(e){
 const [x,y,z]=e.position,[w,h,d]=e.size,ang=e.rotation?.[1]??0
 const hx=(Math.abs(Math.cos(ang))*w+Math.abs(Math.sin(ang))*d)/2,hz=(Math.abs(Math.sin(ang))*w+Math.abs(Math.cos(ang))*d)/2
 return [[x-hx,x+hx],[y-h/2,y+h/2],[z-hz,z+hz]]
}
function intersects3(a,b){return a.every(([lo,hi],i)=>overlap(lo,hi,...b[i]))}
for(const r of rooms.values()){
 const parts=ceilingParts.filter(e=>e.room===r.id)
 const bays=r.id==='spine'?Math.ceil(catalog.categories.length/2):2
 assert.equal(parts.filter(e=>e.id.endsWith('-inset')).length,bays)
 assert.equal(parts.filter(e=>e.id.endsWith('-diffuser')).length,bays)
 const gallery=!['lobby','spine'].includes(r.id)
 assert.equal(parts.filter(e=>e.id.endsWith('-rail')).length,gallery?2:0)
 assert.equal(parts.filter(e=>e.id.includes('-lens-')).length,gallery?6:0)
 assert.equal(parts.length,bays*7+(gallery?14:0))
 const oldBoxes=world.entities.filter(e=>e.room===r.id&&e.type==='box'&&!e.id.startsWith('ceiling-'))
 const lights=world.entities.filter(e=>e.room===r.id&&e.type==='light')
 for(const [i,e] of parts.entries()){
  assert.equal(e.type,'box');assert.equal(e.collision,false);assert.ok(e.size.every(v=>v>0));assert.ok(world.materials[e.material]);assert.equal(e.rotation[1],0)
  const b=bounds3(e)
  assert.ok(b[0][0]>=-r.size[0]/2+T/2+.45-EPS&&b[0][1]<=r.size[0]/2-T/2-.45+EPS,`Ceiling width: ${e.id}`)
  assert.ok(b[2][0]>=-r.size[1]/2+T/2+.45-EPS&&b[2][1]<=r.size[1]/2-T/2-.45+EPS,`Ceiling depth: ${e.id}`)
  assert.ok(b[1][0]>=4.02-EPS&&b[1][1]<=r.height-.007+EPS,`Ceiling vertical clearance: ${e.id}`)
  assert.ok(r.openings.every(o=>b[1][0]>(o.elevation??0)+o.height),`Door head clearance: ${e.id}`)
  for(const other of [...parts.slice(0,i),...oldBoxes])assert.ok(!intersects3(b,bounds3(other)),`Ceiling solid intersection: ${e.id} / ${other.id}`)
  for(const light of lights)assert.ok(!b.every(([lo,hi],j)=>light.position[j]>=lo-EPS&&light.position[j]<=hi+EPS),`Light embedded in ceiling: ${light.id}`)
 }
}
assert.ok(!world.entities.some(e=>e.id.endsWith('-fixture')),'Legacy fixture bars must be removed')
assert.equal(world.entities.filter(e=>e.type==='light'&&e.lightType==='point').length,rooms.size+Math.ceil(catalog.categories.length/2)-1)
assert.ok(world.entities.filter(e=>!e.id.includes('-rim-')&&!e.id.startsWith('wayfinding-')&&!e.id.startsWith('lighting-')&&!e.id.startsWith('reception-')).length<=2200,'Pre-frame detail budget exceeded')
console.log(`Ceiling checks PASS: ${ceilingParts.length} non-colliding parts; room bounds, ceiling clearance, solid separation, existing light clearance, fixture counts and entity budget.`)
// M4.6: independent frame geometry checks. The opening stays larger than the
// artwork, the backing sits behind it, and all tier volumes remain disjoint.
const profileCounts=new Map(), rimParts=world.entities.filter(e=>e.id.startsWith('exhibit-')&&e.id.includes('-rim-'))
const assignedRims=new Set()
for(const e of index.exhibits){
 const r=rooms.get(e.room),a=art.get(e.artworkId),img=entities.get(e.entityId),[w,h]=img.size
 const cx=img.surface.offset[0],cy=r.height/2+img.surface.offset[1],wall=e.wall,vertical=['east','west'].includes(wall),sign=['east','south'].includes(wall)?1:-1
 const c=e.category.slice(0,2), dark=a.frameStyle!=='antique-gold', oak=!dark&&c==='04', bronze=!dark&&['08','09','10','11','12','13'].includes(c)
 const profile=dark?'graphite':oak?'oak':bronze?'bronze':'gilt', count=profile==='gilt'?3:2, margin=dark?.045:.085,gap=dark?.012:profile==='gilt'?.005:.006
 profileCounts.set(profile,(profileCounts.get(profile)||0)+1)
 const back=entities.get(e.entityId+'-back'),liner=entities.get(e.entityId+'-liner')
 const rims=rimParts.filter(part=>part.id.startsWith(e.entityId+'-rim-'))
 assert.equal(rims.length,count*4,e.entityId);rims.forEach(part=>assignedRims.add(part.id))
 const imageRect=[cx-w/2,cx+w/2,cy-h/2,cy+h/2]
 const depthInterval=part=>{const normal=part.position[vertical?0:2],middle=r.size[vertical?0:1]/2-T/2-sign*normal;return [middle-part.size[2]/2,middle+part.size[2]/2]}
 const parts=[back,liner,...rims]
 for(const [i,part] of parts.entries()){
  assert.equal(part.type,'box');assert.equal(part.room,r.id);assert.equal(part.collision,false);assert.ok(part.size.every(v=>v>0));assert.ok(world.materials[part.material])
  const rect=projectedBounds(part,r,wall),depth=depthInterval(part);assert.ok(rect,part.id)
  assert.ok(rect[0]>=imageRect[0]-margin-EPS&&rect[1]<=imageRect[1]+margin+EPS&&rect[2]>=imageRect[2]-margin-EPS&&rect[3]<=imageRect[3]+margin+EPS,`Frame exceeds previous envelope: ${part.id}`)
  assert.ok(depth[0]>=.004-EPS&&depth[1]<=.179+EPS,`Frame wall depth: ${part.id}`)
  for(const other of parts.slice(0,i))assert.ok(!intersects3(bounds3(part),bounds3(other)),`Frame solid overlap: ${part.id} / ${other.id}`)
  for(const other of world.entities.filter(x=>x.room===r.id&&x.type==='box'&&!parts.includes(x)))assert.ok(!intersects3(bounds3(part),bounds3(other)),`Frame intersects another solid: ${part.id} / ${other.id}`)
  if(i<2)assert.ok(depth[1]<img.surface.depth-.005,`Backing covers artwork: ${part.id}`)
  else assert.ok(!rectOverlap(rect,[imageRect[0]-gap+EPS,imageRect[1]+gap-EPS,imageRect[2]-gap+EPS,imageRect[3]+gap-EPS]),`Rim covers artwork aperture: ${part.id}`)
 }
 for(let tier=0;tier<count;tier++)for(const side of ['top','bottom','left','right'])assert.ok(entities.has(`${e.entityId}-rim-${tier}-${side}`))
 const front=rims.filter(part=>part.id.includes(`-rim-${count-1}-`))
 assert.ok(front.every(part=>depthInterval(part)[1]>img.surface.depth+.02),'Artwork must be recessed behind the front rim')
 // Keep every art label below the outer frame profile.
 for(const label of world.entities.filter(x=>x.id.startsWith(e.entityId+'-label-')||x.id===e.entityId+'-credit')){
  const rect=projectedBounds(label,r,wall);assert.ok(rect[3]<imageRect[2]-margin,`Frame covers label: ${label.id}`)
 }
}
assert.equal(assignedRims.size,rimParts.length,'Unassigned rim part')
assert.equal(profileCounts.size,4);assert.ok(rimParts.length<=index.exhibits.length*12);assert.ok(world.entities.length<=3200,'Frame detail budget exceeded')
console.log(`Frame checks PASS: ${index.exhibits.length} recessed frames, ${rimParts.length} non-colliding rim parts; ${[...profileCounts].map(([k,v])=>`${k}: ${v}`).join(', ')}; aperture, wall clearance, solid separation and labels.`)
// M4.7: validate navigation copy against the actual gallery catalog and doors.
const wayfindingParts=world.entities.filter(e=>e.id.startsWith('wayfinding-'))
assert.equal(wayfindingParts.length, catalog.categories.length*2)
function signBounds(e,r,wall){
 const rect=projectedBounds(e,r,wall);assert.ok(rect,e.id)
 const half=r.size[['north','south'].includes(wall)?0:1]/2
 assert.ok(rect[0]>=-half+.1&&rect[1]<=half-.1&&rect[2]>=.25&&rect[3]<=r.height-.25,`Sign outside wall: ${e.id}`)
 for(const o of r.openings.filter(o=>o.wall===wall)){
  const x=o.offset==='center'?0:o.offset-half,y=o.elevation??0
  assert.ok(!rectOverlap(rect,[x-o.width/2,x+o.width/2,y,y+o.height]),`Sign obstructs door: ${e.id}`)
 }
 return rect
}
function verifySignGroup(panel,lines,r,wall,extras=[]){
 assert.ok(panel&&panel.type==='box'&&!panel.collision)
 const pb=signBounds(panel,r,wall),group=new Set([panel.id,...lines.map(e=>e.id),...extras.map(e=>e.id)])
 for(const [i,e] of lines.entries()){
  assert.equal(e.type,'text');assert.equal(e.surface.room,r.id);assert.equal(e.surface.wall,wall)
  assert.ok(e.surface.depth>=.12)
  const b=signBounds(e,r,wall)
  assert.ok(b[0]>=pb[0]+.04-EPS&&b[1]<=pb[1]-.04+EPS&&b[2]>=pb[2]+.04-EPS&&b[3]<=pb[3]-.04+EPS,`Text escapes sign panel: ${e.id}`)
  for(const previous of lines.slice(0,i))assert.ok(!rectOverlap(b,projectedBounds(previous,r,wall)),`Sign rows overlap: ${e.id}/${previous.id}`)
 }
 for(const other of world.entities){
  if(group.has(other.id))continue
  const b=projectedBounds(other,r,wall)
  if(b)assert.ok(!rectOverlap(pb,b),`Sign panel intersects ${other.id}: ${panel.id}`)
 }
}
for(const [i,c] of catalog.categories.entries()){
 const r=rooms.get(c.id),num=String(i+1).padStart(2,'0'),count=index.exhibits.filter(e=>e.room===c.id).length
 for(const kind of ['entry','room']){
  const title=entities.get(`${c.id}-${kind}-sign`), eyebrow=entities.get(`wayfinding-${c.id}-${kind}-eyebrow`)
  assert.equal(title.content,c.name.toUpperCase())
  assert.equal(eyebrow.content,kind==='entry'?`GALLERY ${num}  /  ${count} ${count===1?'EXHIBIT':'EXHIBITS'}`:`GALLERY ${num}  /  RETURN TO PROMENADE`)
  const host=kind==='entry'?spine:r,door=host.openings.find(o=>o.targetRoom===(kind==='entry'?r.id:spine.id))
  assert.equal(title.surface.wall,door.wall);assert.equal(title.surface.offset[0],door.offset==='center'?0:door.offset-host.size[['north','south'].includes(door.wall)?0:1]/2)
  verifySignGroup(entities.get(`detail-${c.id}-${kind}-panel`),[title,eyebrow],host,door.wall)
 }
}
for(const wall of ['west','east']){
 const id=`wayfinding-directory-${wall}`
 assert.ok(!world.entities.some(e=>e.id.startsWith(id)),`Unexpected residual directory on ${wall} wall`)
}
assert.equal(entities.get('promenade-end').content,'ENTRANCE HALL / BACK ALONG PROMENADE')
console.log(`Wayfinding checks PASS: ${catalog.categories.length*2} gallery signs, no redundant wing directories, ${wayfindingParts.length} additional sign parts; labels, actual door alignment, counts and clearance.`)

// M4.8 + M7.5 refinement: keep the south identity wall and seating, remove the
// north doorway wing plaques, and simplify the centered promenade title.
const arrival=world.entities.filter(e=>e.id.startsWith('arrival-'))
assert.equal(arrival.length,11)
const identity=entities.get('arrival-identity-panel')
const identityLines=['welcome-brand','welcome-title','welcome-subtitle','arrival-identity-motto','arrival-identity-count'].map(id=>entities.get(id))
verifySignGroup(identity,identityLines,lobby,'south')
assert.equal(identityLines[4].content,`${catalog.defaultDisplayCount} ARTWORKS  /  ${catalog.categories.length} GALLERIES`)
for(const wing of ['west','east'])assert.ok(!world.entities.some(e=>e.id.startsWith(`arrival-${wing}-`)),`Unexpected doorway wing plaque: ${wing}`)
assert.equal(entities.get('lobby-direction').content,'GRAND PROMENADE')
verifySignGroup(entities.get('detail-lobby-direction-panel'),[entities.get('lobby-direction')],lobby,'north')
const arrivalSolids=arrival.filter(e=>e.type==='box'),seats=arrivalSolids.filter(e=>e.id.startsWith('arrival-seat-'))
assert.equal(seats.length,4)
const spawn=world.exploration.spawn.position
for(const [i,e] of arrivalSolids.entries()){
 assert.equal(e.room,'lobby');assert.ok(e.size.every(v=>v>0));assert.ok(world.materials[e.material])
 const b=bounds3(e)
 assert.ok(b[0][0]>=-lw/2+T/2-EPS&&b[0][1]<=lw/2-T/2+EPS&&b[2][0]>=-ld/2+T/2-EPS&&b[2][1]<=ld/2-T/2+EPS)
 assert.ok(b[1][0]>=-EPS&&b[1][1]<=lobby.height+EPS)
 for(const other of [...arrivalSolids.slice(0,i),...world.entities.filter(x=>x.type==='box'&&x.room==='lobby'&&!x.id.startsWith('arrival-'))])assert.ok(!intersects3(b,bounds3(other)),`Arrival solid overlap: ${e.id} / ${other.id}`)
 if(e.id.startsWith('arrival-seat-')){
  assert.equal(e.collision,true)
  assert.ok(b[0][0]>=2.9||b[0][1]<=-2.9,`Seat in primary aisle: ${e.id}`)
  assert.ok(!b.every(([lo,hi],j)=>spawn[j]>=lo-.5&&spawn[j]<=hi+.5),`Seat near spawn: ${e.id}`)
  assert.ok(b[2][0]>=4.5&&b[1][1]<.6)
 }else{
  assert.equal(e.collision,false)
  const wall=e.id.startsWith('arrival-identity-')?'south':'north'
  signBounds(e,lobby,wall)
 }
}
for(const wing of ['west','east']){
 const base=bounds3(entities.get(`arrival-seat-${wing}-base`)),seat=bounds3(entities.get(`arrival-seat-${wing}-top`))
 assert.ok(seat[1][0]>=base[1][1]-EPS&&seat[1][0]-base[1][1]<.01)
}
console.log(`Arrival checks PASS: ${arrival.length} refined entities, south identity wall, two seats, simplified doorway signage, portal and spawn clearance, live catalog counts and solid separation.`)

// M5: validate light authoring, fixture clearance and coverage of each occupied wall.
const spots=world.entities.filter(e=>e.type==='light'&&e.lightType==='spot')
const pointLights=world.entities.filter(e=>e.type==='light'&&e.lightType==='point')
const groups=new Map()
for(const e of index.exhibits){const key=`${e.room}-${e.wall}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e)}
assert.equal(spots.length,groups.size+1)
assert.equal(pointLights.length,21)
assert.ok(world.environment.ambientLight.intensity>=.4&&world.environment.ambientLight.intensity<.65)
assert.ok(world.environment.sun.intensity<=.1&&!world.environment.shadows.enabled)
for(const r of rooms.values())assert.ok(spots.filter(e=>e.room===r.id).length<=3,`Too many wall washes: ${r.id}`)
for(const e of [...spots,...pointLights]){
 const r=rooms.get(e.room);assert.ok(r);const [x,y,z]=e.position
 assert.ok(Math.abs(x)<r.size[0]/2-T/2&&Math.abs(z)<r.size[1]/2-T/2&&y>3&&y<r.height)
 assert.ok(e.range>0&&e.range<=15&&e.intensity>0&&e.intensity<=12&&/^#[0-9a-f]{6}$/i.test(e.color));assert.equal(e.castShadow,false)
 for(const b of world.entities.filter(b=>b.room===r.id&&b.type==='box'))assert.ok(!bounds3(b).every(([lo,hi],j)=>e.position[j]>=lo-EPS&&e.position[j]<=hi+EPS),`Light inside solid: ${e.id} / ${b.id}`)
 if(e.lightType==='spot'){
  assert.ok(Math.abs(Math.hypot(...e.direction)-1)<.00003);assert.ok(e.direction[1]<0)
  assert.ok(e.innerCone>=0&&e.innerCone<e.outerCone&&e.outerCone<=Math.PI/2)
 }
}
for(const [key,group] of groups){
 const {room,wall}=group[0], r=rooms.get(room), e=entities.get(`lighting-${room}-wash-${wall}`)
 assert.ok(e&&e.lightType==='spot');const [w,d]=r.size, inset=T/2+.15
 for(const exhibit of group){
  const image=entities.get(exhibit.entityId), y=r.height/2+image.surface.offset[1]
  const [width,height]=exhibit.displaySize
  for(const t of [exhibit.offset-width/2-.085,exhibit.offset+width/2+.085])for(const v of [y-height/2-.085,y+height/2+.085]){
   const target=wall==='north'?[t,v,-d/2+inset]:wall==='south'?[t,v,d/2-inset]:wall==='west'?[-w/2+inset,v,t]:[w/2-inset,v,t]
   const ray=target.map((n,i)=>n-e.position[i]), len=Math.hypot(...ray), cosine=ray.reduce((sum,n,i)=>sum+n*e.direction[i],0)/len
   assert.ok(len<e.range&&cosine>=Math.cos(e.outerCone)-.00005,`Exhibit outside wall wash: ${exhibit.entityId}`)
  }
 }
}
assert.ok(entities.has('lighting-lobby-identity-wash'))
assert.ok(!spots.some(e=>e.room==='spine'))
console.log(`Lighting checks PASS: ${pointLights.length} bounded fill lights, ${spots.length} aimed spotlights; room/solid clearance, normalized directions, cone/range coverage and active-light authoring budget.`)

// M6.1: ensure the native renderer request remains explicit, candidate groups
// remain room/material scoped, and the compact deployment is valid lossless JSON.
const optimization=world.environment.optimization
assert.equal(optimization.staticBatching,true)
assert.equal(optimization.staticBatchMinInstances,3)
for(const key of ['cachedBounds','pipelineSorting','frustumCulling'])assert.equal(optimization[key],true)
const profile=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/profile-geometry.mjs'),'--json'],{cwd:root,encoding:'utf8'}))
const candidateGroups=new Map()
for(const e of world.entities.filter(e=>e.type==='box'&&e.collision===false)){
 const key=JSON.stringify([e.room,e.material,e.type]);candidateGroups.set(key,(candidateGroups.get(key)||0)+1)
}
const qualifying=[...candidateGroups.values()].filter(n=>n>=3)
assert.equal(profile.entities,world.entities.length)
assert.equal(profile.candidates,[...candidateGroups.values()].reduce((a,b)=>a+b,0))
assert.equal(profile.groups,qualifying.length);assert.equal(profile.grouped,qualifying.reduce((a,b)=>a+b,0))
assert.ok(profile.grouped/profile.candidates>.9)
assert.equal(profile.rooms.length,rooms.size)
assert.equal(profile.sourceBytes,(await stat(path.join(root,'world.anyo.json'))).size)
assert.ok(profile.sourceBytes<profile.prettyBytes*.7)
console.log(`Optimization checks PASS: ${profile.grouped} candidate boxes / ${profile.groups} groups; native optimization intent, lossless compact JSON, unchanged collision and interaction contracts.`)

// M6.2: decoded memory estimates are source-pixel estimates, not GPU telemetry.
const textureAudit=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/profile-textures.mjs'),'--json'],{cwd:root,encoding:'utf8'}))
assert.equal(textureAudit.activeProfile,textureProfile)
assert.equal(textureAudit.uniqueExhibitedArtworks,catalog.defaultDisplayCount)
assert.equal(textureAudit.placements,index.exhibits.length)
assert.equal(textureAudit.variants,balancedTextures.size)
assert.ok(textureAudit.balanced.uniqueRGBABytes<textureAudit.hd.uniqueRGBABytes)
console.log(`Texture checks PASS: ${balancedTextures.size} variants, all originals intact; ${textureProfile} paths, aspect ratios and estimated decoded memory.`)

// M6.3: check the authored portal graph, not the renderer's GPU behavior.
const {profile:visibilityProfile}=await read('scripts/visibility-profile.json')
assert.ok(['safe','occlusion'].includes(visibilityProfile))
assert.deepEqual(world.visibility,{enabled:true,hideUnreachableRooms:true,maxPortalDepth:2})
assert.equal(optimization.hizOcclusion,visibilityProfile==='occlusion')
assert.equal(optimization.hizResolution,128)
assert.equal(optimization.occlusionHistoryFrames,3)
assert.equal(optimization.occlusionMinimumPixels,4)
const visibility=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/profile-visibility.mjs'),'--json'],{cwd:root,encoding:'utf8'}))
assert.equal(visibility.roomCount,rooms.size)
assert.equal(visibility.openConnections,rooms.size-1)
assert.equal(visibility.entityCount,entities.size)
assert.equal(visibility.hizRequested,visibilityProfile==='occlusion')
for(const r of visibility.rooms){
  assert.equal(r.twoHop.length,rooms.size,`Two-hop connectivity: ${r.room}`)
  assert.equal(r.active.length,rooms.size)
  assert.equal(r.activeAuthoredEntities,entities.size)
  assert.ok(r.active.includes(r.room)&&r.active.includes('spine'))
  assert.equal(r.oneHop.length,r.room==='spine'?rooms.size:2)
  for(const target of r.neighbors)assert.ok(visibility.rooms.find(other=>other.room===target).neighbors.includes(r.room))
}
// Opposite galleries must remain eligible from either side of the promenade.
for(const r of allRooms.filter(r=>r.attachTo?.wall==='west')){
  const opposite=allRooms.find(other=>other.attachTo?.wall==='east'&&other.attachTo.offset===r.attachTo.offset)
  if(opposite){const row=visibility.rooms.find(v=>v.room===r.id);assert.ok(row.active.includes(opposite.id));assert.ok(!row.oneHop.includes(opposite.id))}
}
console.log(`Visibility checks PASS: ${visibility.roomCount} rooms / ${visibility.openConnections} connections; safe two-hop reachability, ${visibilityProfile} profile and opposite-gallery visibility eligibility.`)

// Check the generator is deterministic, without installing engine dependencies.
const files=['world.anyo.json','assets/museum/exhibits.json'];const before=await Promise.all(files.map(f=>readFile(path.join(root,f))));execFileSync(process.execPath,[path.join(root,'scripts/generate-museum.mjs'),'--check'],{cwd:root});for(const [i,f] of files.entries())assert.equal(hash(await readFile(path.join(root,f))),hash(before[i]))
console.log(`Museum checks PASS: ${art.size} source images, ${index.exhibits.length} exhibits, ${rooms.size} connected rooms, ${entities.size} entities; image integrity, placement, references and deterministic generation.`)
