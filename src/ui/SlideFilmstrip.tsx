import {useEffect,useRef,useState} from 'react';
import {type D} from '../core/model';
import {SlideView} from '../editor/Renderer';

/** The standard slide list: direct selection, one-slide context actions and reordering. */
export function SlideFilmstrip({doc,activeId,disabled,onAdd,onOverview,onSelect,onDuplicate,onRemove,onHide,onLayout,onReorder,onMove}:{
 doc:D;activeId:string;disabled:boolean;onAdd:()=>void;onOverview:()=>void;onSelect:(id:string)=>void;
 onDuplicate:(id:string)=>void;onRemove:(id:string)=>void;onHide:(id:string,hidden:boolean)=>void;
 onLayout:(id:string)=>void;onReorder:(id:string,before:string|null)=>void;onMove:(id:string,direction:-1|1)=>void;
}){
 const [menu,setMenu]=useState<string|null>(null),[dragging,setDragging]=useState<string|null>(null);
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setMenu(null);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenu(null);};
  document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
 },[]);
 const invoke=(id:string,callback:()=>void)=>{onSelect(id);setMenu(null);callback();};
 return <aside id="slide-filmstrip" ref={root} className="filmstrip" aria-label="Bilder">
  <div className="panel-heading"><h2>Bilder</h2><button disabled={disabled} onClick={onAdd} aria-label="Lägg till bild">＋</button></div>
  <button type="button" className="slide-overview-toggle" onClick={onOverview}>Bildöversikt</button>
  <ol>{doc.slides.map((slide:D,index:number)=><li key={slide.id} className="filmstrip-item" data-drag-over={dragging!==null&&dragging!==slide.id||undefined}
   draggable={!disabled} onDragStart={event=>{setDragging(slide.id);setMenu(null);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-slide-fable',slide.id);}}
   onDragEnd={()=>setDragging(null)} onDragOver={event=>{if(dragging&&dragging!==slide.id)event.preventDefault();}}
   onDrop={event=>{event.preventDefault();if(!disabled&&dragging&&dragging!==slide.id)onReorder(dragging,slide.id);setDragging(null);}}>
   <button className={slide.id===activeId?'slide-card active':'slide-card'} aria-current={slide.id===activeId?'true':undefined}
    onClick={()=>{onSelect(slide.id);setMenu(null);}} onContextMenu={event=>{event.preventDefault();onSelect(slide.id);setMenu(slide.id);}}
    aria-label={`Bild ${index+1}: ${slide.title??'Bild'}${slide.hidden?' (dold)':''}`}>
    <span className="miniature"><SlideView doc={doc} slide={slide}/></span><span>{index+1}. {slide.title??'Bild'}{slide.hidden?' · dold':''}</span>
   </button>
   <button type="button" className="filmstrip-more" id={`slide-options-${index+1}`} aria-label={`Fler alternativ för bild ${index+1}`} aria-haspopup="menu" aria-expanded={menu===slide.id}
    onClick={()=>{onSelect(slide.id);setMenu(current=>current===slide.id?null:slide.id);}}>⋯</button>
   {menu===slide.id&&<div className="filmstrip-menu" id={`slide-menu-${index+1}`} role="menu" aria-label={`Bild ${index+1} alternativ`}>
    <button role="menuitem" id={`slide-duplicate-${index+1}`} disabled={disabled} onClick={()=>invoke(slide.id,()=>onDuplicate(slide.id))}>Duplicera bild</button>
    <button role="menuitem" onClick={()=>invoke(slide.id,()=>onLayout(slide.id))}>Ändra layout</button>
    <button role="menuitem" disabled={disabled} onClick={()=>invoke(slide.id,()=>onHide(slide.id,!slide.hidden))}>{slide.hidden?'Visa bild':'Dölj bild'}</button>
    <button role="menuitem" disabled={disabled||index===0} onClick={()=>invoke(slide.id,()=>onMove(slide.id,-1))}>Flytta upp</button>
    <button role="menuitem" disabled={disabled||index===doc.slides.length-1} onClick={()=>invoke(slide.id,()=>onMove(slide.id,1))}>Flytta ned</button>
    <button role="menuitem" disabled={disabled} onClick={()=>invoke(slide.id,()=>onRemove(slide.id))}>Ta bort bild</button>
   </div>}
  </li>)}</ol>
  <p className="filmstrip-help">Dra en bild för att ändra ordning. Högerklicka eller välj ⋯ för fler alternativ.</p>
 </aside>;
}
