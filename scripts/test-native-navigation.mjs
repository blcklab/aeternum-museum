// Run against the actual pinned Anyo engine, not a local geometry approximation.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createWorld,buildingPlugin,entitiesPlugin} from '@blcklab/anyo'
const read=async name=>JSON.parse(await readFile(new URL('../'+name,import.meta.url),'utf8'))
const document=await read('world.anyo.json'),nav=await read('web-surface/reception/destinations.json')
const world=createWorld({plugins:[buildingPlugin(),entitiesPlugin()],autoResize:false})
try {
 await world.load(document)
 const c=world.compiled,screen=c.primitives.find(p=>p.entityId==='reception-screen')
 assert.equal(c.rooms.length,15);assert.equal(screen.webSurface.renderMode,'auto');assert.equal(screen.webSurface.presentation.type,'texture');assert.equal(screen.webSurface.source.app,'reception');assert.ok(screen.transform.matrix[8]>.9999,'Screen must face into the hall')
 assert.equal(screen.roomId,'lobby');assert.equal(screen.interaction?.action,'open-web-popup');assert.ok(!c.primitives.some(p=>p.entityId==='reception-wall-housing'));assert.ok(Math.abs(screen.transform.position[0]+6.89)<1e-5);assert.equal(screen.webSurface.interaction.pointer,true)
 assert.ok(!c.colliders.some(x=>x.entityId?.startsWith('reception-')),'Wall installation must not add colliders')
 for(const d of nav.destinations){const [x,y,z]=d.position;const min=[x-.4,.03,z-.4],max=[x+.4,y+.15,z+.4];for(const col of c.colliders){if(col.enabled===false)continue;const b=col.bounds;assert.ok(!min.every((lo,i)=>Math.min(max[i],b.max[i])-Math.max(lo,b.min[i])>1e-5),`Landing ${d.id} intersects compiled collider ${col.id}`)}}
 console.log(`Native Anyo navigation PASS: ${c.rooms.length} compiled rooms, ${c.primitives.length} primitives, ${c.colliders.length} colliders, wall orientation and ${nav.destinations.length} collision-free landing points.`)
}finally{await world.disposeAsync()}
