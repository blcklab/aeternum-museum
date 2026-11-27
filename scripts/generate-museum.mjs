import {readFile, writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {buildMap} from '../web-surface/reception/map-model.mjs'
import {artistDirectory} from '../web-surface/artwork-viewer/encyclopedia.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const read = async f => JSON.parse(await readFile(path.join(root,f),'utf8'))
const manifest = await read('assets/museum/manifest.json')
const world = await read('scripts/world-base.json')
const textureConfig=await read('scripts/texture-profile.json')
const profileArg=process.argv.find(a=>a.startsWith('--texture-profile='))
const textureProfile=profileArg?profileArg.split('=')[1]:textureConfig.profile
if(!['hd','balanced'].includes(textureProfile))throw Error('Texture profile must be hd or balanced')
if(profileArg&&process.argv.includes('--check'))throw Error('Cannot switch profile in check mode')
const visibilityConfig=await read('scripts/visibility-profile.json')
const visibilityArg=process.argv.find(a=>a.startsWith('--visibility-profile='))
const visibilityProfile=visibilityArg?visibilityArg.split('=')[1]:visibilityConfig.profile
if(!['safe','occlusion'].includes(visibilityProfile))throw Error('Visibility profile must be safe or occlusion')
if(visibilityArg&&process.argv.includes('--check'))throw Error('Cannot switch profile in check mode')
const textureIndex=await read('assets/museum/texture-variants.json')
const balancedTextures=new Map(textureIndex.artworks.map(a=>[a.artworkId,a]))
function artworkSource(a){
  const variant=textureProfile==='balanced'?balancedTextures.get(a.id):undefined
  if(textureProfile==='balanced'&&Math.max(a.width,a.height)>textureIndex.maxEdge&&!variant)throw Error(`Missing balanced variant: ${a.id}; regenerate variants`)
  return './assets/museum/'+(variant?.image??a.image)
}
const title = 'AETERNUM — BLCK LAB Museum'
// Keep neighboring gallery shells physically separate; only the promenade shares walls.
const H=4.4, T=.16, W=14, PITCH=12, D=11.5, C=6
const rows=Math.ceil(manifest.categories.length/2), L=rows*PITCH
const artists=new Map(manifest.artworks.map(a=>[a.id,a]))
const rooms=[], entities=[], exhibits=[]
const shortNames=['Renaissance','Baroque & Rococo','Romanticism & Realism','Impressionism','Modern & Surrealism','World Art','Philippine Art','Science & Discovery','Philosophy & Reason','Cosmos & Reality','Mathematics & Medicine','Albert Einstein','Architects of Reality']
const colors=['#323e3a','#493035','#3c434b','#b5aea0','#c5c2b9','#47463e','#3c4140','#2e3c43','#3b3744','#303943','#42423c','#333c46','#363b3a']
const mat=(color,roughness=.88,extra={})=>({color,roughness,receiveShadow:true,castShadow:true,...extra})
world.metadata={title,description:'A walkable museum of art, science and human imagination. Thirteen galleries, drawn from the BLCK LAB artwork catalog.'}
world.environment.background='#20272d'
world.environment.ambientLight={color:'#fff4e8',intensity:.43}
world.environment.lighting={enabled:true,skyColor:'#f2e9dc',groundColor:'#56514a',diffuseIntensity:.44,specularIntensity:.30}
world.environment.sun={color:'#fff1da',intensity:.06,position:[7,10,6],castShadow:false}
world.environment.shadows.enabled=false
// M6.1: use renderer-owned native static batching instead of baking or
// merging geometry. Keep every entity ID, transform, material and collider.
world.environment.optimization={...world.environment.optimization,
  staticBatching:true,staticBatchMinInstances:3,
  cachedBounds:true,pipelineSorting:true,frustumCulling:true,
}
// M6.3: all galleries share one spine; a one-hop cutoff would hide opposite
// galleries through open doorways. Keep two hops; occlusion is an opt-in
// renderer request, never a manual room toggle or a texture eviction policy.
world.visibility={enabled:true,hideUnreachableRooms:true,maxPortalDepth:2}
Object.assign(world.environment.optimization,{hizOcclusion:visibilityProfile==='occlusion',
  hizResolution:128,occlusionHistoryFrames:3,occlusionMinimumPixels:4})
world.materials={floor:mat('#81776c',.65),ceiling:mat('#d3c9b8'),lobby:mat('#3a403e'),spine:mat('#454846'),gold:mat('#ab864c',.36,{metalness:.63}),darkFrame:mat('#222220',.64),innerFrame:mat('#35291c',.65),bench:mat('#51483e',.77),plinth:mat('#8e8272',.72),lightTrim:mat('#d4b687',.45,{emissive:'#ffe1b0',emissiveIntensity:.35})}
// Quiet, period-sensitive architectural finishes; no additional runtime dependencies.
Object.assign(world.materials,{
  trimDark:mat('#302a25',.78),trimDarkEdge:mat('#625343',.65),
  trimPale:mat('#9f998d',.78),trimPaleEdge:mat('#d0c9bb',.7),
  trimStone:mat('#625c52',.78),trimStoneEdge:mat('#a59a86',.65),
  portalBronze:mat('#71604a',.52,{metalness:.25}),
  signPanel:mat('#292925',.82),
  pilasterWood:mat('#44392f',.78),
  pilasterLimestone:mat('#b6afa2',.83),
  pilasterStone:mat('#777169',.76),
  columnIvory:mat('#c9bfae',.62),
  columnBase:mat('#73695c',.68),
  columnBand:mat('#9c825d',.49,{metalness:.25}),
  ceilingRib:mat('#a69a85',.72),
  ceilingRibPale:mat('#c4bdae',.79),
  ceilingRibDark:mat('#68665e',.76),
  ceilingInset:mat('#e1d8c9',.86),
  ceilingInsetPale:mat('#eeeae1',.88),
  ceilingInsetDark:mat('#a49f91',.85),
  fixtureBronze:mat('#79664a',.5,{metalness:.35}),
  fixtureGraphite:mat('#292b2a',.65),
  fixtureDiffuser:mat('#fff1d8',.48,{emissive:'#ffe6b9',emissiveIntensity:.85,castShadow:false}),
  frameGoldBase:mat('#624326',.56,{metalness:.30}),
  frameGoldStep:mat('#94703e',.46,{metalness:.42}),
  frameGoldLip:mat('#c6a166',.38,{metalness:.52}),
  frameBronzeBase:mat('#4c3d2f',.63,{metalness:.24}),
  frameBronzeLip:mat('#92764f',.48,{metalness:.38}),
  frameOakBase:mat('#73573c',.72),
  frameOakLip:mat('#b39468',.61),
  frameGraphiteBase:mat('#252624',.75),
  frameGraphiteLip:mat('#393a37',.59),
  frameRebate:mat('#29241e',.85),
})
// One native slab per room: tiled material maps, never coplanar floor overlays.
// Texture scale expresses the number of repeats over the normalized slab UVs.
const floorFinishes={
  marble:{file:'ivory-marble',meters:2,roughness:.42},
  oak:{file:'oak-herringbone',meters:1.6,roughness:.58},
  limestone:{file:'pale-limestone',meters:2,roughness:.82},
  stone:{file:'charcoal-stone',meters:2,roughness:.76},
}
// Material texture fields reference registered asset IDs, not filesystem paths.
world.assets ??= {}
for(const f of Object.values(floorFinishes)){
  world.assets[`floor-texture-${f.file}`]={type:'texture',format:'webp',src:`./assets/architecture/floors/${f.file}.webp`}
}
function floorMaterial(r){
  const category=r.id.slice(0,2)
  const finish=r.id==='lobby'||r.id==='spine'?'marble':
    ['04','05'].includes(category)?'limestone':
    ['08','10','11','12','13'].includes(category)?'stone':'oak'
  const f=floorFinishes[finish]
  const key=`floor-${finish}-${r.size.join('x').replaceAll('.','p')}`
  world.materials[key]??=mat('#ffffff',f.roughness,{
    baseColorTexture:`floor-texture-${f.file}`,
    textureWrap:'repeat',
    textureTransform:{scale:r.size.map(v=>round(v/f.meters))},
    metalness:0,
  })
  return key
}
const round=n=>Math.round(n*1e5)/1e5
function opening(id,wall,target,offset='center',width=2.8){return {id,type:'portal',wall,offset,width,height:2.9,targetRoom:target,open:true,collision:false}}
function room(id,name,position,size,wall,openings=[]){const r={id,name,position,size,height:H,materials:{wall,floor:'floor',ceiling:'ceiling'},openings};rooms.push(r);return r}
function surf(r,wall,x,y,depth=.025){return {room:r.id,wall,anchor:'center',offset:[round(x),round(y-H/2)],depth,faceRoom:true}}
function text(id,r,wall,x,y,content,width,height,fontSize,color='#f7e9d1',weight=500){entities.push({id,type:'text',content,size:[round(width),round(height)],surface:surf(r,wall,x,y,.12),style:{fontSize,fontWeight:weight,color}})}
function box(id,r,position,size,material,rotation=0){entities.push({id,type:'box',room:r.id,position:position.map(round),size:size.map(round),material,rotation:[0,rotation,0],collision:false})}
// M5: bounded, room-local fill lights; avoid the old unbounded blanket lighting.
function lightProfile(r){
  if(r.id==='lobby'||r.id==='spine')return {color:'#fff0db',fill:r.id==='lobby'?12:11,range:12,spot:7}
  if(['04','05'].includes(r.id.slice(0,2)))return {color:'#fff9f0',fill:12,range:10.5,spot:6}
  if(['08','10','11','12','13'].includes(r.id.slice(0,2)))return {color:'#f5f5ff',fill:10,range:10.5,spot:7}
  return {color:'#fff1dc',fill:10.5,range:10.5,spot:8}
}
function light(id,r,x,z){const p=lightProfile(r);entities.push({id,type:'light',room:r.id,position:[x,3.8,z],lightType:'point',color:p.color,intensity:p.fill,range:p.range,castShadow:false})}
function frameBox(id,r,wall,x,y,width,height,thickness,depth,material){
  const [w,d]=r.size, inset=T/2+depth
  let p, yaw=0
  if(wall==='north')p=[x,y,-d/2+inset]
  if(wall==='south')p=[x,y,d/2-inset]
  if(wall==='west'){p=[-w/2+inset,y,x];yaw=Math.PI/2}
  if(wall==='east'){p=[w/2-inset,y,x];yaw=Math.PI/2}
  box(id,r,p,[width,height,thickness],material,yaw)
}
// Opening offsets in authored Anyo room documents are measured from the wall start.
const wallSpan=(r,wall)=>['north','south'].includes(wall)?r.size[0]:r.size[1]
const openingCenter=(r,o)=>o.offset==='center'?0:o.offset-wallSpan(r,o.wall)/2
const CORNER=.20, JAMB=.13, REVEAL=.025
function trimFinish(r){
  if(r.id==='spine'||r.id==='lobby')return ['trimStone','trimStoneEdge']
  if(['04','05'].includes(r.id.slice(0,2)))return ['trimPale','trimPaleEdge']
  return ['trimDark','trimDarkEdge']
}
// Return disjoint horizontal runs, skipping doorways and their casing footprint.
function baseRuns(r,wall){
  const half=wallSpan(r,wall)/2, start=-half+CORNER,end=half-CORNER
  const gaps=r.openings.filter(o=>o.wall===wall).map(o=>{
    const x=openingCenter(r,o), pad=JAMB+REVEAL
    return [Math.max(start,x-o.width/2-pad),Math.min(end,x+o.width/2+pad)]
  }).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0])
  let cursor=start;const runs=[]
  for(const [a,b] of gaps){if(a>cursor+.01)runs.push([cursor,a]);cursor=Math.max(cursor,b)}
  if(end>cursor+.01)runs.push([cursor,end]);return runs
}
function architecture(r){
  const [finish,edge]=trimFinish(r)
  for(const wall of ['north','south','east','west']){
    const id=`detail-${r.id}-${wall}`, span=wallSpan(r,wall)-2*CORNER
    // Separate height bands avoid coincident faces and leave a deliberate corner reveal.
    baseRuns(r,wall).forEach(([a,b],i)=>{
      const x=(a+b)/2,w=b-a
      frameBox(`${id}-base-${i}`,r,wall,x,.09,w,.18,.05,.032,finish)
      frameBox(`${id}-basecap-${i}`,r,wall,x,.20,w,.04,.065,.04,edge)
    })
    frameBox(`${id}-crown`,r,wall,0,H-.12,span,.18,.06,.038,finish)
    frameBox(`${id}-crown-edge`,r,wall,0,H-.235,span,.05,.085,.05,edge)
    for(const o of r.openings.filter(o=>o.wall===wall)){
      const x=openingCenter(r,o), y=o.height/2, half=o.width/2
      // The casing is outside the clear aperture; no colliders on decorative parts.
      const name=`${id}-${o.id}`
      for(const [side,sign] of [['left',-1],['right',1]]){
        frameBox(`${name}-jamb-${side}`,r,wall,x+sign*(half+JAMB/2),y,JAMB,o.height,.09,.052,'portalBronze')
      }
      frameBox(`${name}-lintel`,r,wall,x,o.height+JAMB/2,o.width+2*JAMB,JAMB,.09,.052,'portalBronze')
    }
  }
}
// M4.4: derive decorative bays from existing wall objects, not from a fixed grid.
// A projected rectangle is conservative: even a text plane gets its full authored bounds.
function wallFootprint(e,r,wall){
  if(e.surface?.room===r.id&&e.surface.wall===wall){
    const [x,dy]=e.surface.offset??[0,0], [w,h]=e.size
    return [x-w/2,x+w/2,H/2+dy-h/2,H/2+dy+h/2]
  }
  if(e.type!=='box'||e.room!==r.id)return null
  const [x,y,z]=e.position,[w,h,t]=e.size, yaw=e.rotation?.[1]??0
  const vertical=['east','west'].includes(wall), sign=['east','south'].includes(wall)?1:-1
  const tangent=vertical?z:x, normal=vertical?x:z
  const halfNormal=r.size[vertical?0:1]/2
  const c=Math.abs(Math.cos(yaw)), sn=Math.abs(Math.sin(yaw))
  const hx=(w*c+t*sn)/2,hz=(w*sn+t*c)/2
  const tangentHalf=vertical?hz:hx, normalHalf=vertical?hx:hz
  // Include only boxes within 30 cm of this wall; avoid interior benches/fixtures.
  const nearest=halfNormal-T/2-sign*normal-normalHalf
  if(nearest>.30||nearest+2*normalHalf<-.001)return null
  return [tangent-tangentHalf,tangent+tangentHalf,y-h/2,y+h/2]
}
function freeBays(r,wall,bottom,top,pad=.13){
  const half=wallSpan(r,wall)/2, start=-half+.48,end=half-.48
  const blocked=[]
  for(const o of r.openings.filter(o=>o.wall===wall)){
    const center=openingCenter(r,o), y=o.elevation??0
    if(y<top&&y+o.height>bottom)blocked.push([center-o.width/2-pad,center+o.width/2+pad])
  }
  for(const e of entities){
    const bounds=wallFootprint(e,r,wall)
    if(bounds&&bounds[2]<top-1e-5&&bounds[3]>bottom+1e-5)blocked.push([bounds[0]-pad,bounds[1]+pad])
  }
  let cursor=start;const result=[]
  for(const [a,b] of blocked.sort((a,b)=>a[0]-b[0])){
    if(b<=cursor||a>=end)continue
    if(a>cursor)result.push([cursor,Math.min(a,end)])
    cursor=Math.max(cursor,Math.min(b,end))
  }
  if(cursor<end)result.push([cursor,end]);return result
}
function pilasterFinish(r){
  if(['lobby','spine'].includes(r.id))return 'pilasterStone'
  return ['04','05'].includes(r.id.slice(0,2))?'pilasterLimestone':'pilasterWood'
}
function pilasters(r){
  const [finish,edge]=trimFinish(r), shaft=pilasterFinish(r)
  for(const wall of ['north','south','east','west']){
    let n=0
    // Start above the existing base cap and finish below the cornice.
    for(const [a,b] of freeBays(r,wall,.27,4.10)){
      if(b-a<.42)continue
      const count=Math.max(1,Math.ceil((b-a)/7.2))
      for(let j=0;j<count;j++){
        const x=a+(j+.5)*(b-a)/count, id=`pilaster-${r.id}-${wall}-${n++}`
        const scale=Math.min(1,((b-a)/count-.06)/.46)
        const part=(name,y0,y1,w,t,material)=>frameBox(`${id}-${name}`,r,wall,x,(y0+y1)/2,w*scale,y1-y0,t,.018+t/2,material)
        part('plinth',.27,.43,.46,.15,finish)
        part('foot',.43,.51,.39,.115,edge)
        part('shaft',.51,3.85,.32,.09,shaft)
        part('neck',3.85,3.94,.39,.115,edge)
        part('capital',3.94,4.10,.46,.15,finish)
      }
    }
  }
}
function galleryPortalPilasters(r){
  if(['spine','lobby'].includes(r.id))return
  const opening=r.openings.find(o=>o.targetRoom==='spine');if(!opening)return
  const wall=opening.wall,[finish,edge]=trimFinish(r),shaft=pilasterFinish(r)
  const bays=freeBays(r,wall,.27,3.10)
  // Paired shorter pilasters frame each entrance without crossing its sign above.
  for(const [side,sign] of [['left',-1],['right',1]]){
    const x=openingCenter(r,opening)+sign*(opening.width/2+1.05)
    if(!bays.some(([a,b])=>x-.23>=a&&x+.23<=b))continue
    const id=`pilaster-${r.id}-${wall}-entry-${side}`
    const part=(name,y0,y1,w,t,material)=>frameBox(`${id}-${name}`,r,wall,x,(y0+y1)/2,w,y1-y0,t,.018+t/2,material)
    part('plinth',.27,.43,.46,.15,finish)
    part('foot',.43,.51,.39,.115,edge)
    part('shaft',.51,2.85,.32,.09,shaft)
    part('neck',2.85,2.94,.39,.115,edge)
    part('capital',2.94,3.10,.46,.15,finish)
  }
}
function wallPanels(r){
  const [finish,edge]=trimFinish(r), bottom=.31,top=.72,rail=.045
  for(const wall of ['north','south','east','west']){
    // Reserve exhibition walls for the artwork; panel the quieter circulation walls.
    if(exhibits.some(e=>e.room===r.id&&e.wall===wall))continue
    let n=0
    // Low-profile wainscot only in unoccupied wall bays; labels take precedence.
    for(const [a,b] of freeBays(r,wall,bottom,top,.15)){
      if(b-a<1.35)continue
      const count=Math.max(1,Math.ceil((b-a)/4.6)), cell=(b-a)/count
      for(let j=0;j<count;j++){
        const width=cell-.20;if(width<1.12)continue
        const x=a+(j+.5)*cell,id=`panel-${r.id}-${wall}-${n++}`
        frameBox(`${id}-bottom`,r,wall,x,bottom+rail/2,width,rail,.035,.035,finish)
        frameBox(`${id}-top`,r,wall,x,top-rail/2,width,rail,.035,.035,edge)
        // Vertical rails stop at horizontal rails rather than overlapping their faces.
        for(const [side,sign] of [['left',-1],['right',1]])
          frameBox(`${id}-${side}`,r,wall,x+sign*(width-rail)/2,(bottom+top)/2,rail,top-bottom-2*rail,.035,.035,finish)
      }
    }
  }
}
function lobbyColumns(r){
  // Four freestanding square piers; keep the central entrance route clear.
  for(const x of [-4.6,4.6])for(const z of [-3.3,3.3]){
    const id=`column-lobby-${x<0?'west':'east'}-${z<0?'north':'south'}`
    const part=(name,y0,y1,w,material,collision=false)=>{
      box(`${id}-${name}`,r,[x,(y0+y1)/2,z],[w,y1-y0,w],material)
      entities.at(-1).collision=collision
    }
    part('plinth',0,.18,.86,'columnBase',true)
    part('foot',.18,.28,.74,'columnBand',true)
    part('shaft',.28,3.94,.60,'columnIvory',true)
    part('neck',3.94,4.06,.74,'columnBand')
    part('capital',4.06,H,.86,'columnBase')
  }
}
// M4.5: shallow applied coffers under the original slab (no ceiling cutouts).
// Every piece occupies a separate volume; M5 supplies separate functional lights.
function ceilingFinish(r){
  if(['lobby','spine'].includes(r.id))return ['ceilingRib','ceilingInset','fixtureBronze']
  if(['04','05'].includes(r.id.slice(0,2)))return ['ceilingRibPale','ceilingInsetPale','fixtureGraphite']
  if(['08','10','11','12','13'].includes(r.id.slice(0,2)))return ['ceilingRibDark','ceilingInsetDark','fixtureGraphite']
  return ['ceilingRib','ceilingInset','fixtureBronze']
}
function ceilingBox(id,r,x,z,w,d,bottom,top,material){
  box(id,r,[x,(bottom+top)/2,z],[w,top-bottom,d],material)
}
function coffer(r,id,x,z,w,d,rail,inset){
  const b=.16, gap=.008
  // Long rails extend across the bay; short returns stop between them.
  for(const sign of [-1,1]){
    ceilingBox(`${id}-rib-z-${sign}`,r,x,z+sign*(d-b)/2,w,b,H-.24,H-.008,rail)
    ceilingBox(`${id}-rib-x-${sign}`,r,x+sign*(w-b)/2,z,b,d-2*b-2*gap,H-.24,H-.008,rail)
  }
  ceilingBox(`${id}-inset`,r,x,z,w-2*b-2*gap,d-2*b-2*gap,H-.075,H-.008,inset)
}
function linearFixture(r,id,x,z,w,d,housing){
  // The diffuser sits below the metal housing, with a smaller footprint.
  ceilingBox(`${id}-housing`,r,x,z,w,d,H-.19,H-.08,housing)
  ceilingBox(`${id}-diffuser`,r,x,z,w-.12,d-.055,H-.225,H-.192,'fixtureDiffuser')
}
function galleryTracks(r,housing){
  for(const sign of [-1,1]){
    const x=sign*4.75,id=`ceiling-${r.id}-track-${sign}`
    ceilingBox(`${id}-rail`,r,x,0,.13,7.8,H-.14,H-.008,housing)
    for(const [i,z] of [-3,0,3].entries()){
      // Physical fixture heads; selected fixtures receive functional wall-wash lights in M5.
      ceilingBox(`${id}-head-${i}`,r,x,z,.25,.36,H-.34,H-.142,housing)
      ceilingBox(`${id}-lens-${i}`,r,x,z,.19,.28,H-.37,H-.342,'fixtureDiffuser')
    }
  }
}
function ceilingArchitecture(r){
  const [rail,inset,housing]=ceilingFinish(r)
  if(r.id==='spine'){
    // Repeated bays follow gallery pairs along the central promenade.
    for(let i=0;i<rows;i++){
      const z=L/2-(i+.5)*PITCH,id=`ceiling-spine-bay-${i}`
      coffer(r,id,0,z,3.7,9.8,rail,inset)
      linearFixture(r,`${id}-linear`,0,z,2.2,.25,housing)
    }
  }else if(r.id==='lobby'){
    // Keep the central coffers clear of the four full-height entrance columns.
    for(const sign of [-1,1]){
      const z=sign*2.65,id=`ceiling-lobby-bay-${sign}`
      coffer(r,id,0,z,7.4,4.6,rail,inset)
      linearFixture(r,`${id}-linear`,0,z,3.2,.32,housing)
    }
  }else{
    for(const sign of [-1,1]){
      const z=sign*2.4,id=`ceiling-${r.id}-bay-${sign}`
      coffer(r,id,0,z,7.8,4.4,rail,inset)
      linearFixture(r,`${id}-linear`,0,z,2.4,.24,housing)
    }
    galleryTracks(r,housing)
  }
}
function signBacking(id,r,wall,x,y,width,height){
  // Front at .095m; text stays at .12m, preserving depth separation.
  frameBox(id,r,wall,x,y,width,height,.035,.0775,'signPanel')
}
const spine=room('spine','Grand Promenade',[0,-L/2],[C,L],'spine',[opening('spine-to-lobby','south','lobby')])
const lobby=room('lobby','Entrance Hall',[0,6],[C+8,12],'lobby',[opening('lobby-to-spine','north','spine')])
// The parent owns the overlapping wall. Anyo clips the child's shared wall.
lobby.attachTo={room:spine.id,wall:'south',align:'center',offset:0,gap:0}
text('welcome-title',lobby,'south',0,2.75,'A E T E R N U M',11,.8,.38,'#f1d9ab',750)
text('welcome-subtitle',lobby,'south',0,1.85,'Museum of Art, Science & Human Imagination',11,.5,.19)
text('welcome-brand',lobby,'south',0,1.25,'B L C K  L A B',9,.4,.15,'#d4b687',650)
signBacking('detail-lobby-direction-panel',lobby,'north',0,3.5,6.2,.57)
text('lobby-direction',lobby,'north',0,3.5,'GALLERIES 01–13',6,.45,.22,'#f1d9ab',750)
text('lobby-guide',lobby,'east',0,2.2,'Explore the galleries. Select a painting to inspect its story.',10,.6,.16)
text('lobby-collection',lobby,'west',0,2.2,`${manifest.defaultDisplayCount} artworks · ${manifest.categories.length} galleries · Art and science`,10,.6,.17)
light('lobby-light',lobby,0,0)
function lines(s,max=40){const out=[];let line='';for(const word of s.split(/\s+/)){if(line && line.length+word.length+1>max){out.push(line);line=word}else line+=(line?' ':'')+word}if(line)out.push(line);return out}
// M4.6: stepped physical frame profiles. Keep the original outer envelope,
// artwork plane and labels fixed. Separate rails at each corner and depth tier.
// No glass overlay: the original image remains directly visible and pickable.
function frameProfile(a,category){
  const c=category.id.slice(0,2)
  if(a.frameStyle!=='antique-gold')return {name:'graphite-float',margin:.045,gap:.012,base:'frameGraphiteBase',tiers:[
    [1,.012,.061,.104,'frameGraphiteBase'],[.90,.012,.106,.178,'frameGraphiteLip']]}
  if(c==='04')return {name:'warm-oak',margin:.085,gap:.006,base:'frameOakBase',tiers:[
    [1,.006,.061,.104,'frameOakBase'],[.79,.006,.106,.178,'frameOakLip']]}
  if(['08','09','10','11','12','13'].includes(c))return {name:'antique-bronze',margin:.085,gap:.006,base:'frameBronzeBase',tiers:[
    [1,.006,.061,.112,'frameBronzeBase'],[.76,.006,.114,.178,'frameBronzeLip']]}
  return {name:'classical-gilt',margin:.085,gap:.005,base:'frameGoldBase',tiers:[
    [1,.005,.061,.101,'frameGoldBase'],[.83,.005,.103,.132,'frameGoldStep'],[.63,.005,.134,.178,'frameGoldLip']]}
}
function frameRing(id,r,wall,x,y,w,h,outer,inner,near,far,material){
  const ow=w+2*outer, oh=h+2*outer, band=outer-inner, seam=.001
  const depth=(near+far)/2, thickness=far-near
  for(const [side,sign] of [['top',1],['bottom',-1]])
    frameBox(`${id}-${side}`,r,wall,x,y+sign*(oh-band)/2,ow,band,thickness,depth,material)
  // Short vertical rails terminate just before the horizontal rails.
  for(const [side,sign] of [['left',-1],['right',1]])
    frameBox(`${id}-${side}`,r,wall,x+sign*(ow-band)/2,y,band,oh-2*band-2*seam,thickness,depth,material)
}
function artworkFrame(id,r,wall,x,y,w,h,profile){
  const f=profile.margin
  frameBox(id+'-back',r,wall,x,y,w+2*f,h+2*f,.05,.03,profile.base)
  // Rebate support ends behind the artwork plane and inside the rail opening.
  const support=profile.gap-.002
  frameBox(id+'-liner',r,wall,x,y,w+2*support,h+2*support,.08,.10,'frameRebate')
  profile.tiers.forEach(([outer,inner,near,far,material],i)=>
    frameRing(`${id}-rim-${i}`,r,wall,x,y,w,h,f*outer,inner,near,far,material))
}
function exhibit(r,wall,x,a,category){
  const id=`exhibit-${category.id.slice(0,2)}-${a.id}`
  const ratio=a.width/a.height, h=Math.min(1.85,2.45/ratio), w=h*ratio, y=1.94
  const profile=frameProfile(a,category), frame=profile.margin
  artworkFrame(id,r,wall,x,y,w,h,profile)
  const caption=a.displayTitle||a.title
  const copy=[`${a.artist} · ${a.date}`,a.description,a.assetNote,a.catalogNote,`Rights: ${a.license||'See source'}`].filter(Boolean).join('\n\n')
  entities.push({id,type:'image',src:artworkSource(a),size:[round(w),round(h)],surface:surf(r,wall,x,y,.15),interaction:{action:'inspect-exhibit',distance:3.5,params:{title:caption,copy,exhibitId:id,artworkId:a.id,roomId:r.id,artist:a.artist,date:a.date,gallery:category.name,description:a.description,license:a.license,source:a.source}}})
  const labelY=y-h/2-frame-.15
  const wrapped=lines(caption,39)
  const pale=['04','05'].includes(category.id.slice(0,2)), titleColor=pale?'#272724':'#f4e5ce', creditColor=pale?'#34342f':'#e4d7c1'
  wrapped.forEach((line,i)=>text(id+'-label-'+i,r,wall,x,labelY-i*.13,line,2.72,.14,.085,titleColor,650))
  text(id+'-credit',r,wall,x,labelY-wrapped.length*.13,`${a.artist} · ${a.date}`,2.72,.15,.073,creditColor,400)
  exhibits.push({entityId:id,artworkId:a.id,category:category.id,room:r.id,wall,offset:x,displaySize:[round(w),round(h)]})
}
for(const [i,c] of manifest.categories.entries()){
  const left=i%2===0, row=Math.floor(i/2), z=-(row+.5)*PITCH, x=(left?-1:1)*(C+W)/2
  const outer=left?'west':'east', inner=left?'east':'west'
  const wallMat='gallery-'+(i+1)
  world.materials[wallMat]=mat(colors[i%colors.length])
  const r=room(c.id,c.name,[x,z],[W,D],wallMat,[opening(`${c.id}-to-spine`,inner,'spine')])
  r.attachTo={room:spine.id,wall:outer,align:'center',offset:z+L/2,gap:0}
  spine.openings.push(opening(`spine-to-${c.id}`,outer,c.id,L+z))
  const sign=`${String(i+1).padStart(2,'0')}  ${(shortNames[i]||c.name).toUpperCase()}`
  const signColor='#f0dfc0'
  signBacking(`detail-${c.id}-entry-panel`,spine,outer,z+L/2,3.45,5.85,.60)
  text(`${c.id}-entry-sign`,spine,outer,z+L/2,3.45,sign,5.65,.48,.19,signColor,700)
  // Shared inner walls now use the promenade material on both sides.
  signBacking(`detail-${c.id}-room-panel`,r,inner,0,3.45,10.2,.60)
  text(`${c.id}-room-sign`,r,inner,0,3.45,sign,10,.48,.19,signColor,700)
  const art=c.artworkIds.map(id=>artists.get(id)).filter(a=>a?.displayByDefault)
  if(art.length>12)throw Error(`${c.id}: more than 12 gallery positions; expand gallery layout before generating`)
  const walls=['north','south',outer]
  for(let j=0;j<walls.length;j++){
    const list=art.filter((_,k)=>k%walls.length===j)
    const span=j===2?D:W
    list.forEach((a,k)=>exhibit(r,walls[j],round((k-(list.length-1)/2)*Math.min(3.4,span/list.length)),a,c))
  }
  light(`${c.id}-light`,r,0,0)
  if(art.length>=5){box(`${c.id}-bench`,r,[0,.25,0],[2.4,.5,.8],'bench');entities.at(-1).collision=true}
  if(left)light(`promenade-light-${row}`,spine,0,z+L/2)
}
text('promenade-end',spine,'north',0,2.1,'THE PURSUIT OF THE UNKNOWN',5.5,.6,.17,'#f1d9ab',700)
// The room openings are complete now, so trim runs can respect every doorway.
for(const r of rooms){
  r.materials.floor=floorMaterial(r)
  architecture(r)
}
// Generate only after all exhibits, labels and existing trim have been placed.
for(const r of rooms){pilasters(r);galleryPortalPilasters(r);wallPanels(r)}
lobbyColumns(lobby)
for(const r of rooms)ceilingArchitecture(r)
// M4.7: typography only after architectural placement, so all existing pilaster,
// panel and exhibit geometry stays byte-for-byte stable. Signs use native text.
function wayfinding(){
  const ink='#f5ead6', brass='#d9b77b', muted='#d6c8b1'
  function removeText(id){
    const i=entities.findIndex(e=>e.id===id&&e.type==='text')
    if(i<0)throw Error(`Missing sign: ${id}`)
    return entities.splice(i,1)[0]
  }
  function signLine(id,r,wall,x,y,content,w,h,font,color=ink,weight=600){
    text(id,r,wall,x,y,content,w,h,font,color,weight)
  }
  for(const [i,c] of manifest.categories.entries()){
    const r=rooms.find(r=>r.id===c.id), number=String(i+1).padStart(2,'0')
    const count=exhibits.filter(e=>e.room===r.id).length
    const label=c.name.toUpperCase()
    // The two rows remain inside the pre-existing sign rectangle and backplate.
    for(const kind of ['entry','room']){
      const old=removeText(`${c.id}-${kind}-sign`), host=rooms.find(r=>r.id===old.surface.room)
      const wall=old.surface.wall,[x,dy]=old.surface.offset,y=H/2+dy
      const width=old.size[0]
      signLine(old.id,host,wall,x,y-.112,label,width,.23,.18,ink,700)
      signLine(`wayfinding-${c.id}-${kind}-eyebrow`,host,wall,x,y+.125,
        kind==='entry'?`GALLERY ${number}  /  ${count} ${count===1?'EXHIBIT':'EXHIBITS'}`:`GALLERY ${number}  /  RETURN TO PROMENADE`,width,.20,.12,brass,600)
    }
  }
  // Lobby directory: physically correct wings (left/west and right/east when
  // facing the north doorway). No floor-mounted objects or collision changes.
  removeText('lobby-guide');removeText('lobby-collection')
  for(const [wall,parity,heading] of [['west',0,'WEST WING / LEFT'],['east',1,'EAST WING / RIGHT']]){
    const id=`wayfinding-directory-${wall}`,width=7.4,height=2.92,cy=2.23
    signBacking(`${id}-panel`,lobby,wall,0,cy,width,height)
    signLine(`${id}-heading`,lobby,wall,0,3.47,heading,7,.25,.20,brass,750)
    signLine(`${id}-subheading`,lobby,wall,0,3.16,'GALLERY DIRECTORY  /  FROM THE LOBBY',7,.20,.13,muted,500)
    const list=manifest.categories.map((c,i)=>({c,i})).filter(({i})=>i%2===parity)
    for(const [row,{c,i}] of list.entries()){
      signLine(`${id}-row-${String(i+1).padStart(2,'0')}`,lobby,wall,0,2.84-row*.245,
        `${String(i+1).padStart(2,'0')}    ${c.name}`,7,.22,.16,ink,600)
    }
    signLine(`${id}-footer`,lobby,wall,0,.99,parity===0?'ENTER THE PROMENADE TO EXPLORE':'SELECT AN ARTWORK TO INSPECT',7,.21,.13,brass,600)
  }
  // Clear instructions at the main entrance and at the far end of the spine.
  const direction=entities.find(e=>e.id==='lobby-direction')
  direction.content='GRAND PROMENADE  /  GALLERIES 01–13'
  direction.style.fontSize=.19;direction.style.color=ink
  const end=entities.find(e=>e.id==='promenade-end')
  end.content='ENTRANCE HALL / BACK ALONG PROMENADE'
  end.style.color=brass;end.style.fontSize=.16
  // Keep every artwork caption, size, position and interaction unchanged;
  // make the existing title/credit typography a touch more consistent.
  for(const e of entities.filter(e=>e.type==='text'&&e.id.startsWith('exhibit-'))){
    if(e.id.includes('-label-'))e.style.fontWeight=700
    else if(e.id.endsWith('-credit'))e.style.fontWeight=500
  }
}
wayfinding()

