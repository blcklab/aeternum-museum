// Floor-plan coordinates are metres in the authored X/Z plane (north = -Z).
export function buildMap(rooms, navigation, reception) {
  const lookup=new Map(rooms.map(r=>[r.id,r]));
  const geometry=navigation.destinations.map(d=>{
    const r=lookup.get(d.id);if(!r?.position)throw Error(`Missing resolved room ${d.id}`);
    const [x,z]=r.position,[w,h]=r.size;
    return {id:d.id,bounds:[x-w/2,z-h/2,w,h],landing:[d.position[0],d.position[2]]};
  });
  const links=new Map();
  for(const r of rooms)for(const o of r.openings??[]){
    if(o.type!=='portal'||o.open===false||!lookup.has(o.targetRoom))continue;
    const horizontal=['north','south'].includes(o.wall),axis=horizontal?1:0,tangent=1-axis;
    const point=[...r.position];point[axis]+=(['south','east'].includes(o.wall)?1:-1)*r.size[axis]/2;
    point[tangent]+=o.offset==='center'?0:o.offset-r.size[tangent]/2;
    const pair=[r.id,o.targetRoom].sort(),key=pair.join('|');
    if(links.has(key)){
      const old=links.get(key);if(old.axis!==axis||old.point.some((p,i)=>Math.abs(p-point[i])>1e-6)||old.width!==o.width)throw Error(`Portal geometry mismatch: ${key}`);
    }else links.set(key,{rooms:pair,point,axis,width:o.width});
  }
  return {schema:'aeternum-floor-plan@1',worldId:navigation.worldId,rooms:geometry,portals:[...links.values()],start:{roomId:'lobby',point:[...reception],label:'Entrance reference point'}};
}
export function mapBounds(map,padding=2){
  const x=Math.min(...map.rooms.map(r=>r.bounds[0])),z=Math.min(...map.rooms.map(r=>r.bounds[1]));
  const right=Math.max(...map.rooms.map(r=>r.bounds[0]+r.bounds[2])),bottom=Math.max(...map.rooms.map(r=>r.bounds[1]+r.bounds[3]));
  return [x-padding,z-padding,right-x+2*padding,bottom-z+2*padding];
}
export function routeFromEntrance(map,id){
  const rooms=new Map(map.rooms.map(r=>[r.id,r]));if(!rooms.has(id))return null;
  const start=map.start.roomId,queue=[start],prev=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++)for(const p of map.portals){const next=p.rooms.includes(queue[i])?p.rooms.find(r=>r!==queue[i]):null;if(next&&!prev.has(next)){prev.set(next,{room:queue[i],portal:p});queue.push(next)}}
  if(!prev.has(id))return null;
  const edges=[];for(let r=id;r!==start;){const step=prev.get(r);edges.unshift(step);r=step.room;}
  const points=[[...map.start.point]];
  const add=p=>{if(p.some((v,i)=>v!==points.at(-1)[i]))points.push([...p])};
  for(const {room,portal} of edges){
    // Move along the room's central axis before crossing its doorway.
    const [x,z,w,h]=rooms.get(room).bounds;
    const a=points.at(-1),b=portal.point;
    if(room==='spine'){add([x+w/2,a[1]]);add([x+w/2,b[1]])}
    else if(room==='lobby'){add([b[0],a[1]])}
    add(b);
  }
  const target=rooms.get(id).landing;
  if(id==='spine')add([target[0],points.at(-1)[1]]);
  add(target);return points;
}
