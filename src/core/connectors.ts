/** Connection points and resolved absolute endpoints for shape-bound lines. */
export type Point={x:number;y:number};
export type Port='top'|'right'|'bottom'|'left';
export const ports:Port[]=['top','right','bottom','left'];
export type Rect={x:number;y:number;width:number;height:number};
export type Anchor={elementId:string;port?:string};
export function portPoint(rect:Rect,port:string='right'):Point{
 const x=rect.x,y=rect.y,w=rect.width,h=rect.height;
 if(port==='top')return {x:x+w/2,y};
 if(port==='bottom')return {x:x+w/2,y:y+h};
 if(port==='left')return {x,y:y+h/2};
 return {x:x+w,y:y+h/2};
}
export function nearestPort(point:Point,items:Array<{id:string;geometry:Rect}>,limit=34):{elementId:string;port:Port}|undefined{
 let best:{elementId:string;port:Port}|undefined,dist=limit;
 for(const item of items)for(const port of ports){const p=portPoint(item.geometry,port),d=Math.hypot(point.x-p.x,point.y-p.y);if(d<=dist){dist=d;best={elementId:item.id,port};}}
 return best;
}
export function resolveLinePoints(line:{geometry:Rect;extensions?:{slideFableLinePoints?:{start?:Point;end?:Point}};startAnchor?:Anchor;endAnchor?:Anchor},elements:Array<{id:string;geometry:Rect}>):{start:Point;end:Point}{
 const b=line.geometry,stored=line.extensions?.slideFableLinePoints;
 const anchor=(a:Anchor|undefined)=>{const e=elements.find(e=>e.id===a?.elementId);return e?portPoint(e.geometry,a?.port):undefined;};
 return {start:anchor(line.startAnchor)??{x:b.x+(stored?.start?.x??0),y:b.y+(stored?.start?.y??b.height/2)},end:anchor(line.endAnchor)??{x:b.x+(stored?.end?.x??b.width),y:b.y+(stored?.end?.y??b.height/2)}};
}