// M4.8: an axial arrival composition, not a new room shell. Preserve the
// central passage, both directories and the existing collision architecture.
function grandEntrance(){
  const cream='#f5ead6', brass='#d9b77b', muted='#d6c8b1'
  const line=(id,wall,x,y,copy,w,h,font,color=cream,weight=600)=>text(id,lobby,wall,x,y,copy,w,h,font,color,weight)
  // South identity wall: a single dark panel with restrained brass perimeter.
  for(const id of ['welcome-title','welcome-subtitle','welcome-brand']){
    const i=entities.findIndex(e=>e.id===id);if(i<0)throw Error(`Missing lobby sign ${id}`);entities.splice(i,1)
  }
  signBacking('arrival-identity-panel',lobby,'south',0,2.38,10.8,2.8)
  line('welcome-brand','south',0,3.45,'B L C K  L A B  /  M U S E U M',10,.26,.18,brass,650)
  line('welcome-title','south',0,2.79,'A E T E R N U M',10,.75,.50,cream,750)
  line('welcome-subtitle','south',0,2.09,'Museum of Art, Science & Human Imagination',10,.38,.24,cream,500)
  line('arrival-identity-motto','south',0,1.55,'The pursuit of the unknown.',10,.30,.20,muted,500)
  line('arrival-identity-count','south',0,1.19,`${manifest.defaultDisplayCount} ARTWORKS  /  ${manifest.categories.length} GALLERIES`,10,.19,.15,brass,600)
  // Border bars are outside the panel footprint; no overlapping faces.
  for(const sign of [-1,1]){
    frameBox(`arrival-identity-rail-h-${sign}`,lobby,'south',0,2.38+sign*1.44,10.88,.035,.025,.087,'columnBand')
    frameBox(`arrival-identity-rail-v-${sign}`,lobby,'south',sign*5.44,2.38,.035,2.81,.025,.087,'columnBand')
  }
  // The forward view frames the existing portal with two concise plaques.
  // Keep below the lintel/sign and above the wainscot; actual wing directories
  // on east/west walls remain the authoritative gallery listing.
  const wings=[['west',-3.15,0,'WEST WING'],['east',3.15,1,'EAST WING']]
  for(const [wing,x,parity,label] of wings){
    const id=`arrival-${wing}`, list=manifest.categories.filter((_,i)=>i%2===parity)
    signBacking(`${id}-panel`,lobby,'north',x,1.86,2.45,1.90)
    line(`${id}-heading`,'north',x,2.46,label,2.20,.30,.22,brass,750)
    line(`${id}-count`,'north',x,1.98,`${list.length} GALLERIES`,2.20,.28,.19,cream,650)
    line(`${id}-guide`,'north',x,1.49,wing==='west'?'LEFT OF PROMENADE':'RIGHT OF PROMENADE',2.20,.24,.12,muted,500)
  }
  const gateway=entities.find(e=>e.id==='lobby-direction')
  gateway.content='AETERNUM  /  GRAND PROMENADE';gateway.style.fontSize=.23
  // Two low seats in the rear side bays, beyond the main aisle and spawn.
  for(const [wing,x] of [['west',-4.05],['east',4.05]]){
    const id=`arrival-seat-${wing}`
    box(`${id}-base`,lobby,[x,.18,5.0],[1.96,.36,.62],'columnBase');entities.at(-1).collision=true
    box(`${id}-top`,lobby,[x,.425,5.0],[2.20,.12,.76],'bench');entities.at(-1).collision=true
  }
}
grandEntrance()

