// Tour progress is session-local and advances only on confirmed arrival.
export function createTourStore(catalog, navigation) {
  const rooms = new Set(navigation.destinations.map(d=>d.id));
  const tours = new Map();
  if(catalog?.schema !== 'aeternum-tours@1' || !Array.isArray(catalog.tours)) throw Error('Invalid tour catalog');
  for(const t of catalog.tours) {
    if(typeof t.id !== 'string' || tours.has(t.id) || !Array.isArray(t.stops) || !t.stops.length || t.stops.some(s=>!rooms.has(s.roomId)) || new Set(t.stops.map(s=>s.roomId)).size!==t.stops.length) throw Error('Invalid tour: '+t.id);
    tours.set(t.id,t);
  }
  let state=null;
  const snapshot=()=>state?{...state}:null;
  return {snapshot,
    start(id){if(!tours.has(id))return false;if(state?.tourId!==id)state={tourId:id,next:0};return true},
    end(){state=null},
    accepts(id,step,room){return Boolean(state&&state.tourId===id&&Number.isInteger(step)&&state.next===step&&tours.get(id)?.stops[step]?.roomId===room)},
    arrive(id,step,room){if(!this.accepts(id,step,room))return false;state={tourId:id,next:step+1};return true}
  };
}
