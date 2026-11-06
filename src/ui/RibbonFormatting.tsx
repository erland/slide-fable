import {formatValues,sharedFormat,type SelectionFormatChange,type SelectionFormatKey} from '../core/selectionFormatting';
import type {D} from '../core/model';

type Props={doc:D;slide:D;ids:readonly string[];selectedType:string;disabled:boolean;onFormat:(change:SelectionFormatChange)=>void;onDetails:()=>void;onReplaceImage:()=>void};
const fields:{key:SelectionFormatKey;label:string;kind:'color'|'number'}[]=[
 {key:'fontSize',label:'Textstorlek',kind:'number'},
 {key:'color',label:'Textfärg',kind:'color'},
 {key:'fill',label:'Fyllning',kind:'color'},
 {key:'outlineColor',label:'Ramfärg',kind:'color'},
 {key:'outlineWidth',label:'Ramtjocklek',kind:'number'}
];
export function RibbonFormatting({doc,slide,ids,selectedType,disabled,onFormat,onDetails,onReplaceImage}:Props){
 const visible=selectedType==='image'?[]:fields.filter(field=>{
  if(ids.length>1)return formatValues(doc,slide,ids,field.key).length>0;
  if(['text','shape'].includes(selectedType))return true;
  return ['outlineColor','outlineWidth'].includes(field.key)&&['line','arrow','connector','callout'].includes(selectedType);
 });
 return <div className="ribbon-actions ribbon-formatting" role="group" aria-label="Snabbformatering av markerat objekt">
  {visible.map(field=>{
   const values=formatValues(doc,slide,ids,field.key),value=sharedFormat(values),mixed=values.length>1&&value===undefined;
   const id='ribbon-format-'+field.key;
   return <label key={field.key} htmlFor={id}>{field.label}
    {field.kind==='color'?<input id={id} type="color" aria-label={field.label} disabled={disabled||!values.length} value={typeof value==='string'&&/^#[a-f0-9]{6}$/i.test(value)?value:'#183641'} onChange={event=>onFormat({key:field.key,value:event.target.value})}/>
    :<input id={id} type="number" aria-label={field.label} min={field.key==='fontSize'?1:0} max={field.key==='fontSize'?200:50} disabled={disabled||!values.length} key={`${field.key}:${ids.join(',')}:${String(value)}`} placeholder={mixed?'Blandat':''} defaultValue={typeof value==='number'?value:''} onBlur={event=>{const raw=event.target.value.trim(),n=Number(raw);if(raw&&Number.isFinite(n)&&n>=(field.key==='fontSize'?1:0)&&n<=(field.key==='fontSize'?200:50)&&n!==value)onFormat({key:field.key,value:n});}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/>}
   </label>;
  })}
  {selectedType==='image'&&ids.length===1&&<button type="button" disabled={disabled} onClick={onReplaceImage}>Ersätt bild</button>}
  <button type="button" onClick={onDetails}>{selectedType==='image'?'Beskär och bildinställningar':'Fler formateringsval'}</button>
 </div>;
}