// M5: one wide, aimed spotlight per occupied exhibition wall, not one per painting.
// This limits authored spots to three per gallery. Sekai64 still selects its own
// bounded active lights; there is no assumption that every room lights simultaneously.
function wallPoint(r,wall,t,y){
  const [w,d]=r.size, inset=T/2+.15
  if(wall==='north')return [t,y,-d/2+inset]
  if(wall==='south')return [t,y,d/2-inset]
  if(wall==='west')return [-w/2+inset,y,t]
  return [w/2-inset,y,t]
}
const unit=v=>{const len=Math.hypot(...v);if(len<=0)throw Error('Zero light direction');return v.map(n=>n/len)}
const vector=(a,b)=>a.map((v,i)=>v-b[i])
function wash(id,r,position,target,extent){
  const p=lightProfile(r), direction=unit(vector(target,position))
  // Cover the complete artwork group (including the frames) with a soft outer cone.
  const rays=extent.map(pt=>vector(pt,position))
  const maxAngle=Math.max(...rays.map(v=>Math.acos(Math.max(-1,Math.min(1,unit(v).reduce((sum,n,i)=>sum+n*direction[i],0))))))
  const outer=Math.min(1.35,Math.max(.38,maxAngle+.09))
  const range=Math.max(7.5,...rays.map(v=>Math.hypot(...v)+.85))
  entities.push({id,type:'light',room:r.id,position:position.map(round),lightType:'spot',direction:direction.map(round),color:p.color,intensity:p.spot,range:round(range),innerCone:round(outer*.60),outerCone:round(outer),castShadow:false})
}
for(const r of rooms){
  if(r.id==='lobby'||r.id==='spine')continue
  for(const wall of ['north','south','west','east']){
    const group=exhibits.filter(e=>e.room===r.id&&e.wall===wall)
    if(!group.length)continue
    const lo=Math.min(...group.map(e=>e.offset-e.displaySize[0]/2-.09)), hi=Math.max(...group.map(e=>e.offset+e.displaySize[0]/2+.09))
    const h=Math.max(...group.map(e=>e.displaySize[1]/2+.09))
    // North/south wash comes from the linear fixture; side wash from the center track head.
    const position=wall==='north'||wall==='south'?[0,4.10,wall==='north'?-2.4:2.4]:[wall==='west'?-4.75:4.75,3.95,0]
    wash(`lighting-${r.id}-wash-${wall}`,r,position,wallPoint(r,wall,(lo+hi)/2,1.94),[lo,hi].flatMap(t=>[1.94-h,1.94+h].map(y=>wallPoint(r,wall,t,y))))
  }
}
// Rear identity wall: modest warm wash from the existing south linear fixture.
wash('lighting-lobby-identity-wash',lobby,[0,4.10,2.65],wallPoint(lobby,'south',0,2.5),[-5.4,5.4].flatMap(t=>[1.1,3.6].map(y=>wallPoint(lobby,'south',t,y))))

