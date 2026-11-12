import {copy,effective,textOf,type D} from './model.ts';
import {patchOutline,readOutline} from './outline.ts';

export type SelectionFormatKey='fill'|'outlineColor'|'outlineWidth'|'color'|'fontSize';
export type SelectionFormatChange={key:SelectionFormatKey;value:string|number};
export function supportsFormat(element:D,key:SelectionFormatKey):boolean{
 if(element.locked)return false;
 if(key==='fill')return ['text','shape','callout'].includes(element.type);
 if(key==='color'||key==='fontSize')return ['text','shape'].includes(element.type);
 return ['text','shape','callout','line','arrow','connector'].includes(element.type);
}
export function formatValues(doc:D,slide:D,ids:readonly string[],key:SelectionFormatKey):(string|number|undefined)[]{
 return slide.view.elements.filter((e:D)=>ids.includes(e.id)&&supportsFormat(e,key)).flatMap((e:D)=>{
  const style=effective(doc,slide,e).style??{};
  if(key==='fill')return [style.fill?.color];
  if(key==='outlineColor')return [readOutline(style).paint?.color];
  if(key==='outlineWidth')return [readOutline(style).width??0];
  const fallback=key==='fontSize'?(style.fontSize??36):(style.color??doc.theme.colors?.[style.colorToken]??'#183641');
  const text=textOf(slide,e),runs=typeof text==='string'?[]:(text.paragraphs??[]).flatMap((p:D)=>p.runs??[]);
  return runs.length?runs.map((r:D)=>key==='fontSize'?(r.size??fallback):(r.color??fallback)):[fallback];
 });
}
export function formatValueStatus(values:readonly (string|number|undefined)[]):'unavailable'|'mixed'|'unset'|'shared'{
 if(!values.length)return 'unavailable';
 if(!values.every(value=>value===values[0]))return 'mixed';
 return values[0]===undefined?'unset':'shared';
}
export function sharedFormat(values:readonly (string|number|undefined)[]){
 return values.length&&values.every(value=>value===values[0])?values[0]:undefined;
}
export function validateFormatChange(change:SelectionFormatChange){
 if(['fill','outlineColor','color'].includes(change.key)){
  if(typeof change.value!=='string'||!/^#[0-9a-f]{6}$/i.test(change.value))throw Error('INVALID_FORMAT_COLOR');
 }else if(!['outlineWidth','fontSize'].includes(change.key)||typeof change.value!=='number'||!Number.isFinite(change.value)||change.value<(change.key==='fontSize'?1:0)||change.value>(change.key==='fontSize'?200:50))throw Error('INVALID_FORMAT_NUMBER');
}
export function selectionFormatPatch(doc:D,slide:D,element:D,change:SelectionFormatChange):D{
 const style=copy(effective(doc,slide,element).style??{});
 if(change.key==='fill')return {style:{...style,fill:{color:change.value}}};
 if(change.key==='outlineColor')return {style:patchOutline(style,{paint:{color:change.value},width:readOutline(style).width||1},doc.schemaVersion)};
 if(change.key==='outlineWidth')return {style:patchOutline(style,{width:change.value,paint:{...readOutline(style).paint,color:readOutline(style).paint?.color??'#183641'}},doc.schemaVersion)};
 return {style:{...style,[change.key]:change.value}};
}
