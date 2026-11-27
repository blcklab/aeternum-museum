import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {artistDirectory,filterArtists,viewerLink,artistLink} from '../web-surface/artwork-viewer/encyclopedia.mjs'
import {safeSource} from '../web-surface/artwork-viewer/model.mjs'
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'))
const catalog=await read('web-surface/artwork-viewer/catalog.json'),profiles=await read('assets/museum/artist-profiles.json')
assert.equal(catalog.artists.length,49);assert.deepEqual(catalog.artists,artistDirectory(catalog.exhibits,profiles));assert.equal(catalog.editorialNote,profiles.editorialNote)
assert.equal(catalog.artists.flatMap(a=>a.works).length,72)
for(const [i,a] of catalog.artists.entries()){
 assert.ok(a.biography.length>60&&a.context.length>30);assert.ok(a.dates&&a.movement);if(i)assert.ok(catalog.artists[i-1].timelineYear<=a.timelineYear)
 const records=catalog.exhibits.filter(e=>e.artist===a.name);assert.equal(a.works.length,new Set(records.map(e=>e.artworkId)).size)
 for(const w of a.works){assert.ok(records.some(e=>e.entityId===w.entityId&&e.artworkId===w.artworkId));assert.deepEqual(new Set(w.galleries),new Set(records.filter(e=>e.artworkId===w.artworkId).map(e=>e.gallery)));assert.equal(new URL(viewerLink(w.entityId),'https://example.com/a/').searchParams.get('exhibit'),w.entityId)}
 assert.equal(new URL(artistLink(a.name),'https://example.com/a/').searchParams.get('artist'),a.name);for(const r of a.references)assert.ok(safeSource(r.url)?.startsWith('https:'))
}
assert.equal(filterArtists(catalog.artists,'felix resurreccion').length,1);assert.equal(filterArtists(catalog.artists,'mona lisa')[0].name,'Leonardo da Vinci');assert.equal(filterArtists(catalog.artists,'','Impressionism').length,2);assert.equal(filterArtists(catalog.artists,'not-a-real-artist').length,0);assert.throws(()=>artistDirectory(catalog.exhibits,{...profiles,artists:{}}));assert.ok(filterArtists(catalog.artists,'einstein').length>=2)
assert.deepEqual(catalog.science,await read('assets/museum/science-context.json'));assert.equal(catalog.science.length,4);assert.equal(new Set(catalog.science.flatMap(s=>s.works)).size,6);for(const s of catalog.science){assert.ok(s.summary&&s.name);for(const id of s.works)assert.ok(catalog.exhibits.some(e=>e.artworkId===id));if(s.reference)assert.ok(safeSource(s.reference)?.startsWith('https:'))}
console.log('Encyclopedia PASS: 49 artist credits, 72 unique works, timeline, movement filtering, accent-insensitive search, deep links, cross-list deduplication and source URL checks.')
