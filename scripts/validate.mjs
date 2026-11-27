import { inspectWorldDocument, resolveWorldDocumentImports } from '@blcklab/anyo'
import { access, readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { validateCharacterAssets } from './character-assets.mjs'
import { loadProjectAnyoDocument, readRootWorld, rootSourceContext } from './anyo-documents.mjs'

async function exists(file) { try { await access(file); return true } catch { return false } }
function formatIssues(issues) { return issues.slice(0, 8).map(issue => issue.code + ' ' + issue.path + ': ' + issue.message).join('\n') }
function countImports(imports) { return Object.values(imports).reduce((total, item) => total + 1 + countImports(item.imports || {}), 0) }

const project=JSON.parse(await readFile('anyo.project.json','utf8'))
if(project.schema!=='anyo-project@1') throw new Error('anyo.project.json must use anyo-project@1')
if(!/^[a-z0-9][a-z0-9._-]*$/.test(String(project.id||''))) throw new Error('anyo.project.json has invalid id')
if(!String(project.title||'').trim()) throw new Error('anyo.project.json title is required')
if(project.world!=='./world.anyo.json') throw new Error('anyo.project.json world must be ./world.anyo.json')
if(project.directories?.assets!=='./assets/' || project.directories?.webSurfaces!=='./web-surface/') throw new Error('anyo.project.json must use canonical assets and web-surface directories')
if(!(await exists('world.anyo.json'))) throw new Error('anyo.project.json references missing world.anyo.json')
const { document: world } = await readRootWorld()
if(world.version!=='0.9') throw new Error('Generated project expects Anyo World 0.9; found '+String(world.version))
const validation=inspectWorldDocument(world)
if(!validation.valid) throw new Error('Anyo World 0.9 validation failed:\n'+formatIssues(validation.errors))
const graph=await resolveWorldDocumentImports(world,{sourceContext:rootSourceContext,documentLoader:loadProjectAnyoDocument})
console.log('Anyo World 0.9 contract: PASS')
const importCount=countImports(graph.imports)
if(importCount) console.log('Anyo object imports: PASS ('+importCount+')')

if(project.manifests?.atlas && !(await exists('atlas.world.json'))) throw new Error('Project references missing atlas.world.json')
if(await exists('atlas.world.json')) {
  if(project.manifests?.atlas!=='./atlas.world.json') throw new Error('Atlas project must declare manifests.atlas as ./atlas.world.json')
  const manifest=JSON.parse(await readFile('atlas.world.json','utf8'))
  if(manifest.schema!=='anyo-world-manifest@1') throw new Error('atlas.world.json must use anyo-world-manifest@1')
  if(!manifest.id||!manifest.title||!manifest.world||!manifest.location) throw new Error('Manifest is missing id, title, world, or location')
  const {latitude,longitude}=manifest.location
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180) throw new Error('Invalid manifest location')
  if(!manifest.placement||!['exact-building','nearest-building','coordinate-only'].includes(manifest.placement.mapMatch)) throw new Error('Manifest must declare a geographic match mode')
  if(!world.entities.some(entity=>entity.components?.some(component=>component.type==='anyo.mapSpawn'))) throw new Error('Atlas world must include anyo.mapSpawn')
  if(!world.entities.some(entity=>entity.components?.some(component=>component.type==='anyo.mapExit'))) throw new Error('Atlas world must include anyo.mapExit')
  const entrance=world.data?.atlas?.entrance
  if(!entrance?.room||!entrance?.opening) throw new Error('Atlas world must declare data.atlas.entrance room/opening')
  console.log('Anyo Atlas contract: PASS')
  console.log('Lot:', manifest.lotId)
  console.log('Location:', latitude.toFixed(6)+', '+longitude.toFixed(6))
  console.log('Local Atlas:', 'http://127.0.0.1:4173/?manifest='+encodeURIComponent('http://127.0.0.1:4174/atlas.world.json')+'&backend=webgl2')
}

const appEntities = world.entities.filter(entity=>entity?.type==='web-surface' && entity.webSurface?.source?.type==='app')
const registered = new Set()
if(await exists('web-surface')) {
  for(const entry of await readdir('web-surface',{withFileTypes:true})) {
    if(!entry.isDirectory()) continue
    const manifestPath=path.join('web-surface',entry.name,'web-surface.json')
    if(!(await exists(manifestPath))) continue
    const app=JSON.parse(await readFile(manifestPath,'utf8'))
    if(app.schema!=='anyo-web-app@1') throw new Error(manifestPath+' must use anyo-web-app@1')
    if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(String(app.id||''))) throw new Error(manifestPath+' has invalid id')
    if(app.id!==entry.name) throw new Error(manifestPath+' id must match its directory')
    if(registered.has(app.id)) throw new Error('Duplicate Web Surface app id: '+app.id)
    const rawEntry=String(app.entry||'')
    if(!rawEntry || /^[a-z][a-z0-9+.-]*:/i.test(rawEntry) || rawEntry.startsWith('/') || rawEntry.split(/[?#]/,1)[0].split('/').includes('..')) throw new Error(manifestPath+' entry must stay inside the app directory')
    const entryFile=path.resolve('web-surface',entry.name,rawEntry.split(/[?#]/,1)[0])
    const appRoot=path.resolve('web-surface',entry.name)+path.sep
    if(!entryFile.startsWith(appRoot) || !(await exists(entryFile))) throw new Error(manifestPath+' entry file does not exist')
    const actualEntry=await realpath(entryFile)
    const actualAppRoot=await realpath(appRoot) + path.sep
    if(!actualEntry.startsWith(actualAppRoot) || !(await stat(actualEntry)).isFile()) throw new Error(manifestPath+' entry must stay inside the app directory')
    if(app.shortcut!==undefined && (!app.shortcut || !['KeyM','KeyI','KeyJ','KeyK','KeyL','KeyN','KeyO','KeyP','KeyU'].includes(app.shortcut.key) || typeof app.shortcut.label!=='string' || !app.shortcut.label.trim() || app.shortcut.label.length>64)) throw new Error(manifestPath+' has invalid optional popup shortcut')
    registered.add(app.id)
  }
}
for(const entity of appEntities) if(!registered.has(entity.webSurface.source.app)) throw new Error('World references unregistered Web Surface app: '+entity.webSurface.source.app)
if(registered.size) console.log('Web Surface apps: PASS ('+registered.size+')')
const characters = await validateCharacterAssets()
if (characters.declared) console.log(`World character assets: PASS (${characters.avatars} avatars, ${characters.catalogs} catalogs, ${characters.clips} clip references)`)
console.log('Anyo project contract: PASS')
console.log('Anyo World Loader contract: PASS')
