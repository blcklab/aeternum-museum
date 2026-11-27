import {mapBounds,routeFromEntrance} from './map-model.mjs';
// One logical viewport; physical texture resolution is independent of UI layout.
export const WIDTH=1920,HEIGHT=1080;
export function createDirectory({canvas,navigation,map,invalidate=()=>{},canTravel=()=>false,travel=()=>{}}){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D required');
 const entries=[...navigation.destinations].sort((a,b)=>(a.number??'99').localeCompare(b.number??'99'));
 const [mx,mz,mw,mh]=mapBounds(map),scale=Math.min(440/mw,785/mh),ox=270-mw*scale/2-mx*scale,oy=178-mz*scale;
 const hits=[];let selected=null,notice='',busy=false,disposed=false,hover=null;
 const pressed=new Map(),lastRelease=new Map();
 const colors={bg:'#202522',panel:'#2b322c',border:'#536052',gold:'#d0b17b',ink:'#f3e9d7',muted:'#b9b7a8'};
 const rect=(x,y,w,h,fill,stroke)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}};
 const text=(str,x,y,size=26,color=colors.ink,align='left',max=1000,font='system-ui')=>{ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(str,x,y,max)};
 const select=d=>{selected=d;notice='';invalidate()};
 const box=(x,y,w,h,action)=>hits.push({key:`${x}:${y}`,x,y,w,h,action});
 function render(){if(disposed)return;ctx.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);hits.length=0;
  rect(0,0,WIDTH,HEIGHT,colors.bg);text('BLCK LAB / MUSEUM INFORMATION',54,43,23,colors.gold);text('AETERNUM',54,102,58,colors.ink,'left',900,'Georgia');text('Explore the museum',420,104,29,colors.muted);text(canTravel()?'NAVIGATION READY':'DIRECTORY MODE',1860,53,23,colors.gold,'right');rect(54,145,1812,2,colors.border);
  for(const r of map.rooms){const d=entries.find(e=>e.id===r.id);if(!d)continue;const [x,z,w,h]=r.bounds,px=ox+x*scale,py=oy+z*scale,pw=w*scale,ph=h*scale;rect(px,py,pw,ph,selected?.id===d.id?'#655437':colors.panel,selected?.id===d.id?colors.gold:colors.border);if(d.number){text(d.number,px+pw/2,py+ph*.39,25,colors.gold,'center',pw-5);text(`${d.exhibits} works`,px+pw/2,py+ph*.70,17,colors.muted,'center',pw-5)}else if(d.id==='lobby')text('ENTRANCE',px+pw/2,py+ph/2,18,colors.ink,'center',pw-5);else{ctx.save();ctx.translate(px+pw/2,py+ph/2);ctx.rotate(-Math.PI/2);text('GRAND PROMENADE',0,0,18,colors.muted,'center',ph-10);ctx.restore()}box(px,py,pw,ph,()=>select(d))}
  for(const p of map.portals){const [x,z]=p.point,h=p.width/2;ctx.beginPath();ctx.moveTo(ox+(p.axis===0?x:x-h)*scale,oy+(p.axis===0?z-h:z)*scale);ctx.lineTo(ox+(p.axis===0?x:x+h)*scale,oy+(p.axis===0?z+h:z)*scale);ctx.strokeStyle=colors.gold;ctx.lineWidth=4;ctx.stroke()}
  if(selected){const points=routeFromEntrance(map,selected.id);if(points){ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(ox+x*scale,oy+z*scale):ctx.moveTo(ox+x*scale,oy+z*scale));ctx.strokeStyle=colors.gold;ctx.lineWidth=4;ctx.setLineDash([8,5]);ctx.stroke();ctx.setLineDash([])}}
  const [sx,sz]=map.start.point;ctx.beginPath();ctx.arc(ox+sx*scale,oy+sz*scale,5,0,Math.PI*2);ctx.fillStyle='#89cba1';ctx.fill();text('Entrance reference',54,991,20,colors.muted);
  text('CHOOSE A DESTINATION',540,188,26,colors.gold);
  entries.forEach((d,i)=>{const x=540+(i%2)*670,y=226+Math.floor(i/2)*81,w=646,h=67;rect(x,y,w,h,selected?.id===d.id?'#494639':colors.panel,selected?.id===d.id?colors.gold:colors.border);text(d.number??'—',x+18,y+33,27,colors.gold);text(d.name,x+73,y+26,26,colors.ink,'left',w-94);text(d.number?`${d.exhibits} works`:'Public area',x+73,y+50,17,colors.muted);box(x,y,w,h,()=>select(d))});
  if(hover){const h=hits.find(h=>h.key===hover);if(h){ctx.strokeStyle=colors.gold;ctx.lineWidth=3;ctx.strokeRect(h.x,h.y,h.w,h.h)}}
  rect(540,891,1316,2,colors.border);text(selected?.name??'Select a gallery',540,931,30,colors.ink,'left',880);text(notice||(canTravel()?'Select a destination, then travel.':'Travel requires the approved Loader integration.'),540,981,21,colors.muted,'left',880);
  const enabled=selected&&canTravel()&&!busy;rect(1434,923,422,83,enabled?colors.gold:'#3d443d');text(busy?'Traveling…':'Travel to destination',1645,964,28,enabled?colors.bg:colors.muted,'center',390);box(1434,923,422,83,()=>{if(!selected||!canTravel()||busy)return;busy=true;invalidate();Promise.resolve().then(()=>travel(selected.id)).then(()=>{notice='Travel completed.'},()=>{notice='Travel unavailable.'}).finally(()=>{busy=false;invalidate()})});
 }
 // The texture runtime emits down/up and may emit a synthetic click afterwards.
 // Handle either contract, but never activate a release + click twice.
 function hitAt(e){let x,y;if(Array.isArray(e.uv)&&e.uv.length===2&&e.uv.every(Number.isFinite)){x=e.uv[0]*WIDTH;y=(1-e.uv[1])*HEIGHT}else if(Array.isArray(e.pixel)&&e.pixel.length===2&&e.pixel.every(Number.isFinite)){x=e.pixel[0]*WIDTH/canvas.width;y=e.pixel[1]*HEIGHT/canvas.height}else return null;return hits.find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)??null}
 function handleInput(e){
  if(disposed||e?.type!=='pointer')return false;
  const id=e.pointerId??0,phase=e.phase;
  if(phase==='cancel'||phase==='leave'){if(pressed.has(id))pressed.set(id,null);lastRelease.delete(id);hover=null;invalidate();return true}
  const hit=hitAt(e);
  if(phase==='move'||phase==='enter'){const next=hit?.key??null;if(next!==hover){hover=next;invalidate()}return Boolean(hit)}
  if(e.button!==0)return false;
  if(phase==='down'){lastRelease.delete(id);pressed.set(id,hit?.key??null);hover=hit?.key??null;invalidate();return true}
  if(phase==='up'){
   const hadDown=pressed.has(id),key=pressed.get(id);pressed.delete(id);
   const matched=Boolean(hit&&(!hadDown||key===hit.key));
   // Record even a cancelled release to prevent the synthesized click activating another button.
   lastRelease.set(id,{key:hit?.key??null,time:Date.now()});
   if(matched)hit.action();invalidate();return true
  }
  if(phase==='click'){
   const last=lastRelease.get(id);lastRelease.delete(id);
   if(last&&Date.now()-last.time<500)return true;
   if(pressed.has(id)){pressed.delete(id);return true}
   if(hit){hit.action();invalidate();return true}
  }
  return false
 }
 return {render,handleInput,update:invalidate,resize:invalidate,setActive(active){if(!active){pressed.clear();lastRelease.clear();hover=null}invalidate()},resume:invalidate,dispose(){disposed=true;hits.length=0;pressed.clear();lastRelease.clear()}};
}

