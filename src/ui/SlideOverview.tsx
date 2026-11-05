import {useRef,useState,useEffect} from 'react';
import {layoutOf,masterOf,type D} from '../core/model';
import {SlideView} from '../editor/Renderer';

export function SlideThumbnail({doc,slide}:{doc:D;slide:D}){
 const host=useRef<HTMLSpanElement>(null),[width,setWidth]=useState(180);
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));if(host.current)observer.observe(host.current);return ()=>observer.disconnect();},[]);
 return <span ref={host} className="overview-thumbnail" aria-hidden="true" style={{aspectRatio:doc.document.canvas.width+'/'+doc.document.canvas.height}}><span style={{position:'absolute',left:0,top:0,transformOrigin:'top left',transform:`scale(${width/doc.document.canvas.width})`}}><SlideView doc={doc} slide={slide}/></span></span>;
}
export function SlideOverview({doc,activeId,disabled,onOpen,onDuplicate,onDelete,onHide,onMove,onDrop,onLayout,onReuse}:{doc:D;activeId:string;disabled:boolean;onOpen:(id:string)=>void;onDuplicate:(ids:string[])=>string[];onDelete:(ids:string[])=>void;onHide:(ids:string[],hidden:boolean)=>void;onMove:(ids:string[],direction:-1|1)=>void;onDrop:(ids:string[],target:string|null)=>void;onLayout:(ids:string[],layout:string)=>void;onReuse:()=>void}){
 const [chosen,setChosen]=useState<string[]>([activeId]),[layout,setLayout]=useState('');
 const drag=useRef<string[]>([]),anchor=useRef(activeId);
 const ids=chosen.filter(id=>doc.slides.some((s:D)=>s.id===id));
 const selected=doc.slides.filter((s:D)=>ids.includes(s.id));
 const layouts=(masterOf(doc,selected[0]??doc.slides[0])?.layouts??[]).filter((l:D)=>selected.every((s:D)=>(masterOf(doc,s)?.layouts??[]).some((other:D)=>other.id===l.id)));
 const choose=(id:string,extend=false,range=false)=>{
  if(range){const order=doc.slides.map((s:D)=>s.id),a=order.indexOf(anchor.current),b=order.indexOf(id);setChosen(Array.from(new Set([...ids,...order.slice(Math.min(a,b),Math.max(a,b)+1)])));}
  else if(extend)setChosen(ids.includes(id)?ids.filter(item=>item!==id):[...ids,id]);
  else setChosen([id]);anchor.current=id;
 };
 return <section aria-label="Bildöversikt" className="slide-overview"><h2>Bildöversikt</h2><p>{ids.length} av {doc.slides.length} bilder valda</p>
  <div className="overview-actions"><button onClick={()=>setChosen(doc.slides.map((s:D)=>s.id))}>Markera alla bilder</button><button onClick={()=>setChosen([])}>Avmarkera bilder</button><button onClick={onReuse} disabled={disabled}>Infoga bilder från fil</button></div>
  <fieldset disabled={disabled||!ids.length}><legend>Åtgärder för valda bilder</legend><div className="overview-actions"><button onClick={()=>setChosen(onDuplicate(ids))}>Duplicera valda bilder</button><button onClick={()=>{onDelete(ids);setChosen([]);}}>Ta bort valda bilder</button><button onClick={()=>onHide(ids,true)}>Dölj valda bilder</button><button onClick={()=>onHide(ids,false)}>Visa valda bilder</button><button onClick={()=>onMove(ids,-1)}>Flytta valda tidigare</button><button onClick={()=>onMove(ids,1)}>Flytta valda senare</button><button onClick={()=>onDrop(ids,null)}>Flytta valda sist</button></div><div className="overview-actions"><select aria-label="Layout för valda bilder" value={layouts.some((l:D)=>l.id===layout)?layout:''} onChange={e=>setLayout(e.target.value)}><option value="">Välj gemensam layout</option>{layouts.map((l:D)=><option key={l.id} value={l.id}>{l.name??l.id}</option>)}</select><button disabled={!layouts.some((l:D)=>l.id===layout)} onClick={()=>onLayout(ids,layout)}>Använd layout på valda bilder</button></div></fieldset>
  <p>Dra en bild före en annan för att ändra ordning. Använd flyttknapparna på pekskärm eller med tangentbord. Skift markerar ett intervall.</p>
  <div className="slide-overview-grid">{doc.slides.map((s:D,i:number)=><article key={s.id} className="overview-card" data-slide-id={s.id} data-chosen={ids.includes(s.id)} draggable={!disabled} onDragStart={e=>{drag.current=ids.includes(s.id)?ids:[s.id];setChosen(drag.current);e.dataTransfer.setData('application/x-slide-fable',s.id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{drag.current=[];}} onDragOver={e=>{if(!disabled&&drag.current.length)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(!disabled&&drag.current.length)onDrop(drag.current,s.id);drag.current=[];}}>
   <label className="overview-select"><input type="checkbox" aria-label={'Välj bild '+(i+1)} checked={ids.includes(s.id)} onChange={()=>choose(s.id,true)}/>{i+1}. {s.title??'Bild'}{s.hidden?' · dold':''}</label>
   <button type="button" className="overview-preview" aria-pressed={ids.includes(s.id)} aria-label={'Markera bild '+(i+1)} onClick={e=>choose(s.id,e.ctrlKey||e.metaKey,e.shiftKey)} onDoubleClick={()=>onOpen(s.id)}><SlideThumbnail doc={doc} slide={s}/></button>
   <button type="button" onClick={()=>onOpen(s.id)} aria-label={'Redigera bild '+(i+1)}>Redigera bild</button><span className="overview-layout-name">{layoutOf(doc,s)?.name??'Fri layout'}</span>
  </article>)}</div>
 </section>;
}
export function ReuseSlidePicker({source,disabled,onInsert}:{source:D;disabled:boolean;onInsert:(ids:string[])=>void}){
 const [chosen,setChosen]=useState<string[]>([]);
 return <section aria-label="Återanvänd bilder" className="slide-overview"><h2>Återanvänd bilder</h2><p>{source.document.title} · {source.slides.length} bilder</p><p>Valda bilder infogas efter den aktiva bilden och behåller sitt utseende. Deras ursprungliga layouter frikopplas. Länkar till bilder som inte väljs följer inte med.</p>
  <fieldset disabled={disabled}><legend>Välj bilder att infoga</legend><div className="overview-actions"><button onClick={()=>setChosen(source.slides.map((s:D)=>s.id))}>Välj alla källbilder</button><button onClick={()=>setChosen([])}>Avmarkera källbilder</button><button className="primary" disabled={!chosen.length} onClick={()=>onInsert(chosen)}>Infoga valda bilder ({chosen.length})</button></div><div className="slide-overview-grid">{source.slides.map((s:D,i:number)=><label key={s.id} className="overview-card" data-chosen={chosen.includes(s.id)}><input type="checkbox" aria-label={'Återanvänd bild '+(i+1)} checked={chosen.includes(s.id)} onChange={()=>setChosen(ids=>ids.includes(s.id)?ids.filter(id=>id!==s.id):[...ids,s.id])}/>{i+1}. {s.title??'Bild'}<SlideThumbnail doc={source} slide={s}/></label>)}</div></fieldset>
 </section>;
}
