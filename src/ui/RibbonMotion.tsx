import {textOf,type D} from '../core/model';

type MotionTab='Övergångar'|'Animeringar'|'Bildspel';
export function RibbonMotion({mode,doc,slide,selected,disabled,onTransition,onAdd,onDetails,onPreview,onStart}: {
 mode:MotionTab;doc:D;slide:D;selected:string[];disabled:boolean;
 onTransition:(type:string,duration:number)=>void;onAdd:(id:string,effect:string)=>void;
 onDetails:()=>void;onPreview:()=>void;onStart:()=>void;
}){
 const transition=slide.delivery?.transition??{type:'none',durationMs:400};
 const target=slide.view.elements.find((item:D)=>selected.includes(item.id)&&!item.locked&&item.visible!==false);
 const rich=target&&['text','shape'].includes(target.type)?textOf(slide,target):null;
 const listCount=typeof rich==='object'?(rich?.paragraphs??[]).filter((p:D)=>p.paragraphStyle?.listType&&p.paragraphStyle.listType!=='none').length:0;
 const animations=slide.animations??[];
 if(mode==='Övergångar')return <div className="ribbon-motion" role="group" aria-label="Bildövergångar">
  <span className="ribbon-motion-title">Bildövergång</span>
  <label>Effekt<select aria-label="Övergångseffekt" disabled={disabled} value={transition.type} onChange={e=>onTransition(e.target.value,transition.durationMs??400)}><option value="none">Ingen</option><option value="fade">Toning</option>{!['none','fade'].includes(transition.type)&&<option value={transition.type}>Importerad: {transition.type}</option>}</select></label>
  <label>Tid (ms)<input aria-label="Övergångstid" key={transition.durationMs} type="number" min="0" max="60000" defaultValue={transition.durationMs??400} disabled={disabled} onBlur={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=60000&&n!==(transition.durationMs??400))onTransition(transition.type,n);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
  <button type="button" onClick={onPreview}>Förhandsvisa övergång</button>
  <button type="button" onClick={onDetails}>Fler övergångsval</button>
 </div>;
 if(mode==='Animeringar')return <div className="ribbon-motion" role="group" aria-label="Objektanimeringar">
  <span className="ribbon-motion-title">Objektanimeringar · {animations.length}</span>
  {doc.schemaVersion==='0.4.0'?<><span className="ribbon-motion-hint">{target?'Markerat objekt':'Markera ett objekt'}</span>
   <button type="button" disabled={disabled||!target} onClick={()=>{if(target)onAdd(target.id,'appear');}}>Visa</button>
   <button type="button" disabled={disabled||!target} onClick={()=>{if(target)onAdd(target.id,'fade');}}>Tona in</button>
   <button type="button" disabled={disabled||!target} onClick={()=>{if(target)onAdd(target.id,'exit');}}>Försvinn</button>
   <button type="button" disabled={disabled||!target} onClick={()=>{if(target)onAdd(target.id,'fly-in');}}>Flyg in</button>
   <button type="button" disabled={disabled||!target} onClick={()=>{if(target)onAdd(target.id,'fly-out');}}>Flyg ut</button>
   <button type="button" disabled={disabled||!target||listCount<2} onClick={()=>{if(target)onAdd(target.id,'bullet-steps');}}>Punkter stegvis</button>
  </>:<span className="ribbon-motion-hint">Objektanimeringar kräver PPD 0.4</span>}
  <button type="button" onClick={onDetails}>Ordna animeringar</button>
  <button type="button" onClick={onPreview}>Förhandsvisa animeringar</button>
 </div>;
 return <div className="ribbon-motion" role="group" aria-label="Bildspelsverktyg">
  <span className="ribbon-motion-title">Bildspel</span>
  <button type="button" onClick={onStart}>Från början</button>
  <button type="button" onClick={onPreview}>Från aktuell bild</button>
  <button type="button" onClick={onDetails}>Övergångar och animeringar</button>
  <span className="ribbon-motion-hint">{doc.slides.length} bilder · Talaranteckningar visas i presentatörsläget</span>
 </div>;
}
