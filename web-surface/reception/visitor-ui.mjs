import {normalizeVisitorSettings,DEFAULT_VISITOR_SETTINGS} from './visitor-settings.mjs';
export function mountVisitorSettings({tell}){
 const panel=document.querySelector('#visitor-settings'),tab=document.querySelector('#settings-tab'),form=document.querySelector('#visitor-form'),feedback=document.querySelector('#visitor-feedback'),cameraStatus=document.querySelector('#camera-status');
 const cameraKeys=['fieldOfView','pointerLookScale','touchLookScale','invertY'];
 let connected=false,cameraAvailable=false,current={...DEFAULT_VISITOR_SETTINGS};
 function render(value){current=normalizeVisitorSettings(value);for(const [k,v] of Object.entries(current)){const field=form.elements.namedItem(k);if(field.type==='checkbox')field.checked=v;else field.value=String(v)}outputs();appearance(current)}
 function outputs(){document.querySelector('#fov-value').textContent=form.elements.fieldOfView.value+'°';document.querySelector('#pointer-value').textContent=Number(form.elements.pointerLookScale.value).toFixed(2)+'×';document.querySelector('#touch-value').textContent=Number(form.elements.touchLookScale.value).toFixed(2)+'×'}
 function appearance(v){const root=document.documentElement;root.dataset.textSize=String(v.textSize);root.dataset.highContrast=String(v.highContrast);root.dataset.reducedMotion=String(v.reducedMotion)}
 function cameraState(){for(const k of cameraKeys)form.elements.namedItem(k).disabled=!cameraAvailable;cameraStatus.textContent=cameraAvailable?'Uses Player view preferences. Avatar orbit controls may retain their own settings.':'Camera settings require a compatible, approved Loader connection.'}
 function close(){panel.hidden=true;tab.setAttribute('aria-expanded','false')}
 tab.addEventListener('click',()=>{panel.hidden=!panel.hidden;tab.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)panel.scrollIntoView({block:'nearest',behavior:'instant'})});
 form.addEventListener('input',outputs);
 function submit(value){render(value);if(connected){feedback.textContent='Applying preferences…';tell('visitor-settings',{settings:current})}else feedback.textContent='Reading preferences applied for this page. Camera settings are unavailable.'}
 form.addEventListener('submit',event=>{event.preventDefault();const v={...current};for(const k of Object.keys(v)){const f=form.elements.namedItem(k);if(!f.disabled)v[k]=f.type==='checkbox'?f.checked:Number(f.value)}submit(v)});
 document.querySelector('#visitor-reset').addEventListener('click',()=>submit(DEFAULT_VISITOR_SETTINGS));
 render(current);cameraState();
 return {close,connect(value,available){connected=Boolean(value);cameraAvailable=connected&&available===true;if(value)render(value);cameraState()},disconnect(){connected=false;cameraAvailable=false;cameraState()},receive(m){if(m.type!=='visitor-settings-result')return false;if(m.visitorSettings)render(m.visitorSettings);feedback.textContent=m.ok?(m.cameraApplied?'Preferences applied.':'Reading preferences saved; camera control unavailable.'):(m.reason||'Preferences could not be applied.');return true}};
}
