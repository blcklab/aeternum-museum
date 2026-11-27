import {createDirectoryLauncher} from './physical-directory.mjs';
const PROTOCOL='anyo-sandboxed-texture@1';
let token='',canvas,app,active=true,paused=false,generation=0;
const send=(type,extra={},transfer=[])=>{if(token)parent.postMessage({protocol:PROTOCOL,token,type,...extra},'*',transfer)};
const load=async name=>{const r=await fetch(name);if(!r.ok)throw Error('Cannot load '+name);return r.json()};
window.addEventListener('message',async e=>{const m=e.data;if(e.source!==parent||parent===window||m?.protocol!==PROTOCOL||!m.token||(token&&token!==m.token))return;
 try{if(m.type==='init'&&!token){token=m.token;const g=++generation;canvas=new OffscreenCanvas(m.width,m.height);const [navigation,map]=await Promise.all([load('./destinations.json'),load('./map.json')]);if(g!==generation)return;app=createDirectoryLauncher({canvas,navigation,map,invalidate:()=>send('invalidate')});send('ready');send('invalidate')}
 else if(m.type==='frame'&&app&&active&&!paused){app.render();const bitmap=canvas.transferToImageBitmap();send('frame',{requestId:m.requestId,bitmap},[bitmap])}
 else if(m.type==='resize'&&canvas){canvas.width=m.width;canvas.height=m.height;send('invalidate')}
 else if(m.type==='input')app?.handleInput(m.event);
 else if(m.type==='active'){active=Boolean(m.active);if(active)send('invalidate')}
 else if(m.type==='pause')paused=true;else if(m.type==='resume'){paused=false;send('invalidate')}
 else if(m.type==='dispose'){generation++;app?.dispose();app=null;canvas=null}
 }catch(error){send('error',{message:String(error.message??error)})}
});
