// Trusted Loader reference adapter. Never dynamically import this from a world URL.
export function resolveArtworkViewerUrl(entryUrl, exhibitId, catalog) {
  if(catalog?.schema!=='aeternum-artwork-viewer@1'||!catalog.exhibits?.some(e=>e.entityId===exhibitId))throw new Error('Unknown artwork exhibit')
  const url=new URL(entryUrl)
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||!url.pathname.endsWith('/web-surface/artwork-viewer/index.html'))throw new Error('Invalid trusted viewer entry')
  url.search='';url.hash='';url.searchParams.set('exhibit',exhibitId);return url.href
}
export function createArtworkViewer({entryUrl,catalog,isActiveWorld,document=globalThis.document,onOpen=()=>{},onClose=()=>{}}){
  if(typeof isActiveWorld!=='function'||!document?.body)throw new TypeError('Trusted world guard and document required')
  let dialog=null,previousFocus=null
  function close(){if(!dialog)return;const old=dialog;dialog=null;old.remove();try{previousFocus?.focus()}catch{}previousFocus=null;onClose()}
  function open(exhibitId){if(!isActiveWorld())return false;let url;try{url=resolveArtworkViewerUrl(entryUrl,exhibitId,catalog)}catch{return false}close();previousFocus=document.activeElement;
    const d=document.createElement('dialog');d.setAttribute('aria-label','AETERNUM artwork viewer');Object.assign(d.style,{width:'min(96vw, 1500px)',height:'92dvh',maxWidth:'none',maxHeight:'none',padding:'0',border:'1px solid #6e6049',background:'#171916',color:'#eee8d9',overflow:'hidden'});
    const bar=document.createElement('div');Object.assign(bar.style,{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',height:'48px',boxSizing:'border-box'});const label=document.createElement('span');label.textContent='AETERNUM / Artwork inspection';const button=document.createElement('button');button.type='button';button.textContent='Close viewer';button.onclick=close;bar.append(label,button);
    const frame=document.createElement('iframe');frame.title='HD artwork viewer';frame.setAttribute('sandbox','allow-scripts allow-popups');frame.referrerPolicy='no-referrer';Object.assign(frame.style,{display:'block',width:'100%',height:'calc(100% - 48px)',border:'0'});frame.src=url;d.append(bar,frame);d.addEventListener('cancel',e=>{e.preventDefault();close()});document.body.append(d);dialog=d;try{onOpen();d.showModal();button.focus()}catch(error){close();throw error}return true
  }
  return {open,close,dispose:close}
}
