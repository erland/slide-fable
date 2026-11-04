/** Standard editor selection semantics shared by pointer and layer-list interactions. */
export function resolveSelection(selected:readonly string[],id:string,shift=false):{ids:string[];beginDrag:boolean}{
 if(!id)throw Error('INVALID_SELECTION_ID');
 if(shift){
  const ids=selected.includes(id)?selected.filter(item=>item!==id):[...selected,id];
  return {ids,beginDrag:false};
 }
 return {ids:selected.includes(id)?[...selected]:[id],beginDrag:true};
}

/** Selected locked objects remain selected for inspection but never join a drag. */
export function movableSelection(ids:readonly string[],elements:readonly {id:string;locked?:boolean}[]):string[]{
 const byId=new Map(elements.map(e=>[e.id,e]));
 return ids.filter(id=>{const e=byId.get(id);return Boolean(e&&!e.locked);});
}

export type SelectionRect={x:number;y:number;width:number;height:number};
export type SelectionPoint={x:number;y:number};

/** A rectangle in slide-local coordinates, independent of drag direction. */
export function marqueeBounds(start:SelectionPoint,end:SelectionPoint):SelectionRect{
 if(![start.x,start.y,end.x,end.y].every(Number.isFinite))throw Error('INVALID_MARQUEE_COORDINATES');
 return {x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};
}

/** Select only visible elements fully enclosed in the marquee, including locked objects.
 * Shift extends the original selection without duplicates.
 */
export function marqueeSelection(
 original:readonly string[],elements:readonly {id:string;geometry:SelectionRect;visible?:boolean}[],
 rectangle:SelectionRect,extend=false
):string[]{
 if(![rectangle.x,rectangle.y,rectangle.width,rectangle.height].every(Number.isFinite)||rectangle.width<0||rectangle.height<0)throw Error('INVALID_MARQUEE_RECT');
 const ids=extend?[...original]:[];
 const right=rectangle.x+rectangle.width,bottom=rectangle.y+rectangle.height;
 for(const element of elements){
  if(element.visible===false)continue;
  const b=element.geometry;
  if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<0||b.height<0)continue;
  if(b.x>=rectangle.x&&b.y>=rectangle.y&&b.x+b.width<=right&&b.y+b.height<=bottom&&!ids.includes(element.id))ids.push(element.id);
 }
 return ids;
}
