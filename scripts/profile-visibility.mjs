// Graph reachability is an authoring estimate, not a view/frustum/GPU measurement.
import {readFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

export function profileVisibility(world){
  const rooms=world.building.floors.flatMap(f=>f.rooms)
  const neighbors=new Map(rooms.map(r=>[r.id,new Set()]))
  const counts=new Map(rooms.map(r=>[r.id,0]))
  for(const r of rooms)for(const opening of r.openings??[]){
    if(opening.type!=='portal'||opening.open===false||!neighbors.has(opening.targetRoom))continue
    neighbors.get(r.id).add(opening.targetRoom)
    neighbors.get(opening.targetRoom).add(r.id)
  }
  let unassigned=0
  for(const e of world.entities){
    const id=e.room??e.surface?.room
    if(counts.has(id))counts.set(id,counts.get(id)+1);else unassigned++
  }
  const reachable=(id,depth)=>{
    const visited=new Set([id]),queue=[[id,0]]
    for(let i=0;i<queue.length;i++){
      const [current,d]=queue[i];if(d>=depth)continue
      for(const next of neighbors.get(current))if(!visited.has(next)){visited.add(next);queue.push([next,d+1])}
    }
    return [...visited].sort()
  }
  const activeDepth=world.visibility?.maxPortalDepth??2
  const activeEnabled=world.visibility?.enabled!==false&&world.visibility?.hideUnreachableRooms!==false
  return {
    kind:'authoring-portal-graph-not-gpu-metrics',roomCount:rooms.length,
    openConnections:[...neighbors.values()].reduce((s,n)=>s+n.size,0)/2,
    entityCount:world.entities.length,unassignedEntities:unassigned,
    activeDepth,activeEnabled,hizRequested:world.environment?.optimization?.hizOcclusion===true,
    rooms:rooms.map(r=>{
      const oneHop=reachable(r.id,1),twoHop=reachable(r.id,2)
      const active=activeEnabled?reachable(r.id,activeDepth):[...neighbors.keys()].sort()
      return {room:r.id,neighbors:[...neighbors.get(r.id)].sort(),oneHop,twoHop,active,
        activeAuthoredEntities:active.reduce((s,id)=>s+counts.get(id),unassigned),
        oneHopAuthoredEntities:oneHop.reduce((s,id)=>s+counts.get(id),unassigned)}
    })
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const world=JSON.parse(await readFile(new URL('../world.anyo.json',import.meta.url),'utf8'))
  const audit=profileVisibility(world)
  if(process.argv.includes('--json'))console.log(JSON.stringify(audit,null,2))
  else{
    console.table(audit.rooms.map(r=>({room:r.room,oneHop:r.oneHop.length,twoHop:r.twoHop.length,active:r.active.length,oneHopEntities:r.oneHopAuthoredEntities,activeEntities:r.activeAuthoredEntities})))
    console.log(`${audit.roomCount} rooms / ${audit.openConnections} open connections; portal depth ${audit.activeDepth}; Hi-Z requested: ${audit.hizRequested}.`)
    console.log('One-hop counts are hypothetical and unsafe for this layout. Actual visibility, occlusion, draw calls and FPS require Loader telemetry.')
  }
}
