import {copy,type D} from './model.ts';
import {patchOutline} from './outline.ts';
import {strokeStyle,type StrokeStyle} from './stroke.ts';
import {endMarkers,type MarkerKind} from './endMarkers.ts';

const dashToCanonical:Record<StrokeStyle,string>={solid:'solid',dashed:'dash',dotted:'dot',dashdot:'dash-dot'};
const markerToCanonical:Record<MarkerKind,string>={none:'none',openArrow:'open-arrow',filledArrow:'triangle',circle:'oval',diamond:'diamond',bar:'bar'};

/** Canonical contour controls; legacy extensions are read-only compatibility data on 0.4 documents. */
export function editStrokeStyle(element:D,style:StrokeStyle,version:string):D{
 if(!Object.hasOwn(dashToCanonical,style))throw Error('INVALID_STROKE_STYLE');
 if(version==='0.4.0'){
  const extensions=copy(element.extensions??{});
  delete extensions.slideFableStrokeStyle;
  const outline=patchOutline(element.style,{dash:dashToCanonical[style]},version);
  return {style:outline,extensions};
 }
 if(version==='0.3.1')return {extensions:{...element.extensions,slideFableStrokeStyle:style}};
 throw Error('UNKNOWN_PPD_VERSION');
}
export function editEndMarker(element:D,which:'start'|'end',kind:MarkerKind,version:string):D{
 if(!Object.hasOwn(markerToCanonical,kind))throw Error('INVALID_END_MARKER');
 if(version==='0.4.0'){
  const markers=endMarkers(element);
  const extensions=copy(element.extensions??{});
  delete extensions.slideFableEndMarkers;
  const start=which==='start'?kind:markers.start;
  const end=which==='end'?kind:markers.end;
  return {style:patchOutline(element.style,{startMarker:markerToCanonical[start],endMarker:markerToCanonical[end]},version),extensions};
 }
 if(version==='0.3.1')return {extensions:{...element.extensions,slideFableEndMarkers:{...element.extensions?.slideFableEndMarkers,[which]:kind}}};
 throw Error('UNKNOWN_PPD_VERSION');
}
export const currentStrokeStyle=(element:D):StrokeStyle=>strokeStyle(element);
export const currentEndMarkers=(element:D)=>endMarkers(element);