// M7.5 refinement: simplify the lobby information architecture.
// Keep a single wall-mounted directory on the west wall, remove the redundant
// east/west wing directories, and clear the doorway-side wing plaques.
for(const pattern of ['wayfinding-directory-west-','wayfinding-directory-east-','arrival-west-','arrival-east-']){
  for(let i=entities.length-1;i>=0;i--)if(entities[i].id.startsWith(pattern))entities.splice(i,1)
}
const gateway=entities.find(e=>e.id==='lobby-direction')
gateway.content='GRAND PROMENADE';gateway.style.fontSize=.24;gateway.style.color='#f5ead6'
const screenZ=0,screenY=2.18,screenSize=[4.8,2.7]
// No housing or bezel: the plane sits 3 cm in front of the inner wall face.
// Physical texture presentation: fixed world plane, scene depth and UV input.
entities.push({id:'reception-screen',type:'web-surface',room:lobby.id,position:[-6.89,screenY,screenZ],rotation:[0,Math.PI/2,0],size:screenSize,interaction:{action:'open-web-popup',params:{app:'reception',title:'AETERNUM — Museum Directory'},distance:6,cursor:'pointer'},webSurface:{title:'AETERNUM Visitor Directory',source:{type:'app',app:'reception'},target:{type:'plane',size:screenSize},renderMode:'auto',presentation:{type:'texture',resolution:[1920,1080],fit:'stretch',side:'front',emissive:{color:'#ffffff',intensity:.35,useTexture:true}},interaction:{pointer:true,keyboard:false,scroll:false},fallback:{type:'snapshot',image:'./assets/screens/reception-fallback.png'},framePolicy:{mode:'fixed-rate',fps:8}}})
// World-space eye-height destinations near gallery entrances, away from benches.
const destinations=rooms.map(r=>{
 const category=manifest.categories.find(c=>c.id===r.id),i=manifest.categories.indexOf(category)
 const local=r.id==='lobby'?[0,1.65,2.8]:r.id==='spine'?[0,1.65,L/2-2]:[r.position[0]<0?3.5:-3.5,1.65,0]
 return {id:r.id,name:r.name,number:i<0?null:String(i+1).padStart(2,'0'),wing:i<0?'public':i%2===0?'west':'east',exhibits:exhibits.filter(e=>e.room===r.id).length,position:[round(r.position[0]+local[0]),local[1],round(r.position[1]+local[2])]}
})
const navigation={schema:'aeternum-navigation@1',worldId:'aeternum-museum',destinations}
const floorPlan=buildMap(rooms,navigation,[0,8.8])
const inspection={schema:'aeternum-inspection@1',exhibits:exhibits.map(e=>{const a=artists.get(e.artworkId);return {...e,title:a.displayTitle||a.title,artist:a.artist,date:a.date,description:a.description,license:a.license,source:a.source,originalImage:'./assets/museum/'+a.image}})}

