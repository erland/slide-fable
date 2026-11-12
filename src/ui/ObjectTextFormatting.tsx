import {formatValueStatus,formatValues,sharedFormat,type SelectionFormatChange} from '../core/selectionFormatting';
import type {D} from '../core/model';

type Props={
 doc:D;slide:D;id:string;disabled:boolean;
 onChange:(change:SelectionFormatChange)=>void;
};

/** Object-level typography. Unlike the inline editor these controls intentionally
 * apply to every rich-text run, matching the Start ribbon's behavior. */
export function ObjectTextFormatting({doc,slide,id,disabled,onChange}:Props){
 const sizes=formatValues(doc,slide,[id],'fontSize');
 const colors=formatValues(doc,slide,[id],'color');
 const size=sharedFormat(sizes),color=sharedFormat(colors);
 const sizeStatus=formatValueStatus(sizes),colorStatus=formatValueStatus(colors);
 return <fieldset className="object-text-formatting" aria-label="Textformat för hela objektet" disabled={disabled}>
  <legend>Textformat för hela objektet</legend>
  <p>Ändrar all text i objektet. Markera text i redigeraren ovan för att formatera enstaka ord.</p>
  <label>Objektets textstorlek
   <input key={id+':'+String(size)} type="number" min="1" max="200"
    aria-label="Objektets textstorlek" aria-describedby="object-text-size-status"
    placeholder={sizeStatus==='mixed'?'Blandade värden':''}
    defaultValue={typeof size==='number'?size:''}
    onBlur={event=>{const raw=event.currentTarget.value.trim();const next=Number(raw);if(raw&&Number.isFinite(next)&&next>=1&&next<=200&&next!==size)onChange({key:'fontSize',value:next});}}
    onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/>
  </label>
  <span id="object-text-size-status" role="status">{sizeStatus==='mixed'?'Blandade värden':sizeStatus==='unset'?'Inget värde angivet':''}</span>
  <label>Objektets textfärg
   <input type="color" aria-label="Objektets textfärg" aria-describedby="object-text-color-status"
    value={typeof color==='string'&&/^#[a-f0-9]{6}$/i.test(color)?color:'#183641'}
    onChange={event=>onChange({key:'color',value:event.target.value})}/>
  </label>
  <span id="object-text-color-status" role="status">{colorStatus==='mixed'?'Blandade färger':colorStatus==='unset'?'Ingen färg angiven':''}</span>
 </fieldset>;
}
