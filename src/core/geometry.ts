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
/** Resize while preserving the original aspect ratio. Corners anchor the
 * opposite corner; side handles anchor the opposite edge's centre.
 * The stronger relative pointer movement controls corner scaling.
 * Coordinates remain in slide units and both dimensions respect minSize. */
export function resizeRectKeepAspect(rect:Rect,direction:ResizeDirection,dx:number,dy:number,minSize=10):Rect{
 if(![rect.x,rect.y,rect.width,rect.height,dx,dy,minSize].every(Number.isFinite)||
    rect.width<=0||rect.height<=0||minSize<=0)throw Error('Invalid resize geometry');
 const sx=direction.includes('w')?-1:direction.includes('e')?1:0;
 const sy=direction.includes('n')?-1:direction.includes('s')?1:0;
 if(!sx&&!sy)throw Error('Invalid resize direction');
 const scaleX=sx?1+sx*dx/rect.width:1;
 const scaleY=sy?1+sy*dy/rect.height:1;
 const factor=sx&&sy?(Math.abs(scaleX-1)>=Math.abs(scaleY-1)?scaleX:scaleY):sx?scaleX:scaleY;
 const scale=Math.max(factor,minSize/rect.width,minSize/rect.height);
 const width=rect.width*scale,height=rect.height*scale;
 return {
  x:sx<0?rect.x+rect.width-width:sx>0?rect.x:rect.x+(rect.width-width)/2,
  y:sy<0?rect.y+rect.height-height:sy>0?rect.y:rect.y+(rect.height-height)/2,
  width,height
 };
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
