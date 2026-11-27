// Shared, bounded visitor preferences. No executable values or arbitrary actions.
export const DEFAULT_VISITOR_SETTINGS=Object.freeze({fieldOfView:60,pointerLookScale:1,touchLookScale:1,invertY:false,textSize:100,highContrast:false,reducedMotion:false});
export const VISITOR_STORAGE_KEY='aeternum:visitor-settings:v1';
export function normalizeVisitorSettings(value={}){
 const v=value&&typeof value==='object'?value:{};
 const range=(key,min,max)=>typeof v[key]==='number'&&Number.isFinite(v[key])?Math.min(max,Math.max(min,v[key])):DEFAULT_VISITOR_SETTINGS[key];
 return {fieldOfView:Math.round(range('fieldOfView',45,90)),pointerLookScale:Math.round(range('pointerLookScale',.5,2)*100)/100,touchLookScale:Math.round(range('touchLookScale',.5,2)*100)/100,invertY:v.invertY===true,textSize:[100,125,150].includes(v.textSize)?v.textSize:100,highContrast:v.highContrast===true,reducedMotion:v.reducedMotion===true};
}
export function applyVisitorView(player,value){
 if(typeof player?.setViewPreference!=='function')return false;
 const {fieldOfView,pointerLookScale,touchLookScale,invertY}=normalizeVisitorSettings(value);
 player.setViewPreference({fieldOfView,pointerLookScale,touchLookScale,invertY});return true;
}
export function createVisitorSettingsStore(storage){
 let saved=null;try{const raw=storage?.getItem(VISITOR_STORAGE_KEY);if(raw)saved=normalizeVisitorSettings(JSON.parse(raw));}catch{}
 return {get:()=>({...saved??DEFAULT_VISITOR_SETTINGS}),hasSaved:()=>saved!==null,save(value){saved=normalizeVisitorSettings(value);try{storage?.setItem(VISITOR_STORAGE_KEY,JSON.stringify(saved))}catch{}return {...saved}}};
}
