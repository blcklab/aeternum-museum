import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createDirectory,createDirectoryLauncher} from '../web-surface/reception/physical-directory.mjs'
const read=async f=>JSON.parse(await readFile(new URL('../web-surface/reception/'+f,import.meta.url),'utf8'))
const navigation=await read('destinations.json'),map=await read('map.json');let invalidations=0,ready=false;const moves=[],labels=[]
const ctx=new Proxy({fillText:(...a)=>labels.push(a[0])},{get:(o,k)=>o[k]??(()=>{})});const canvas={width:960,height:540,getContext:()=>ctx};const app=createDirectory({canvas,navigation,map,canTravel:()=>ready,travel:id=>moves.push(id),invalidate:()=>invalidations++});app.render()
const pointer=(phase,x,y,extra={})=>app.handleInput({type:'pointer',phase,button:0,pointerId:1,uv:[x/1920,1-y/1080],...extra});const settle=()=>new Promise(r=>setImmediate(r));const first=navigation.destinations.find(d=>d.number==='01'),second=navigation.destinations.find(d=>d.number==='02');
assert.equal(pointer('down',600,250),true);assert.equal(pointer('up',600,250),true);pointer('click',600,250);app.render();assert.ok(labels.includes(first.name));assert.ok(invalidations>0)
// Directory selection works without the trusted teleport host.
pointer('click',1600,960);await settle();assert.deepEqual(moves,[]);ready=true;app.render();assert.ok(labels.includes('NAVIGATION READY'))
// Full primary press/release + synthesized click triggers exactly one travel.
pointer('down',1600,960);pointer('up',1600,960);pointer('click',1600,960);await settle();assert.deepEqual(moves,[first.id]);
// No activation when releasing a press on another target, or cancelling a press.
pointer('down',600,250);pointer('up',1300,250);pointer('click',1300,250);pointer('down',1600,960);pointer('cancel',1600,960);pointer('up',1600,960);pointer('click',1600,960);await settle();assert.deepEqual(moves,[first.id]);
// Pixel fallback uses the actual canvas resolution. Click-only and up-only hosts are supported.
app.handleInput({type:'pointer',phase:'down',pointerId:2,button:0,pixel:[650,125]});app.handleInput({type:'pointer',phase:'up',pointerId:2,button:0,pixel:[650,125]});app.handleInput({type:'pointer',phase:'up',pointerId:3,button:0,pixel:[800,480]});await settle();assert.deepEqual(moves,[first.id,second.id]);
assert.equal(pointer('click',600,250,{button:2}),false);app.dispose();assert.equal(pointer('click',600,250),false);console.log('Directory input PASS: primary press/release, synthetic click deduplication, cancellation, hover invalidation, logical UV/pixel mapping and trusted readiness.')

const launcherTransforms=[];const launcherCtx=new Proxy({setTransform:(...args)=>launcherTransforms.push(args)},{get:(o,k)=>o[k]??(()=>{})});
const launcherCanvas={width:960,height:540,getContext:()=>launcherCtx};
const launcher=createDirectoryLauncher({canvas:launcherCanvas,navigation,map});launcher.render();assert.deepEqual(launcherTransforms.at(-1),[.5,0,0,-.5,0,540]);
launcherCanvas.width=1920;launcherCanvas.height=1080;launcher.render();assert.deepEqual(launcherTransforms.at(-1),[1,0,0,-1,0,1080]);launcher.dispose();
console.log('Launcher texture orientation PASS: vertical compensation at both framebuffer sizes.');

const {requestPopupClose}=await import('../web-surface/reception/popup-shortcut.mjs');
const closeMessages=[],host={parent:{postMessage:(...args)=>closeMessages.push(args)}};
const key=(extra={})=>({code:'KeyM',key:'m',preventDefault(){this.prevented=true},...extra});
assert.equal(requestPopupClose(key(),host),true);assert.equal(requestPopupClose(key({code:'Escape',key:'Escape'}),host),true);
for(const extra of [{repeat:true},{ctrlKey:true},{isComposing:true},{target:{isContentEditable:true}},{target:{closest:()=>true}},{code:'KeyW',key:'w'}])assert.equal(requestPopupClose(key(extra),host),false);
const standalone={};standalone.parent=standalone;assert.equal(requestPopupClose(key(),standalone),false);
assert.deepEqual(closeMessages,Array.from({length:2},()=>[{channel:'anyo-web-popup@1',type:'close'},'*']));
console.log('Popup shortcut PASS: M/Escape close relay, typing/modifier/repeat guards and standalone isolation.');
