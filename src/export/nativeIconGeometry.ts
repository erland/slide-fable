import {SVGPathData} from 'svg-pathdata';
import {iconCatalog} from '../core/iconCatalog';
import type {D} from '../core/model';

/** Converts only first-party catalog icons to native PowerPoint custom geometry.
 * Unsupported user supplied SVG paths continue through the existing raster fallback.
 */
export type FreeformPoint=
 | {x:number;y:number;moveTo?:boolean}
 | {x:number;y:number;curve:{type:'cubic';x1:number;y1:number;x2:number;y2:number}}
 | {close:true};

export function nativeIconPoints(element:D, widthInches:number,heightInches:number):FreeformPoint[]|null{
 const vector=element.vectorPath;
 if(element.type!=='vectorPath'||vector?.format!=='svg-path'||vector?.closed!==false||vector?.viewBox!=='0 0 100 100')return null;
 if(!iconCatalog.some(icon=>icon.path===vector.pathData))return null;
 if(!Number.isFinite(widthInches)||!Number.isFinite(heightInches)||widthInches<=0||heightInches<=0)return null;
 const sx=widthInches/100,sy=heightInches/100;
 const pt=(x:number,y:number)=>({x:x*sx,y:y*sy});
 const points:FreeformPoint[]=[];
 let x=0,y=0,startX=0,startY=0;
 const commands=new SVGPathData(vector.pathData).toAbs().commands as D[];
 for(const cmd of commands){
  switch(cmd.type){
   case SVGPathData.MOVE_TO:{
    x=cmd.x;y=cmd.y;startX=x;startY=y;points.push({...pt(x,y),moveTo:true});break;
   }
   case SVGPathData.LINE_TO:{x=cmd.x;y=cmd.y;points.push(pt(x,y));break;}
   case SVGPathData.HORIZ_LINE_TO:{x=cmd.x;points.push(pt(x,y));break;}
   case SVGPathData.VERT_LINE_TO:{y=cmd.y;points.push(pt(x,y));break;}
   case SVGPathData.CURVE_TO:{
    points.push({...pt(cmd.x,y=cmd.y),curve:{type:'cubic',...Object.fromEntries([])}} as FreeformPoint);
    const last=points[points.length-1] as {curve:{type:'cubic';x1:number;y1:number;x2:number;y2:number}};
    last.curve={type:'cubic',x1:cmd.x1*sx,y1:cmd.y1*sy,x2:cmd.x2*sx,y2:cmd.y2*sy};
    x=cmd.x;break;
   }
   case SVGPathData.ARC:{
    // Sample only the catalog's elliptic arcs; native editable freeform paths
    // preserve all separate SVG subpaths, without connecting unrelated contours.
    const svg=document.createElementNS('http://www.w3.org/2000/svg','path');
    const arc=`M ${x} ${y} A ${cmd.rX} ${cmd.rY} ${cmd.xRot} ${cmd.lArcFlag?1:0} ${cmd.sweepFlag?1:0} ${cmd.x} ${cmd.y}`;
    svg.setAttribute('d',arc);
    const length=svg.getTotalLength();
    if(!Number.isFinite(length)||length<=0) return null;
    const segments=Math.min(48,Math.max(12,Math.ceil(length/4)));
    for(let i=1;i<=segments;i++){const p=svg.getPointAtLength(length*i/segments);points.push(pt(p.x,p.y));}
    x=cmd.x;y=cmd.y;break;
   }
   case SVGPathData.CLOSE_PATH:{points.push({close:true});x=startX;y=startY;break;}
   default:return null;
  }
  if(points.length>1200)return null;
 }
 return points.length>1?points:null;
}
