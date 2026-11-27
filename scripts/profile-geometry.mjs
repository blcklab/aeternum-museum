// Authoring-side audit only; never substitute these counts for GPU metrics.
import {readFile} from 'node:fs/promises'

export function profileGeometry(world, sourceBytes){
  const min=world.environment?.optimization?.staticBatchMinInstances??3
  const roomIds=world.building.floors.flatMap(f=>f.rooms.map(r=>r.id))
  const groups=new Map(), rooms=new Map(roomIds.map(id=>[id,{room:id,boxes:0,candidates:0,groups:0,grouped:0,ungrouped:0}]))
  for(const e of world.entities){
    if(e.type!=='box')continue
    const r=rooms.get(e.room);if(!r)continue
    r.boxes++
    // Conservative candidates: plain opaque room-local, non-colliding boxes
    // with no interactions, components, children, or authored visibility.
    const m=world.materials[e.material]
    if(!m||e.collision!==false||e.interaction||e.components||e.children||e.visible!==undefined||e.surface||m.transparent||m.opacity<1||m.alphaMode==='blend'||m.alphaMode==='mask')continue
    r.candidates++
    const key=JSON.stringify([e.room,e.material,e.type])
    if(!groups.has(key))groups.set(key,{room:e.room,count:0})
    groups.get(key).count++
  }
  for(const g of groups.values())if(g.count>=min){const r=rooms.get(g.room);r.groups++;r.grouped+=g.count}
  for(const r of rooms.values())r.ungrouped=r.candidates-r.grouped
  const sum=key=>[...rooms.values()].reduce((s,r)=>s+r[key],0)
  return {kind:'authoring-estimate-not-gpu-metrics',entities:world.entities.length,boxes:sum('boxes'),candidates:sum('candidates'),minimumInstances:min,groups:sum('groups'),grouped:sum('grouped'),ungrouped:sum('ungrouped'),sourceBytes,prettyBytes:Buffer.byteLength(JSON.stringify(world,null,2)+'\n'),rooms:[...rooms.values()]}
}

const source=await readFile(new URL('../world.anyo.json',import.meta.url),'utf8')
const audit=profileGeometry(JSON.parse(source),Buffer.byteLength(source))
if(process.argv.includes('--json'))console.log(JSON.stringify(audit,null,2))
else{
  console.table(audit.rooms)
  console.log(`Native static batching candidates: ${audit.grouped}/${audit.candidates} in ${audit.groups} room/material groups (minimum ${audit.minimumInstances}).`)
  console.log(`World JSON: ${audit.sourceBytes} bytes vs ${audit.prettyBytes} bytes pretty-printed.`)
  console.log('Authoring estimates only: actual batching, draw calls, frame time and FPS depend on the Loader/renderer.')
}
