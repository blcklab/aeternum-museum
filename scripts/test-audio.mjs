import assert from 'node:assert/strict'
import {readFile,stat} from 'node:fs/promises'
const root=new URL('../',import.meta.url),read=async f=>JSON.parse(await readFile(new URL(f,root),'utf8'))
const manifest=await read('assets/audio/soundscapes.json'),map=await read('web-surface/reception/map.json')
assert.equal(manifest.schema,'anyo-world-soundscapes@1');assert.equal(typeof manifest.autoplay,'boolean');assert.equal(typeof manifest.shuffle,'boolean');assert.equal(manifest.tracks.find(t=>t.id==='bach-air').license,'CC BY-NC 4.0');assert.ok(manifest.tracks.length>0&&manifest.tracks.length<=64);assert.equal(manifest.ambience.zones.length,3)
assert.equal(new Set(manifest.tracks.map(t=>t.id)).size,manifest.tracks.length)
assert.deepEqual(Object.keys(manifest.ambience.rooms).sort(),map.rooms.map(r=>r.id).sort());assert.equal(map.rooms.length,15)
for(const t of [...manifest.tracks,...manifest.ambience.zones]){assert.match(t.file,/^[a-z0-9-]+\.(mp3|ogg)$/);assert.ok((await stat(new URL('assets/audio/'+t.file,root))).size>10000)}
for(const t of manifest.tracks){assert.match(t.id,/^[a-z0-9-]{1,64}$/);assert.ok(t.title&&t.artist);if(t.waveform){assert.match(t.waveform,/^[a-z0-9-]+\.waveform\.json$/);const w=await read('assets/audio/'+t.waveform);assert.equal(w.schema,'anyo-audio-waveform@1');assert.equal(w.rate,60);assert.ok(w.duration>0&&w.duration<=900);assert.equal(w.peaks.length,Math.ceil(w.duration*w.rate-1e-8));assert.ok(w.peaks.every(n=>Number.isFinite(n)&&n>=0&&n<=1));assert.ok(w.peaks.some(n=>n>0))}}
for(const z of Object.values(manifest.ambience.rooms))assert.ok(manifest.ambience.zones.some(a=>a.id===z))
console.log(`World audio: PASS — ${manifest.tracks.length} music tracks, ${manifest.ambience.zones.length} room loops, ${map.rooms.length} room mappings`)
const world=await read('world.anyo.json'),steps=manifest.footsteps;
assert.deepEqual(Object.keys(steps.rooms).sort(),map.rooms.map(r=>r.id).sort());assert.equal(steps.surfaces.length,4);
for(const r of world.building.floors.flatMap(f=>f.rooms))assert.equal(steps.rooms[r.id],r.materials.floor.split('-')[1]);
for(const s of steps.surfaces){assert.equal(s.files.length,2);for(const f of s.files){assert.match(f,/^step-[a-z]+-[12]\.ogg$/);const b=await readFile(new URL('assets/audio/'+f,root));assert.equal(b.subarray(0,4).toString(),'OggS');assert.ok(b.length>1000&&b.length<30000)}}
assert.equal(manifest.tracks.length,2);assert.equal(manifest.autoplay,true);assert.equal(manifest.shuffle,true);
console.log('Footsteps: PASS — four floor finishes, eight original samples, all 15 rooms mapped')
