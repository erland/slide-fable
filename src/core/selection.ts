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
