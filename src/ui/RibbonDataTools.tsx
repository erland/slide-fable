import {TableEditor,ChartEditor} from '../editor/ObjectEditors';
import type {D} from '../core/model';

type Props={element:D;disabled:boolean;onChange:(patch:D)=>void;onDetails:()=>void};
/** Contextual authoring surface. Reuses the inspector editors, so data edits follow the same undo/validation path. */
export function RibbonDataTools({element,disabled,onChange,onDetails}:Props){
 if(!['table','chart'].includes(element.type))return null;
 const table=element.type==='table';
 return <div className="ribbon-data-tools" role="group" aria-label={table?'Tabellverktyg':'Diagramverktyg'}>
  <span className="ribbon-selection-label">{table?'Tabell':'Diagram'}</span>
  {!table&&<label>Diagramtyp<select aria-label="Diagramtyp på verktygsfältet" value={element.chartType} disabled={disabled} onChange={e=>onChange({chartType:e.target.value})}><option value="bar">Staplar</option><option value="line">Linje</option><option value="pie">Cirkel</option></select></label>}
  <details className="ribbon-data-disclosure" key={element.id}>
   <summary>{table?'Redigera tabell':'Redigera diagramdata'}</summary>
   <div className="ribbon-data-popover" role="region" aria-label={table?'Redigera tabellinnehåll':'Redigera diagraminnehåll'}>
    <p>{table?'Redigera cellerna direkt. Ändringar syns direkt på bilden.':'Redigera kategorier, serier och värden direkt. Ändringar syns direkt på bilden.'}</p>
    <fieldset disabled={disabled}>{table?<TableEditor element={element} onChange={onChange}/>:<ChartEditor element={element} onChange={onChange}/>}</fieldset>
   </div>
  </details>
  <button type="button" onClick={onDetails}>Fler egenskaper</button>
 </div>;
}
