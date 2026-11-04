import type {Rect} from './geometry';

/** Snap a dragged object's left/centre/right and top/middle/bottom to other objects.
 * The first dragged element is the reference, so grouped movement remains rigid.
 */
export type AlignmentGuides={x?:number;y?:number};
export function snapTranslation(
 moving:Rect,
 others:readonly Rect[],
 dx:number,
 dy:number,
 enabled=true,
 bypass=false,
 tolerance=7,
 grid=10
):{dx:number;dy:number;guides:AlignmentGuides}{
 if(![moving.x,moving.y,moving.width,moving.height,dx,dy,tolerance,grid].every(Number.isFinite)||moving.width<=0||moving.height<=0||tolerance<0||grid<=0)throw Error('INVALID_ALIGNMENT_GEOMETRY');
 if(!enabled||bypass)return {dx,dy,guides:{}};
 const axis=(from:number,size:number,delta:number,candidates:number[])=>{
  const anchors=[from+delta,from+delta+size/2,from+delta+size];
  let distance=Infinity,offset=0,guide: number|undefined;
  for(const anchor of anchors)for(const candidate of candidates){
   const diff=candidate-anchor;
   if(Math.abs(diff)<=tolerance&&Math.abs(diff)<distance){
    distance=Math.abs(diff);offset=diff;guide=candidate;
   }
  }
  if(guide!==undefined)return {delta:delta+offset,guide};
  const snapped=Math.round((from+delta)/grid)*grid-from;
  return {delta:snapped,guide:undefined};
 };
 const xTargets=others.flatMap(r=>[r.x,r.x+r.width/2,r.x+r.width]);
 const yTargets=others.flatMap(r=>[r.y,r.y+r.height/2,r.y+r.height]);
 const x=axis(moving.x,moving.width,dx,xTargets);
 const y=axis(moving.y,moving.height,dy,yTargets);
 return {dx:x.delta,dy:y.delta,guides:{...(x.guide!==undefined?{x:x.guide}:{}),...(y.guide!==undefined?{y:y.guide}:{})}};
}
