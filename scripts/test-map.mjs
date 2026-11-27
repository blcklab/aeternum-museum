import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {buildMap,mapBounds,routeFromEntrance} from '../web-surface/reception/map-model.mjs'
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'))
const world=await read('world.anyo.json'),nav=await read('web-surface/reception/destinations.json'),map=await read('web-surface/reception/map.json')
const rooms=world.building.floors.flatMap(f=>f.rooms),byId=new Map(rooms.map(r=>[r.id,r]));
function center(r){if(r.position)return r.position;const parent=byId.get(r.attachTo.room),v=[...center(parent)],axis=['north','south'].includes(r.attachTo.wall)?1:0;v[axis]+=(['east','south'].includes(r.attachTo.wall)?1:-1)*((parent.size[axis]+r.size[axis])/2+(r.attachTo.gap??0));v[1-axis]+=r.attachTo.offset;return v}
const resolved=rooms.map(r=>({...r,position:center(r)}));
assert.deepEqual(map,buildMap(resolved,nav,[0,8.8]));assert.equal(map.rooms.length,15);assert.equal(map.portals.length,14);assert.deepEqual(mapBounds(map),[-19,-86,38,100]);
const inside=(p,[x,z,w,h])=>p[0]>=x-1e-6&&p[0]<=x+w+1e-6&&p[1]>=z-1e-6&&p[1]<=z+h+1e-6;
for(const portal of map.portals){assert.equal(portal.rooms.length,2);for(const id of portal.rooms)assert.ok(inside(portal.point,map.rooms.find(r=>r.id===id).bounds));assert.equal(portal.width,2.8)}
for(const d of nav.destinations){
 const route=routeFromEntrance(map,d.id);assert.deepEqual(route[0],map.start.point);assert.deepEqual(route.at(-1),[d.position[0],d.position[2]]);
 if(d.number){assert.ok(route.some(p=>p[0]===0&&p[1]===0));assert.ok(route.some(p=>p[0]===(d.wing==='west'?-3:3)&&p[1]===d.position[2]))}
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];assert.ok(a[0]===b[0]||a[1]===b[1]);const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1));for(let j=0;j<=steps;j++){const p=a.map((v,k)=>v+(b[k]-v)*j/steps);assert.ok(map.rooms.some(r=>inside(p,r.bounds)),`Route leaves building ${d.id}`);
  for(const e of world.entities.filter(e=>e.type==='box'&&e.collision)){const c=center(byId.get(e.room)),[x,y,z]=e.position,[w,h,depth]=e.size,theta=e.rotation?.[1]??0,dx=p[0]-c[0]-x,dz=p[1]-c[1]-z,lx=dx*Math.cos(theta)-dz*Math.sin(theta),lz=dx*Math.sin(theta)+dz*Math.cos(theta);if(y+h/2>0&&y-h/2<1.85)assert.ok(Math.abs(lx)>=w/2+.35||Math.abs(lz)>=depth/2+.35,`Route too close to ${e.id}`)}
 }}
}
assert.equal(routeFromEntrance(map,'unknown'),null);
assert.equal(routeFromEntrance({...map,portals:[]},'spine'),null);
console.log('Map PASS: 15 scaled room bounds, 14 real portal locations, all landing points, suggested route containment and solid-box clearance, unknown/unreachable destination handling.')
