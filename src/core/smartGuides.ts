import {resizeRect,type Rect,type ResizeDirection} from './geometry.ts';

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

/** Resize with a fixed opposite edge. Only the dragged edges are snapping targets.
 * Preserve the previous 10-unit delta grid as fallback and honour the 10-unit minimum.
 */
export function snapResize(
 moving:Rect,
 direction:ResizeDirection,
 others:readonly Rect[],
 dx:number,
 dy:number,
 enabled=true,
 bypass=false,
 tolerance=7,
 grid=10
):{rect:Rect;guides:AlignmentGuides}{
 if(![moving.x,moving.y,moving.width,moving.height,dx,dy,tolerance,grid].every(Number.isFinite)||
    moving.width<=0||moving.height<=0||tolerance<0||grid<=0)throw Error('INVALID_ALIGNMENT_GEOMETRY');
 const activeX=direction.includes('w')?'w':direction.includes('e')?'e':null;
 const activeY=direction.includes('n')?'n':direction.includes('s')?'s':null;
 if(!activeX&&!activeY)throw Error('INVALID_RESIZE_DIRECTION');
 const axis=(edge:'w'|'e'|'n'|'s'|null,delta:number,targets:number[],current:number)=>{
  if(!edge)return {delta,guide:undefined as number|undefined};
  if(!enabled||bypass)return {delta,guide:undefined as number|undefined};
  let guide:number|undefined,offset=0,shortest=Infinity;
  for(const candidate of targets){
   const difference=candidate-(current+delta);
   if(Math.abs(difference)<=tolerance&&Math.abs(difference)<shortest){
    shortest=Math.abs(difference);offset=difference;guide=candidate;
   }
  }
  if(guide!==undefined)return {delta:delta+offset,guide};
  return {delta:Math.round(delta/grid)*grid,guide:undefined as number|undefined};
 };
 const horizontal=axis(activeX,dx,others.flatMap(r=>[r.x,r.x+r.width/2,r.x+r.width]),activeX==='w'?moving.x:moving.x+moving.width);
 const vertical=axis(activeY,dy,others.flatMap(r=>[r.y,r.y+r.height/2,r.y+r.height]),activeY==='n'?moving.y:moving.y+moving.height);
 const rect=resizeRect(moving,direction,horizontal.delta,vertical.delta);
 // A minimum-size clamp prevents reaching the candidate; do not show a false guide.
 const edgeX=activeX==='w'?rect.x:rect.x+rect.width;
 const edgeY=activeY==='n'?rect.y:rect.y+rect.height;
 const x=horizontal.guide!==undefined&&Math.abs(horizontal.guide-edgeX)<.001?horizontal.guide:undefined;
 const y=vertical.guide!==undefined&&Math.abs(vertical.guide-edgeY)<.001?vertical.guide:undefined;
 return {rect,guides:{...(x!==undefined?{x}:{}),...(y!==undefined?{y}:{})}};
}
