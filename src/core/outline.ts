import {copy,type D} from './model.ts';

/** Normalize contour editing across the active 0.3.1 format and the staged 0.4.0 format. */
export function readOutline(style:D|undefined):D{
 const s=style??{};
 if(s.outline)return copy(s.outline);
 return {paint:copy(s.stroke??{}),width:s.strokeWidth??0};
}

/** Preserve other style fields, write *only* the format valid for the requested document version. */
export function patchOutline(style:D|undefined,change:D,version:string):D{
 const next=copy(style??{});
 const merged={...readOutline(next),...copy(change)};
 if(merged.width!==undefined&&(!Number.isFinite(merged.width)||merged.width<0))throw new Error('INVALID_OUTLINE_WIDTH');
 if(version==='0.4.0'){
  next.outline=merged;
  delete next.stroke;delete next.strokeWidth;
 }else if(version==='0.3.1'){
  if(Object.keys(merged).some(k=>!['paint','width'].includes(k)))throw new Error('OUTLINE_040_ONLY');
  next.stroke=merged.paint;
  next.strokeWidth=merged.width;
  delete next.outline;
 }else throw new Error('UNKNOWN_PPD_VERSION');
 return next;
}
