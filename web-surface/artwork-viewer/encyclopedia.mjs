// Pure encyclopedia helpers. The artist's credit is the catalog identity.
export function artistDirectory(exhibits,source){
  if(source?.schema!=='aeternum-artist-profiles@1'||!source.artists)throw Error('Invalid artist profiles');
  const groups=new Map();
  for(const e of exhibits){if(!groups.has(e.artist))groups.set(e.artist,new Map());const works=groups.get(e.artist);if(!works.has(e.artworkId))works.set(e.artworkId,{artworkId:e.artworkId,entityId:e.entityId,title:e.title,date:e.date,galleries:[]});const work=works.get(e.artworkId);if(!work.galleries.includes(e.gallery))work.galleries.push(e.gallery)}
  if(Object.keys(source.artists).length!==groups.size)throw Error('Artist profile coverage mismatch');
  return [...groups].map(([name,works])=>{const p=Object.hasOwn(source.artists,name)&&source.artists[name];if(!p||!p.biography||!p.context||!p.movement||!p.dates||!Number.isInteger(p.timelineYear)||!Array.isArray(p.references))throw Error('Missing or invalid profile: '+name);return {name,...p,works:[...works.values()]}}).sort((a,b)=>a.timelineYear-b.timelineYear||a.name.localeCompare(b.name,'en'));
}
const normalized=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function filterArtists(artists,query='',movement=''){
 const words=normalized(query).trim().split(/\s+/).filter(Boolean);return artists.filter(a=>(!movement||a.movement===movement)&&words.every(w=>normalized([a.name,a.dates,a.movement,...a.works.map(w=>w.title)].join(' ')).includes(w)));
}
export function viewerLink(exhibit){return './index.html?'+new URLSearchParams({exhibit}).toString()}
export function artistLink(artist){return './artists.html?'+new URLSearchParams({artist}).toString()}
