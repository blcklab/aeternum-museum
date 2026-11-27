import {mountVisitorSettings} from './visitor-ui.mjs';
import {requestPopupClose} from './popup-shortcut.mjs'
import {mapBounds,routeFromEntrance} from './map-model.mjs';
const channel='aeternum-navigation@1', directory=document.querySelector('#directory'), travel=document.querySelector('#travel'), status=document.querySelector('#status'), selection=document.querySelector('#selection'), connection=document.querySelector('#connection'), svg=document.querySelector('#floor-plan');
let selected=null, connected=false, pending=false, requestId=0, map=null, route=null, destinationMarker=null;
let destinations=new Map(),tourCatalog=[],tourState=null,toursEnabled=false,guided=false;
const tourPanel=document.querySelector('#tour-panel'),freeTab=document.querySelector('#free-tab'),toursTab=document.querySelector('#tours-tab'),directoryTitle=document.querySelector('#directory-title');
const controls=new Map(), ns='http://www.w3.org/2000/svg';
function element(tag,attrs={},text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e}
const currentTour=()=>tourCatalog.find(t=>t.id===tourState?.tourId);
const nextStop=()=>currentTour()?.stops[tourState?.next];
const sync=()=>{const stop=guided?nextStop():null;travel.disabled=!selected||!connected||pending||(guided&&(!toursEnabled||!stop||selected.id!==stop.roomId));travel.textContent=guided?(stop?`Travel to stop ${tourState.next+1} · ${selected?.name??''}`:'Choose a tour to begin'):selected?`Travel to ${selected.name}`:'Travel to gallery';for(const b of tourPanel.querySelectorAll('button'))b.disabled=!connected||!toursEnabled||pending;};
function node(tag,copy,cls){const el=document.createElement(tag);if(copy!==undefined)el.textContent=copy;if(cls)el.className=cls;return el}
function setMode(value){guided=value;freeTab.setAttribute('aria-pressed',String(!value));toursTab.setAttribute('aria-pressed',String(value));directory.hidden=value;tourPanel.hidden=!value;directoryTitle.textContent=value?'Guided tours':'Choose a destination';if(value){renderTours();const stop=nextStop();if(stop&&destinations.has(stop.roomId))select(destinations.get(stop.roomId));else clearSelection()}sync()}
function clearSelection(){selected=null;for(const nodes of controls.values())for(const n of nodes)n.setAttribute('aria-pressed','false');route?.setAttribute('points','');destinationMarker?.setAttribute('visibility','hidden');selection.textContent=guided?'Choose a tour or return to free exploration.':'Select a gallery to explore.';sync()}
function selectFree(d){setMode(false);select(d)}
function renderTours(){tourPanel.replaceChildren();const t=currentTour();
 if(t){const n=tourState.next,total=t.stops.length;const box=node('section',undefined,'tour-active');box.append(node('p',`${n} / ${total} stops reached`,'tour-eyebrow'),node('h3',t.title));const bar=node('progress');bar.max=total;bar.value=n;bar.setAttribute('aria-label','Tour progress');box.append(bar);
  if(n>0){const previous=t.stops[n-1];box.append(node('p',`Last stop · ${destinations.get(previous.roomId)?.name??''}`,'tour-eyebrow'),node('h4',previous.title),node('p',previous.note,'tour-note'))}
  if(n<total){const stop=t.stops[n];box.append(node('p',`Next · ${destinations.get(stop.roomId)?.name??''}`,'tour-eyebrow'),node('h4',stop.title),node('p',stop.note,'tour-note'),node('p','Travel when ready, explore at your own pace, then press M to continue.','muted'))}else box.append(node('h4','Tour complete'),node('p','All stops reached. Continue exploring or choose another tour.','tour-note'));
  const end=node('button',n===total?'Finish tour':'End tour','tour-end');end.type='button';end.addEventListener('click',()=>tell('tour-end'));box.append(end);tourPanel.append(box);
 }else{tourPanel.append(node('p','Choose a curated journey. Each stop highlights an artwork to discover in its gallery.','muted'));for(const t of tourCatalog){const b=node('button',undefined,'tour-card');b.type='button';b.append(node('span',t.title,'tour-title'),node('small',`${t.stops.length} stops`,'tour-eyebrow'),node('span',t.description,'tour-description'));b.addEventListener('click',()=>tell('tour-start',{tourId:t.id}));tourPanel.append(b)}}
 if(!toursEnabled)tourPanel.append(node('p','Guided travel requires the matching Loader update and approved world connection.','muted'));sync();}
