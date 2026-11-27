import assert from 'node:assert/strict'
import {readFile,stat} from 'node:fs/promises'
import {installReceptionBridge} from '../host-integration/reception-bridge.mjs'
const root=new URL('../',import.meta.url),read=async f=>JSON.parse(await readFile(new URL(f,root),'utf8'))
const world=await read('world.anyo.json'),nav=await read('web-surface/reception/destinations.json'),inspection=await read('assets/museum/inspection.json'),catalog=await read('assets/museum/manifest.json'),index=await read('assets/museum/exhibits.json'),app=await read('web-surface/reception/web-surface.json')
const rooms=new Map(world.building.floors.flatMap(f=>f.rooms.map(r=>[r.id,r]))),entities=new Map(world.entities.map(e=>[e.id,e])),art=new Map(catalog.artworks.map(a=>[a.id,a]))
assert.equal(app.schema,'anyo-web-app@1');assert.equal(app.id,'reception');assert.equal(app.entry,'./index.html');assert.deepEqual(app.shortcut,{key:'KeyM',label:'Museum Directory'})
for(const f of ['index.html','style.css','app.js','destinations.json'])assert.ok((await stat(new URL('web-surface/reception/'+f,root))).isFile())
const screen=entities.get('reception-screen');assert.equal(screen.type,'web-surface');assert.equal(screen.room,'lobby');assert.equal(screen.webSurface.source.app,app.id);assert.deepEqual(screen.webSurface.target.size,screen.size);assert.ok((await stat(new URL(screen.webSurface.fallback.image,root))).isFile())
assert.equal(screen.interaction.action,'open-web-popup');assert.equal(screen.interaction.params.app,'reception');assert.equal(screen.interaction.distance,6)
assert.equal(inspection.exhibits.length,index.exhibits.length)
for(const [i,e] of index.exhibits.entries()){
 const a=art.get(e.artworkId),record=inspection.exhibits[i],params=entities.get(e.entityId).interaction.params
 assert.equal(record.entityId,e.entityId);assert.equal(record.room,e.room);assert.equal(record.originalImage,'./assets/museum/'+a.image);assert.equal(record.description,a.description);assert.equal(record.source,a.source)
 assert.equal(params.exhibitId,e.entityId);assert.equal(params.artworkId,a.id);assert.equal(params.roomId,e.room);assert.equal(params.artist,a.artist);assert.equal(params.date,a.date);assert.equal(params.license,a.license);assert.ok(params.copy.includes(a.description))
}
function center(r){if(r.position)return r.position;const p=rooms.get(r.attachTo.room),v=[...center(p)],horizontal=['north','south'].includes(r.attachTo.wall),n=horizontal?1:0,t=1-n;v[n]+=(['east','south'].includes(r.attachTo.wall)?1:-1)*(p.size[n]+r.size[n])/2;v[t]+=r.attachTo.offset;return v}
function bounds(e){const [x,y,z]=e.position,[w,h,d]=e.size,a=e.rotation?.[1]??0,dx=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d)/2,dz=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d)/2;return [[x-dx,x+dx],[y-h/2,y+h/2],[z-dz,z+dz]]}
const intersects=(a,b)=>a.every(([lo,hi],i)=>Math.min(hi,b[i][1])-Math.max(lo,b[i][0])>1e-5)
// A borderless plane with no housing, 3 cm in front of the interior wall.
const reception=world.entities.filter(e=>e.id.startsWith('reception-'));assert.equal(reception.length,1)
assert.equal(screen.webSurface.renderMode,'auto');assert.equal(screen.webSurface.presentation.type,'texture');assert.equal(screen.webSurface.interaction.pointer,true);assert.equal(screen.rotation[1],Math.PI/2);assert.equal(screen.position[2],0);assert.deepEqual(screen.size,[4.8,2.7]);assert.equal(screen.webSurface.framePolicy.mode,'fixed-rate')
assert.ok(Math.abs(screen.position[0]+rooms.get('lobby').size[0]/2-.08-.03)<1e-6)
assert.ok(!world.entities.some(e=>e.id.startsWith('wayfinding-directory-west-')||e.id.startsWith('wayfinding-directory-east-')||e.id.startsWith('arrival-west-')||e.id.startsWith('arrival-east-')))
const screenBounds=[[screen.position[0]-.001,screen.position[0]+.001],[screen.position[1]-screen.size[1]/2,screen.position[1]+screen.size[1]/2],[-screen.size[0]/2,screen.size[0]/2]]
for(const e of world.entities.filter(e=>e.room==='lobby'&&e.type==='box'))assert.ok(!intersects(screenBounds,bounds(e)),`Screen intersects ${e.id}`)
assert.equal(nav.destinations.length,rooms.size);assert.equal(new Set(nav.destinations.map(d=>d.id)).size,rooms.size)
for(const d of nav.destinations){const r=rooms.get(d.id),[cx,cz]=center(r),[x,y,z]=d.position,local=[x-cx,y,z-cz];assert.equal(d.name,r.name);assert.equal(d.exhibits,index.exhibits.filter(e=>e.room===r.id).length);assert.ok(Math.abs(local[0])<r.size[0]/2-.7&&Math.abs(local[2])<r.size[1]/2-.7&&y===1.65);const clearance=[[local[0]-.45,local[0]+.45],[0,1.85],[local[2]-.45,local[2]+.45]];for(const e of world.entities.filter(e=>e.room===r.id&&e.type==='box'&&e.collision))assert.ok(!intersects(clearance,bounds(e)),`Landing intersects ${e.id}`)}
// Mocked host/iframe transport: unknown sender, origin, room and inactive worlds must fail closed.
const events=new Map(),frameEvents=new Map(),replies=[],moves=[];let active=true,fail=false
const hostWindow={addEventListener:(k,v)=>events.set(k,v),removeEventListener:(k)=>events.delete(k)},frame={postMessage:(m,o)=>replies.push([m,o])},iframe={contentWindow:frame,addEventListener:(k,v)=>frameEvents.set(k,v),removeEventListener:k=>frameEvents.delete(k)}
const player={teleport(o){if(fail)throw Error('mock failure');moves.push(o)}}
const dispose=installReceptionBridge({iframe,player,navigation:nav,isActiveWorld:()=>active,hostWindow})
const send=(data,origin='null',source=frame)=>events.get('message')?.({data:{channel:nav.schema,...data},origin,source})
const travel={type:'travel',roomId:nav.destinations[2].id,requestId:1,position:[999,999,999]}
await send(travel);assert.equal(moves.length,0);await send({type:'hello'},'https://wrong.example');assert.equal(replies.length,0);await send({type:'hello'},'null',{});assert.equal(replies.length,0);await send({type:'hello'});assert.equal(replies.at(-1)[0].type,'ready')
await send({...travel,roomId:'unknown'});assert.equal(replies.at(-1)[0].ok,false);await send(travel);assert.deepEqual(moves[0],{position:nav.destinations[2].position,resetMotion:true,clearInput:true});assert.equal(replies.at(-1)[0].ok,true)
active=false;await send(travel);assert.equal(moves.length,1);active=true;fail=true;await send(travel);assert.equal(replies.at(-1)[0].ok,false);fail=false;frameEvents.get('load')();await send(travel);assert.equal(moves.length,1);assert.equal(events.size,0);dispose()
console.log(`Interaction checks PASS: ${inspection.exhibits.length} inspection records, ${nav.destinations.length} clearance-tested room destinations, simplified wall-screen geometry, Web Surface assets, mocked trusted bridge and navigation revocation.`)
