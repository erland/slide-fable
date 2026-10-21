/** PPD 0.3.1-compatible stroke style: optional named extension on elements. */
export type StrokeStyle='solid'|'dashed'|'dotted'|'dashdot';
export function strokeStyle(element:{style?:{outline?:{dash?:string}};extensions?:{slideFableStrokeStyle?:string}}):StrokeStyle{
 const canonical=element.style?.outline?.dash;
 if(canonical==='dash')return 'dashed';
 if(canonical==='dot')return 'dotted';
 if(canonical==='dash-dot')return 'dashdot';
 if(canonical==='solid')return 'solid';
 const candidate=element.extensions?.slideFableStrokeStyle;
 return candidate==='dashed'||candidate==='dotted'||candidate==='dashdot'?candidate:'solid';
}
export function dashArray(style:StrokeStyle,width:number):number[]{
 const w=Math.max(1,width);
 if(style==='dashed')return [4*w,2*w];
 if(style==='dotted')return [w,2*w];
 if(style==='dashdot')return [4*w,2*w,w,2*w];
 return [];
}
export function cssStrokeStyle(style:StrokeStyle):'solid'|'dashed'|'dotted'{return style==='solid'?'solid':style==='dotted'?'dotted':'dashed';}
