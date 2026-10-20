/** Optional endpoint markers in PPD extensions, preserving old arrow defaults. */
export const markerKinds=['none','openArrow','filledArrow','circle','diamond','bar'] as const;
export type MarkerKind=typeof markerKinds[number];
export type Point={x:number;y:number};
export function markerKind(value:unknown):MarkerKind{
 return typeof value==='string'&&markerKinds.includes(value as MarkerKind)?value as MarkerKind:'none';
}
export function endMarkers(element:{type:string;extensions?:{slideFableEndMarkers?:{start?:string;end?:string}}}):{start:MarkerKind;end:MarkerKind}{
 const specified=element.extensions?.slideFableEndMarkers;
 return {start:specified?.start===undefined?'none':markerKind(specified.start),end:specified?.end===undefined?(element.type==='arrow'?'filledArrow':'none'):markerKind(specified.end)};
}
/** Return marker geometry in slide-space, with tip at endpoint and normal pointing toward other endpoint. */
export function markerGeometry(kind:MarkerKind,tip:Point,other:Point){
 const distance=Math.hypot(other.x-tip.x,other.y-tip.y)||1;
 const ux=(other.x-tip.x)/distance,uy=(other.y-tip.y)/distance;
 const vx=-uy,vy=ux,length=22,half=12;
 const at=(back:number,side:number)=>({x:tip.x+ux*back+vx*side,y:tip.y+uy*back+vy*side});
 if(kind==='none')return null;
 if(kind==='circle')return {kind,center:at(8,0),radius:8};
 if(kind==='diamond')return {kind,points:[at(0,0),at(10,9),at(20,0),at(10,-9)]};
 if(kind==='bar')return {kind,points:[at(0,12),at(0,-12)]};
 return {kind,points:[at(0,0),at(length,half),at(length,-half)]};
}
export function markerSvgPoints(points:Point[]){return points.map(p=>p.x+','+p.y).join(' ');}
export function pptxMarker(kind:MarkerKind):'none'|'triangle'|'stealth'|'oval'|'diamond'{
 return kind==='filledArrow'?'triangle':kind==='openArrow'?'stealth':kind==='circle'?'oval':kind==='diamond'?'diamond':'none';
}
