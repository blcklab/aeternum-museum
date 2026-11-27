// Trusted host code only. Do not import from arbitrary repository URLs at runtime.
const CHANNEL='aeternum-navigation@1';
export function installReceptionBridge({iframe,player,navigation,isActiveWorld,hostWindow=globalThis.window,expectedOrigin='null'}){
 if(!iframe?.contentWindow||!hostWindow||typeof player?.teleport!=='function'||typeof isActiveWorld!=='function')throw new TypeError('Trusted reception iframe, player and world guard required');
 if(navigation?.schema!==CHANNEL||navigation.worldId!=='aeternum-museum'||!Array.isArray(navigation.destinations))throw new TypeError('Invalid trusted directory');
 const targets=new Map();for(const d of navigation.destinations){if(typeof d.id!=='string'||targets.has(d.id)||!Array.isArray(d.position)||d.position.length!==3||!d.position.every(Number.isFinite))throw new TypeError('Invalid destination');targets.set(d.id,[...d.position])}
 const frame=iframe.contentWindow;let disposed=false,busy=false,ready=false;
 const reply=(type,data={})=>frame.postMessage({channel:CHANNEL,type,...data},expectedOrigin==='null'?'*':expectedOrigin);
 const onLoad=()=>{dispose()};
 const onMessage=async event=>{
  if(disposed||event.source!==frame||iframe.contentWindow!==frame||event.origin!==expectedOrigin||!isActiveWorld())return;
  const m=event.data;if(!m||m.channel!==CHANNEL)return;
  if(m.type==='hello'){ready=true;reply('ready');return}
  if(m.type!=='travel'||!ready||!Number.isSafeInteger(m.requestId)||m.requestId<1)return;
  if(busy||!targets.has(m.roomId)){reply('result',{requestId:m.requestId,ok:false});return}
  busy=true;try{await player.teleport({position:[...targets.get(m.roomId)],resetMotion:true,clearInput:true});if(!disposed&&isActiveWorld())reply('result',{requestId:m.requestId,ok:true})}catch{if(!disposed)reply('result',{requestId:m.requestId,ok:false})}finally{busy=false}
 };
 hostWindow.addEventListener('message',onMessage);iframe.addEventListener('load',onLoad);
 function dispose(){disposed=true;ready=false;hostWindow.removeEventListener('message',onMessage);iframe.removeEventListener('load',onLoad)}
 return dispose;
}