// A fixed world-space directory cover. The browser popup owns detailed controls.
export function createDirectoryLauncher({canvas,map,navigation,invalidate=()=>{},open=()=>{}}){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D required');
 let disposed=false,pressed=false,hover=false,lastRelease=-Infinity;
 const ink='#f3e9d7',gold='#d0b17b',muted='#b9b7a8',bg='#202522';
 function text(value,x,y,size,color=ink,font='system-ui'){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(value,x,y)}
 // The physical texture upload displays canvas rows bottom-to-top on the plane.
 // Compensate here only, not in the HTML popup or the static fallback.
 function render(){if(disposed)return;ctx.setTransform(canvas.width/WIDTH,0,0,-canvas.height/HEIGHT,0,canvas.height);ctx.fillStyle=bg;ctx.fillRect(0,0,WIDTH,HEIGHT);
  text('BLCK LAB / VISITOR INFORMATION',90,100,27,gold);ctx.fillStyle='#536052';ctx.fillRect(90,150,1740,2);
  const [mx,mz,mw,mh]=mapBounds(map),scale=Math.min(500/mw,760/mh),ox=350-mw*scale/2-mx*scale,oy=205-mz*scale;
  for(const r of map.rooms){const [x,z,w,h]=r.bounds,px=ox+x*scale,py=oy+z*scale;ctx.fillStyle=r.id==='lobby'?'#655437':'#303832';ctx.fillRect(px,py,w*scale,h*scale);ctx.strokeStyle='#77776a';ctx.lineWidth=2;ctx.strokeRect(px,py,w*scale,h*scale);const d=navigation.destinations.find(v=>v.id===r.id);if(d?.number)text(d.number,px+12,py+h*scale/2,24,gold)}
  text('AETERNUM',680,288,108,ink,'Georgia');text('Museum directory',680,418,56,ink);text('13 galleries · Art, science & human imagination',680,511,34,muted);text('Choose a destination in the interactive directory.',680,590,31,muted);
  ctx.fillStyle=hover?'#e2c38e':gold;ctx.fillRect(680,701,1040,115);text('Open museum directory  →',730,759,43,bg);text('Click this display or press M anywhere',680,876,30,muted);
 }
 function handleInput(e){if(disposed||e?.type!=='pointer')return false;if(e.phase==='enter'||e.phase==='move'){if(!hover){hover=true;invalidate()}return true}if(e.phase==='leave'||e.phase==='cancel'){hover=false;pressed=false;invalidate();return true}if(e.button!==0)return false;if(e.phase==='down'){pressed=true;lastRelease=-Infinity;return true}if(e.phase==='up'){if(pressed){pressed=false;lastRelease=Date.now();open()}return true}if(e.phase==='click'){if(Date.now()-lastRelease>=500){lastRelease=Date.now();pressed=false;open()}return true}return false}
 return {render,handleInput,update:invalidate,resize:invalidate,setActive(active){if(!active){hover=false;pressed=false}invalidate()},resume:invalidate,dispose(){disposed=true}};
}
