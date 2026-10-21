/** PPD 0.4 staging adapter. The editor still uses PPD 0.3.1.
 * This module is intentionally isolated from active read/write paths. */
import {copy,type D} from './model.ts';

export function toOutline(style:D):D{
 const next=copy(style);
 const hasPaint=Object.hasOwn(next,'stroke'),hasWidth=Object.hasOwn(next,'strokeWidth');
 if((hasPaint||hasWidth)&&Object.hasOwn(next,'outline'))throw new Error('PPD_OUTLINE_CONFLICT');
 if(hasPaint||hasWidth){
  next.outline={paint:next.stroke??{},width:next.strokeWidth??0};
  delete next.stroke;delete next.strokeWidth;
 }
 return next;
}

export function fromOutline(style:D):D{
 const next=copy(style);
 if(!Object.hasOwn(next,'outline'))return next;
 if(Object.hasOwn(next,'stroke')||Object.hasOwn(next,'strokeWidth'))throw new Error('PPD_OUTLINE_CONFLICT');
 const outline=next.outline;
 // The old format cannot express custom dash/caps/markers.
 if(Object.keys(outline).some(k=>!['paint','width'].includes(k)))throw new Error('PPD_OUTLINE_LOSSY');
 next.stroke=copy(outline.paint);next.strokeWidth=outline.width;
 delete next.outline;
 return next;
}

/** Produce an isolated, schema-valid *proposal* document from a 0.3.1 snapshot.
 * Does not mutate or import into the running editor. */
export function stagePpd040(source:D):D{
 if(source.schemaVersion!=='0.3.1')throw new Error('PPD_STAGE_SOURCE_VERSION');
 const doc=copy(source);
 const seen=new WeakSet<object>();
 const visit=(node:unknown)=>{
  if(!node||typeof node!=='object'||seen.has(node))return;
  seen.add(node);
  if(Array.isArray(node)){for(const v of node)visit(v);return;}
  const obj=node as D;
  if(obj.style&&typeof obj.style==='object'&&!Array.isArray(obj.style)){
   obj.style=toOutline(obj.style);
  }
  for(const [k,v] of Object.entries(obj)){
   if(k==='style')continue;
   visit(v);
  }
 };
 visit(doc);
 for(const [key,value] of Object.entries(doc.theme?.styles??{})){
  if(value&&typeof value==='object')doc.theme.styles[key]=toOutline(value as D);
 }
 doc.schemaVersion='0.4.0';
 return doc;
}

/** Normalize legacy style fragments introduced by editor commands into the canonical
 * 0.4 outline representation. Operates on the transaction's private draft only. */
export function normalizePpd040Styles(doc:D):void{
 if(doc.schemaVersion!=='0.4.0')throw new Error('PPD_NORMALIZE_VERSION');
 const seen=new WeakSet<object>();
 const walk=(node:unknown):void=>{
  if(!node||typeof node!=='object'||seen.has(node))return;
  seen.add(node);
  if(Array.isArray(node)){for(const item of node)walk(item);return;}
  const obj=node as D;
  if(obj.style&&typeof obj.style==='object'&&!Array.isArray(obj.style))obj.style=toOutline(obj.style);
  for(const [key,value] of Object.entries(obj))if(key!=='style')walk(value);
 };
 walk(doc);
 for(const [name,style] of Object.entries(doc.theme?.styles??{}))
  if(style&&typeof style==='object')doc.theme.styles[name]=toOutline(style as D);
}