const visitor=mountVisitorSettings({tell});
freeTab.addEventListener('click',()=>{visitor.close();setMode(false)});toursTab.addEventListener('click',()=>{visitor.close();setMode(true)});
function select(d){selected=d;for(const [id,nodes] of controls)for(const node of nodes)node.setAttribute('aria-pressed',String(id===d.id));selection.textContent=d.number?`${d.number} · ${d.name} / ${d.exhibits} exhibits`:`${d.name} · Public area`;if(map&&route){const points=routeFromEntrance(map,d.id);route.setAttribute('points',points?.map(p=>p.join(',')).join(' ')??'');const target=map.rooms.find(r=>r.id===d.id);destinationMarker.setAttribute('cx',target.landing[0]);destinationMarker.setAttribute('cy',target.landing[1]);destinationMarker.setAttribute('visibility','visible')}sync()}
function tell(type,extra={}){if(parent!==window)parent.postMessage({channel,type,...extra},'*')}
window.addEventListener('keydown',event=>requestPopupClose(event,window));
window.addEventListener('message',event=>{if(event.source!==parent||parent===window||event.data?.channel!==channel)return;const m=event.data;if(visitor.receive(m))return;if(m.type==='unavailable'){visitor.disconnect();connected=false;toursEnabled=false;if(guided)renderTours();connection.textContent='Directory mode';status.textContent=typeof m.reason==='string'?m.reason:'Travel unavailable.';sync()}else if(m.type==='ready'){visitor.connect(m.visitorSettings,m.cameraSettingsAvailable);connected=true;toursEnabled=m.toursEnabled===true;tourState=m.tour??null;connection.textContent='Navigation connected';status.textContent='Select a destination, then confirm travel.';if(tourState||guided)setMode(true);else sync()}else if(m.type==='tour-state'&&toursEnabled){tourState=m.tour??null;setMode(true)}else if(m.type==='result'&&pending&&m.requestId===requestId){pending=false;status.textContent=m.ok?'Travel request completed.':(typeof m.reason==='string'?m.reason:'Travel unavailable. Ask the host to reconnect.');sync()}});
travel.addEventListener('click',()=>{if(travel.disabled||!selected||!connected||pending)return;pending=true;const id=++requestId;sync();status.textContent='Requesting travel…';tell('travel',{roomId:selected.id,requestId:id,...(guided?{tourId:tourState.tourId,step:tourState.next}:{})});setTimeout(()=>{if(pending&&requestId===id){pending=false;connected=false;connection.textContent='Directory mode';status.textContent='No reply from Loader. Travel is unavailable.';sync();tell('hello')}},5000)});
function renderMap(data,destinations){
  if(data.schema!=='aeternum-floor-plan@1'||data.worldId!=='aeternum-museum'||data.rooms.length!==destinations.size||data.rooms.some(r=>!destinations.has(r.id)))throw Error('Invalid map');
  map=data;svg.setAttribute('viewBox',mapBounds(map).join(' '));
  for(const r of map.rooms){const d=destinations.get(r.id),[x,z,w,h]=r.bounds,cx=x+w/2,cz=z+h/2;
    const g=element('g',{class:'map-room',role:'button',tabindex:0,'aria-label':`${d.name}${d.number?`, Gallery ${d.number}, ${d.exhibits} exhibits`:''}`,'aria-pressed':'false'});
    g.append(element('title',{},d.name),element('rect',{x,y:z,width:w,height:h,rx:.22}));
    if(d.number){g.append(element('text',{x:cx,y:cz-.25,class:'room-number'},d.number),element('text',{x:cx,y:cz+1.55,class:'room-count'},`${d.exhibits} works`))}
    else if(r.id==='spine')g.append(element('text',{x:cx,y:cz,class:'public-label',transform:`rotate(-90 ${cx} ${cz})`},'GRAND PROMENADE'));
    else g.append(element('text',{x:cx,y:cz-1.5,class:'public-label'},'ENTRANCE'));
    g.addEventListener('click',()=>selectFree(d));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectFree(d)}});svg.append(g);controls.get(d.id).push(g);
  }
  for(const p of map.portals){const [x,z]=p.point,h=p.width/2;svg.append(element('line',{x1:p.axis===0?x:x-h,y1:p.axis===0?z-h:z,x2:p.axis===0?x:x+h,y2:p.axis===0?z+h:z,class:'portal'}))}
  route=element('polyline',{class:'route',points:''});destinationMarker=element('circle',{class:'destination-dot',r:.8,visibility:'hidden'});svg.append(route,destinationMarker,element('circle',{class:'reference-dot',cx:map.start.point[0],cy:map.start.point[1],r:.75}));
}
const load=async name=>{const r=await fetch(name);if(!r.ok)throw Error('Directory unavailable');return r.json()};
load('./destinations.json').then(async data=>{
  destinations=new Map(data.destinations.map(d=>[d.id,d]));document.querySelector('#room-count').textContent=`${destinations.size} rooms`;
  for(const d of [...data.destinations].sort((a,b)=>(a.number??'99').localeCompare(b.number??'99'))){const b=document.createElement('button');b.className='destination';b.type='button';b.setAttribute('aria-pressed','false');const n=document.createElement('small');n.textContent=d.number??'—';const label=document.createElement('span');label.textContent=d.name;b.append(n,label);b.addEventListener('click',()=>selectFree(d));directory.append(b);controls.set(d.id,[b])}
  try{renderMap(await load('./map.json'),destinations);if(selected)select(selected)}catch{svg.replaceChildren();const msg=document.createElement('p');msg.className='muted';msg.textContent='Floor plan unavailable. Select a room from the directory.';svg.replaceWith(msg)}
  try{const catalog=await load('./tours.json');if(catalog.schema!=='aeternum-tours@1')throw Error('Invalid tours');tourCatalog=catalog.tours.filter(t=>t.stops.every(s=>destinations.has(s.roomId)));if(guided)setMode(true)}catch{tourPanel.textContent='Tour catalog unavailable.';toursTab.disabled=true;setMode(false)}
  if(parent!==window){tell('hello');const retry=setInterval(()=>{if(connected){clearInterval(retry);return}tell('hello')},2000);window.addEventListener('pagehide',()=>clearInterval(retry),{once:true})}
}).catch(()=>{status.textContent='Directory unavailable. Reload the screen.'});
