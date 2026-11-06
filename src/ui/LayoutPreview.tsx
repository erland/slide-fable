import type {D} from '../core/model';

/** Presentation-relative preview; this never mutates the slide or its layout. */
export function LayoutPreview({doc,layout,surface,ink,accent}:{doc:D;layout:D;surface:string;ink:string;accent:string}){
 const width=doc.document.canvas.width,height=doc.document.canvas.height;
 return <svg className="layout-preview" aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
  <rect x="0" y="0" width={width} height={height} fill={layout.background?.color??surface}/>
  {(layout.placeholders??[]).map((p:D)=>{
   const role=String(p.role??'content').toLowerCase(),g=p.geometry;
   if(!g)return null;
   const isImage=role.includes('image')||role.includes('picture'),isTitle=role.includes('title'),fill=isImage?accent:ink;
   return <g key={p.id}>
    <rect x={g.x} y={g.y} width={g.width} height={g.height} rx={Math.min(g.width,g.height)*0.035} fill={fill} opacity={isTitle?.74:isImage?.22:.12} stroke={fill} strokeWidth={isImage?6:2}/>
    {isImage?<path d={`M ${g.x+g.width*.2} ${g.y+g.height*.74} L ${g.x+g.width*.46} ${g.y+g.height*.38} L ${g.x+g.width*.59} ${g.y+g.height*.57} L ${g.x+g.width*.76} ${g.y+g.height*.28}`} fill="none" stroke={accent} strokeWidth={Math.max(5,width*.007)} strokeLinecap="round" strokeLinejoin="round"/>:!isTitle?<><line x1={g.x+g.width*.09} y1={g.y+g.height*.33} x2={g.x+g.width*.83} y2={g.y+g.height*.33} stroke={ink} strokeWidth={Math.max(3,width*.004)} opacity=".55"/><line x1={g.x+g.width*.09} y1={g.y+g.height*.58} x2={g.x+g.width*.67} y2={g.y+g.height*.58} stroke={ink} strokeWidth={Math.max(3,width*.004)} opacity=".4"/></>:null}
   </g>;
  })}
 </svg>;
}
