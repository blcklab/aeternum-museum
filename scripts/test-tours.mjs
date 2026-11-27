import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createTourStore} from '../web-surface/reception/tour-model.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const tours=await read('web-surface/reception/tours.json'),navigation=await read('web-surface/reception/destinations.json'),catalog=await read('web-surface/artwork-viewer/catalog.json');
const exhibits=new Map(catalog.exhibits.map(e=>[e.entityId,e]));const state=createTourStore(tours,navigation);
assert.equal(tours.tours.length,4);assert.equal(state.snapshot(),null);assert.equal(state.start('unknown'),false);
let stops=0;
for(const t of tours.tours){assert.ok(t.title&&t.description);assert.ok(state.start(t.id));for(const [i,s] of t.stops.entries()){assert.equal(exhibits.get(s.exhibitId)?.room,s.roomId);assert.equal(exhibits.get(s.exhibitId)?.title,s.title);assert.ok(s.note.length>20);assert.deepEqual(state.snapshot(),{tourId:t.id,next:i});assert.ok(!state.arrive(t.id,i+1,s.roomId));assert.ok(!state.arrive(t.id,i,'lobby'));assert.ok(state.start(t.id));assert.equal(state.snapshot().next,i);assert.ok(state.arrive(t.id,i,s.roomId));assert.ok(!state.arrive(t.id,i,s.roomId));stops++;}assert.equal(state.snapshot().next,t.stops.length);state.end();assert.equal(state.snapshot(),null)}
assert.equal(stops,17);assert.throws(()=>createTourStore({schema:tours.schema,tours:[{id:'bad',stops:[{roomId:'missing'}]}]},navigation));
console.log(`Guided tour catalog PASS: ${tours.tours.length} journeys, ${stops} linked stops, ordered progression, rejection of skips/replays, and completion/reset.`);
