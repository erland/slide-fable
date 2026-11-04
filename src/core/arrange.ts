import type {Rect} from './geometry.ts';

export type ArrangeMode='left'|'center'|'right'|'top'|'middle'|'bottom'|'distribute-x'|'distribute-y';
export type ArrangeItem={id:string;geometry:Rect};

/** Arrange movable objects within the bounds of their own selection.
 * The outer objects remain fixed during distribution.
 */
export function arrangeSelection(items:readonly ArrangeItem[],mode:ArrangeMode):ArrangeItem[]{
 const result=items.map(item=>({id:item.id,geometry:{...item.geometry}}));
 if(result.length<2)return result;
 for(const item of result){
  const b=item.geometry;
  if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('INVALID_ARRANGEMENT_GEOMETRY');
 }
 const horizontal=mode==='left'||mode==='center'||mode==='right'||mode==='distribute-x';
 if(mode==='distribute-x'||mode==='distribute-y'){
  if(result.length<3)return result;
  const axis=horizontal?'x':'y',dimension=horizontal?'width':'height';
  const sorted=[...result].sort((a,b)=>a.geometry[axis]-b.geometry[axis]||a.id.localeCompare(b.id));
  const first=sorted[0].geometry,last=sorted[sorted.length-1].geometry;
  const extent=last[axis]+last[dimension]-first[axis];
  const occupied=sorted.reduce((sum,item)=>sum+item.geometry[dimension],0);
  const gap=(extent-occupied)/(sorted.length-1);
  let cursor=first[axis]+first[dimension]+gap;
  for(let i=1;i<sorted.length-1;i++){
   sorted[i].geometry[axis]=cursor;
   cursor+=sorted[i].geometry[dimension]+gap;
  }
  return result;
 }
 const key=horizontal?'x':'y',size=horizontal?'width':'height';
 const begin=Math.min(...result.map(item=>item.geometry[key]));
 const end=Math.max(...result.map(item=>item.geometry[key]+item.geometry[size]));
 for(const item of result){
  const b=item.geometry;
  b[key]=mode==='left'||mode==='top'?begin:mode==='right'||mode==='bottom'?end-b[size]:(begin+end-b[size])/2;
 }
 return result;
}

/** Match dimensions to the primary selected editable object.
 * The objects retain their own positions and the unrequested dimension.
 */
export type MatchSizeMode='width'|'height'|'both';
export function matchSelectionSize(items:readonly ArrangeItem[],referenceId:string,mode:MatchSizeMode):ArrangeItem[]{
 const result=items.map(item=>({id:item.id,geometry:{...item.geometry}}));
 if(!['width','height','both'].includes(mode))throw Error('INVALID_SIZE_MODE');
 if(result.length<2)return result;
 for(const item of result){
  const b=item.geometry;
  if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('INVALID_ARRANGEMENT_GEOMETRY');
 }
 const reference=result.find(item=>item.id===referenceId);
 if(!reference)throw Error('INVALID_SIZE_REFERENCE');
 const {width,height}=reference.geometry;
 for(const item of result){
  if(item.id===referenceId)continue;
  if(mode!=='height')item.geometry.width=width;
  if(mode!=='width')item.geometry.height=height;
 }
 return result;
}

/** Uniformly scales the selection as a whole around its bounding-box center.
 * Relative positions, each object's aspect ratio and rotations remain unchanged.
 */
export function scaleSelection(items:readonly ArrangeItem[],factor:number):ArrangeItem[]{
 if(!Number.isFinite(factor)||factor<0.25||factor>2)throw Error('INVALID_SCALE_FACTOR');
 const result=items.map(item=>({id:item.id,geometry:{...item.geometry}}));
 if(result.length<2)return result;
 for(const {geometry:b} of result){
  if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('INVALID_ARRANGEMENT_GEOMETRY');
 }
 const left=Math.min(...result.map(item=>item.geometry.x));
 const right=Math.max(...result.map(item=>item.geometry.x+item.geometry.width));
 const top=Math.min(...result.map(item=>item.geometry.y));
 const bottom=Math.max(...result.map(item=>item.geometry.y+item.geometry.height));
 const cx=(left+right)/2,cy=(top+bottom)/2;
 for(const item of result){
  const b=item.geometry;
  b.x=cx+(b.x-cx)*factor;
  b.y=cy+(b.y-cy)*factor;
  b.width*=factor;
  b.height*=factor;
 }
 return result;
}

export type ScaleCorner='nw'|'ne'|'sw'|'se';
export function selectionBounds(items:readonly ArrangeItem[]):Rect{
 if(!items.length)throw Error('EMPTY_SCALE_SELECTION');
 for(const {geometry:b} of items)if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('INVALID_ARRANGEMENT_GEOMETRY');
 const left=Math.min(...items.map(i=>i.geometry.x)),top=Math.min(...items.map(i=>i.geometry.y));
 const right=Math.max(...items.map(i=>i.geometry.x+i.geometry.width)),bottom=Math.max(...items.map(i=>i.geometry.y+i.geometry.height));
 return {x:left,y:top,width:right-left,height:bottom-top};
}
/** Resize the full multi-object bounding box from a corner, anchoring the opposite corner.
 * The dominant normalized pointer movement controls uniform scaling in both dimensions.
 * Preserve each object's aspect ratio, and clamp scale before any object gets under 10 units.
 */
export function scaleSelectionFromCorner(items:readonly ArrangeItem[],corner:ScaleCorner,dx:number,dy:number):{items:ArrangeItem[];bounds:Rect;factor:number}{
 if(!['nw','ne','sw','se'].includes(corner)||![dx,dy].every(Number.isFinite))throw Error('INVALID_SCALE_DRAG');
 const bounds=selectionBounds(items);
 if(items.length<2)return {items:items.map(i=>({id:i.id,geometry:{...i.geometry}})),bounds,factor:1};
 const signX=corner.includes('w')?-1:1,signY=corner.includes('n')?-1:1;
 const deltaX=signX*dx/bounds.width,deltaY=signY*dy/bounds.height;
 const delta=Math.abs(deltaX)>=Math.abs(deltaY)?deltaX:deltaY;
 const minFactor=Math.max(.25,...items.map(i=>Math.max(10/i.geometry.width,10/i.geometry.height)));
 const factor=Math.max(minFactor,Math.min(2,1+delta));
 const anchorX=corner.includes('w')?bounds.x+bounds.width:bounds.x;
 const anchorY=corner.includes('n')?bounds.y+bounds.height:bounds.y;
 const scaled=items.map(({id,geometry:b})=>({id,geometry:{
  ...b,x:anchorX+(b.x-anchorX)*factor,y:anchorY+(b.y-anchorY)*factor,
  width:b.width*factor,height:b.height*factor
 }}));
 return {items:scaled,bounds:selectionBounds(scaled),factor};
}
