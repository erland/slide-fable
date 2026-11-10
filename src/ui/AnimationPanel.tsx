import {useRef,useState,type PointerEvent} from 'react';
import {textOf,type D} from '../core/model';
import {animationSchedule} from '../core/playback';
const names:Record<string,string>={appear:'Visa',fade:'Tona in',exit:'Försvinn','fly-in':'Flyg in','fly-out':'Flyg ut'};
const adjustMs=(current:number|undefined,delta:number)=>Math.max(0,Math.min(60000,(Number(current)||0)+delta));
const directions=[{label:'Från vänster',x:-1,y:0},{label:'Från höger',x:1,y:0},{label:'Uppifrån',x:0,y:-1},{label:'Nedifrån',x:0,y:1}];
/** Pointer adjustments are preview-only until release: one undoable transaction per drag. */
function TimingBar({index,animation,start,duration,end,disabled,onUpdate}:{index:number;animation:D;start:number;duration:number;end:number;disabled:boolean;onUpdate:(id:string,patch:D)=>void}){
 const track=useRef<HTMLDivElement>(null);
 const drag=useRef<{pointerId:number;clientX:number;pixels:number;field:'delayMs'|'durationMs';initial:number}|null>(null);
 const [preview,setPreview]=useState<{delayMs:number;durationMs:number}|null>(null);
 const scale=Math.max(1000,end);
 const delay=preview?.delayMs??(animation.delayMs??0),length=preview?.durationMs??duration;
 const shownStart=start+delay-(animation.delayMs??0);
 const left=Math.min(99.4,Math.max(0,shownStart/scale*100));
 const width=Math.min(Math.max(length/scale*100,0.6),100-left);
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  const active=drag.current;
  if(!active||event.pointerId!==active.pointerId)return;
  const delta=(event.clientX-active.clientX)/active.pixels*scale;
  const adjusted=Math.max(0,Math.min(60000,Math.round((active.initial+delta)/50)*50));
  setPreview(current=>({...{delayMs:animation.delayMs??0,durationMs:duration},...current,[active.field]:adjusted}));
 };
 const stop=(event:PointerEvent<HTMLDivElement>,commit:boolean)=>{
  const active=drag.current;
  if(!active||active.pointerId!==event.pointerId)return;
  const delta=(event.clientX-active.clientX)/active.pixels*scale;
  const value=Math.max(0,Math.min(60000,Math.round((active.initial+delta)/50)*50));
  drag.current=null;setPreview(null);
  if(track.current?.hasPointerCapture(event.pointerId))track.current.releasePointerCapture(event.pointerId);
  if(commit&&value!==active.initial)onUpdate(animation.id,{[active.field]:value});
 };
 return <div ref={track} className="animation-timing-track animation-timing-draggable" data-timing-index={index} aria-label={'Dra animation '+index+' för fördröjning eller dess högra kant för varaktighet'}
  onPointerDown={event=>{
   if(disabled||event.button!==0||!(event.target instanceof HTMLElement))return;
   const field=event.target.dataset.timingHandle==='duration'?'durationMs':event.target.closest('.animation-timing-bar')?'delayMs':null;
   if(!field||field==='durationMs'&&animation.effect==='appear')return;
   const pixels=event.currentTarget.getBoundingClientRect().width;
   if(pixels<=0)return;
   drag.current={pointerId:event.pointerId,clientX:event.clientX,pixels,field,initial:field==='delayMs'?(animation.delayMs??0):duration};
   event.currentTarget.setPointerCapture(event.pointerId);
   event.preventDefault();
  }}
  onPointerMove={move} onPointerUp={event=>stop(event,true)} onPointerCancel={event=>stop(event,false)}>
  <span className="animation-timing-bar" style={{left:left+'%',width:width+'%'}}><span data-timing-handle="duration" className="animation-timing-resize" aria-hidden="true"/></span>
 </div>;
}
export function AnimationPanel({doc,slide,selected,disabled,onTransition,onAdd,onUpdate,onRemove,onMove,onPreview}:{doc:D;slide:D;selected:string[];disabled:boolean;onTransition:(type:string,duration:number)=>void;onAdd:(id:string,effect:string)=>void;onUpdate:(id:string,patch:D)=>void;onRemove:(id:string)=>void;onMove:(id:string,delta:number)=>void;onPreview:()=>void}){
 const transition=slide.delivery?.transition??{type:'none',durationMs:400},animations=slide.animations??[];
 const timeline=animationSchedule(slide);
 const timedById=new Map<string,D>(timeline.map((a:D)=>[a.id,a]));
 const groupEnd=new Map<number,number>();
 for(const a of timeline)groupEnd.set(a.group,Math.max(groupEnd.get(a.group)??0,a.start+a.duration));
 const target=slide.view.elements.find((e:D)=>selected.includes(e.id)&&!e.locked&&e.visible!==false);
 const value=target&&['text','shape'].includes(target.type)?textOf(slide,target):null;
 const listCount=typeof value==='object'?(value?.paragraphs??[]).filter((p:D)=>p.paragraphStyle?.listType&&p.paragraphStyle.listType!=='none').length:0;
 return <fieldset className="animation-panel" disabled={disabled}><legend>Övergång och animeringar</legend>
 <label>Bildövergång<select aria-label="Bildövergång" value={transition.type} onChange={e=>onTransition(e.target.value,transition.durationMs??400)}><option value="none">Ingen</option><option value="fade">Toning</option>{!['none','fade'].includes(transition.type)&&<option value={transition.type}>Importerad: {transition.type}</option>}</select></label>
 <label>Övergångstid (ms)<input aria-label="Övergångstid (ms)" type="number" min="0" max="60000" key={transition.durationMs} defaultValue={transition.durationMs??400} onBlur={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=60000)onTransition(transition.type,n);}}/></label>
 {doc.schemaVersion!=='0.4.0'?<p>Objektanimeringar kräver PPD 0.4. Befintliga fragment bevaras.</p>:<><p>Markera ett objekt och välj effekt. Första klicket spelar steg 1. Med/föregående spelas automatiskt inom samma steg.</p><div className="button-row">{['appear','fade','exit','fly-in','fly-out'].map(effect=><button key={effect} disabled={!target} onClick={()=>onAdd(target!.id,effect)}>{names[effect]}</button>)}<button disabled={!target||listCount<2} onClick={()=>onAdd(target!.id,'bullet-steps')}>Visa punktlista stegvis</button></div>
 <ol className="animation-list">{animations.map((a:D,i:number)=>{const supported=['appear','fade','fly-in','fly-out'].includes(a.effect)&&['entrance','exit'].includes(a.phase??'entrance');const el=slide.view.elements.find((e:D)=>e.id===a.targetId);const timing=timedById.get(a.id),end=timing?groupEnd.get(timing.group)??0:0;
 return <li key={a.id}><strong>{el?.name??el?.accessibility?.altText??({shape:'Form',text:'Text',image:'Bild',group:'Grupp'}[el?.type as string]??el?.type??a.targetId)} · {a.from?.paragraph?.x!==undefined?'Punkt '+(a.from.paragraph.x+1):a.phase==='exit'&&a.effect==='appear'?'Försvinn':names[a.effect]??a.effect}</strong>
 {timing&&<div className="animation-timing" aria-label={'Klicksteg '+timing.group+', start '+timing.start+' millisekunder, varaktighet '+timing.duration+' millisekunder'}>
  <span className="animation-timing-label">Klick {timing.group} · Start {timing.start} ms · Varaktighet {timing.duration} ms</span>
  <TimingBar index={i+1} animation={a} start={timing.start} duration={timing.duration} end={end} disabled={disabled} onUpdate={onUpdate}/>
  <div className="animation-timing-actions" role="group" aria-label={'Justera timing '+(i+1)}>
   <span>Fördröjning</span>
   <button type="button" aria-label={'Minska fördröjning '+(i+1)} disabled={disabled||(a.delayMs??0)<=0} onClick={()=>onUpdate(a.id,{delayMs:adjustMs(a.delayMs,-100)})}>−100</button>
   <button type="button" aria-label={'Öka fördröjning '+(i+1)} disabled={disabled||(a.delayMs??0)>=60000} onClick={()=>onUpdate(a.id,{delayMs:adjustMs(a.delayMs,100)})}>+100</button>
   <span>Varaktighet</span>
   <button type="button" aria-label={'Minska varaktighet '+(i+1)} disabled={disabled||a.effect==='appear'||(a.durationMs??0)<=0} onClick={()=>onUpdate(a.id,{durationMs:adjustMs(a.durationMs,-100)})}>−100</button>
   <button type="button" aria-label={'Öka varaktighet '+(i+1)} disabled={disabled||a.effect==='appear'||(a.durationMs??0)>=60000} onClick={()=>onUpdate(a.id,{durationMs:adjustMs(a.durationMs,100)})}>+100</button>
  </div>
 </div>}
 {!supported?<p>Importerad effekt bevaras men spelas inte av denna version.</p>:<><label>Start<select aria-label={'Start '+(i+1)} value={a.trigger} onChange={e=>onUpdate(a.id,{trigger:e.target.value})}><option value="on-click">Vid klick</option><option value="with-previous">Med föregående</option><option value="after-previous">Efter föregående</option></select></label>{['fly-in','fly-out'].includes(a.effect)&&<label>Riktning<select aria-label={'Riktning '+(i+1)} value={directions.find(d=>d.x===(a.effect==='fly-in'?a.from?.offset?.x:a.to?.x)&&d.y===(a.effect==='fly-in'?a.from?.offset?.y:a.to?.y))?.label??'Från vänster'} onChange={e=>{const d=directions.find(d=>d.label===e.target.value)!;onUpdate(a.id,a.effect==='fly-in'?{from:{offset:{x:d.x,y:d.y}}}:{to:{x:d.x,y:d.y}});}}>{directions.map(d=><option key={d.label} value={d.label}>{a.effect==='fly-out'?d.label.replace('Från vänster','Åt vänster').replace('Från höger','Åt höger').replace('Uppifrån','Uppåt').replace('Nedifrån','Nedåt'):d.label}</option>)}</select></label>}{['durationMs','delayMs'].map((key)=><label key={key}>{key==='durationMs'?'Varaktighet':'Fördröjning'} (ms)<input aria-label={(key==='durationMs'?'Varaktighet':'Fördröjning')+' '+(i+1)} type="number" min="0" max="60000" defaultValue={a[key]??0} key={a[key]} onBlur={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=60000)onUpdate(a.id,{[key]:n});}}/></label>)}</>}
 <div className="button-row"><button aria-label={'Flytta animering '+(i+1)+' upp'} disabled={i===0} onClick={()=>onMove(a.id,-1)}>↑</button><button aria-label={'Flytta animering '+(i+1)+' ned'} disabled={i===animations.length-1} onClick={()=>onMove(a.id,1)}>↓</button><button aria-label={'Ta bort animering '+(i+1)} onClick={()=>onRemove(a.id)}>Ta bort</button></div></li>;})}</ol></>}
 <button onClick={onPreview}>Förhandsvisa från aktuell bild</button><p>Spelas i presentation och HTML. PDF, PPTX och bildexport är statiska. Inställningen minskad rörelse respekteras.</p>
 </fieldset>;
}