// Dedicated HD viewer catalog is independent of the in-world texture profile.
const viewerCatalog={schema:'aeternum-artwork-viewer@1',galleries:manifest.categories.map(c=>({id:c.id,name:c.name})),exhibits:inspection.exhibits.map(e=>{const a=artists.get(e.artworkId);return {...e,gallery:manifest.categories.find(c=>c.id===e.room).name,width:a.width,height:a.height,credit:a.credit??a.attribution??''}})}

const profileSource=await read('assets/museum/artist-profiles.json')
viewerCatalog.artists=artistDirectory(viewerCatalog.exhibits,profileSource)
viewerCatalog.editorialNote=profileSource.editorialNote
viewerCatalog.science=await read('assets/museum/science-context.json')
const knownWorks=new Set(viewerCatalog.exhibits.map(e=>e.artworkId))
for(const subject of viewerCatalog.science)for(const id of subject.works)if(!knownWorks.has(id))throw Error('Unknown science context artwork: '+id)

// Do not author both absolute position and attachment in the published JSON.
// Positions above are the resolved design coordinates used while generating exhibits.
for(const r of rooms)if(r.attachTo)delete r.position
world.building={id:'aeternum-museum',name:title,defaults:{roomHeight:H,wallThickness:T,floorThickness:.18,ceilingThickness:.12},floors:[{id:'ground',name:'Ground',elevation:0,rooms}]}
world.entities=entities
world.exploration={spawn:{room:'lobby',position:[0,1.65,2.8]},pointerLock:true}
world.data={museum:{artworkCount:manifest.defaultDisplayCount,exhibitCount:exhibits.length}}
const mobileIndex=await read('assets/museum/mobile-textures.json')
world.data.museum.mobileTextures={schema:mobileIndex.schema,profiles:Object.fromEntries(Object.entries(mobileIndex.profiles).map(([id,p])=>[id,{maxEdge:p.maxEdge,artworkIds:p.artworks.map(a=>a.artworkId)}]))}
world.revision=34
// The generated deployment document is readable at the entity level while
// avoiding thousands of lines of whitespace in repeated transforms.
function serializeWorld(doc){
  return '{\n'+Object.entries(doc).map(([key,value])=>{
    if(key==='entities')return '  "entities": [\n'+value.map(e=>'    '+JSON.stringify(e)).join(',\n')+'\n  ]'
    return '  '+JSON.stringify(key)+': '+JSON.stringify(value,null,2).replaceAll('\n','\n  ')
  }).join(',\n')+'\n}\n'
}
for(const [file,doc] of [['world.anyo.json',world],['assets/museum/exhibits.json',{schema:'blcklab-museum-exhibits@1',exhibits}],['web-surface/reception/destinations.json',navigation],['web-surface/reception/map.json',floorPlan],['assets/museum/inspection.json',inspection],['web-surface/artwork-viewer/catalog.json',viewerCatalog]]){
 const result=file==='world.anyo.json'?serializeWorld(doc):JSON.stringify(doc,null,2)+'\n', target=path.join(root,file)
 if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==result)throw Error(file+' differs from generated output; run npm run generate if intended')}else await writeFile(target,result)
}
if(profileArg)await writeFile(path.join(root,'scripts/texture-profile.json'),JSON.stringify({profile:textureProfile},null,2)+'\n')
if(visibilityArg)await writeFile(path.join(root,'scripts/visibility-profile.json'),JSON.stringify({profile:visibilityProfile},null,2)+'\n')
console.log(`Generated ${rooms.length} rooms, ${exhibits.length} exhibits, ${entities.length} entities (${textureProfile} textures, ${visibilityProfile} visibility).`)
