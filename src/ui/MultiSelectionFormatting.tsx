import {formatValues,sharedFormat,type SelectionFormatKey,type SelectionFormatChange} from '../core/selectionFormatting';
import type {D} from '../core/model';

const controls:{key:SelectionFormatKey;label:string;kind:'color'|'number';min?:number;max?:number}[]=[
 {key:'fill',label:'Gemensam fyllning',kind:'color'},
 {key:'outlineColor',label:'Gemensam ramfärg',kind:'color'},
 {key:'outlineWidth',label:'Gemensam ramtjocklek',kind:'number',min:0,max:50},
 {key:'color',label:'Gemensam textfärg',kind:'color'},
 {key:'fontSize',label:'Gemensam textstorlek',kind:'number',min:1,max:200}
];
export function MultiSelectionFormatting({doc,slide,ids,onChange}:{doc:D;slide:D;ids:readonly string[];onChange:(change:SelectionFormatChange)=>void}){
 return <fieldset className="multi-selection-formatting"><legend>Gemensam formatering</legend><p>Ändrar olåsta objekt som stöder egenskapen. Textformat gäller hela objektets text.</p>{controls.map(control=>{
  const values=formatValues(doc,slide,ids,control.key),value=sharedFormat(values);
  const mixed=values.length>0&&!values.every(item=>item===values[0]);
  const status=values.length===0?'Inga ändringsbara objekt':mixed?'Blandade värden':value===undefined?'Inte angivet':'';
  const id='multi-format-'+control.key;
  return <label key={control.key}>{control.label}{control.kind==='color'?<input type="color" aria-label={control.label} aria-describedby={id} disabled={!values.length} value={typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:'#000000'} onChange={e=>onChange({key:control.key,value:e.target.value})}/>:<input key={JSON.stringify([ids,values])} type="number" aria-label={control.label} aria-describedby={id} disabled={!values.length} min={control.min} max={control.max} placeholder={mixed?'Blandade värden':''} defaultValue={typeof value==='number'?value:''} onBlur={e=>{
   const raw=e.target.value,n=Number(raw);
   if(raw.trim()&&Number.isFinite(n)&&n>=control.min!&&n<=control.max!&&n!==value)onChange({key:control.key,value:n});
  }} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>}<span id={id}>{status}</span></label>;
 })}</fieldset>;
}
