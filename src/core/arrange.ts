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
