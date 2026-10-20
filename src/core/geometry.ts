/** Geometry helpers for future resize handles. All values are slide logical units. */
export type ResizeDirection='n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'nw';
export type Rect={x:number;y:number;width:number;height:number};
export const resizeDirections:readonly ResizeDirection[]=['nw','n','ne','e','se','s','sw','w'];
export function resizeRect(rect:Rect,direction:ResizeDirection,dx:number,dy:number,minSize=10):Rect{
 if(![rect.x,rect.y,rect.width,rect.height,dx,dy,minSize].every(Number.isFinite)||rect.width<=0||rect.height<=0||minSize<=0)throw Error('Invalid resize geometry');
 let left=rect.x,right=rect.x+rect.width,top=rect.y,bottom=rect.y+rect.height;
 if(direction.includes('w'))left=Math.min(right-minSize,left+dx);
 if(direction.includes('e'))right=Math.max(left+minSize,right+dx);
 if(direction.includes('n'))top=Math.min(bottom-minSize,top+dy);
 if(direction.includes('s'))bottom=Math.max(top+minSize,bottom+dy);
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export type Point={x:number;y:number};
export function lineBounds(start:Point,end:Point,minSize=1):Rect{
 if(![start.x,start.y,end.x,end.y,minSize].every(Number.isFinite)||minSize<=0)throw Error('Invalid line endpoints');
 return {x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.max(minSize,Math.abs(end.x-start.x)),height:Math.max(minSize,Math.abs(end.y-start.y))};
}
export function moveEndpoint(start:Point,end:Point,which:'start'|'end',dx:number,dy:number):{start:Point;end:Point}{
 if(![dx,dy].every(Number.isFinite))throw Error('Invalid endpoint movement');
 return which==='start'?{start:{x:start.x+dx,y:start.y+dy},end:{...end}}:{start:{...start},end:{x:end.x+dx,y:end.y+dy}};
}
