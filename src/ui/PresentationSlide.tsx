import {useLayoutEffect,useRef} from 'react';
import {applyPlayback} from '../core/playback';
import {SlideView} from '../editor/Renderer';
import type {D} from '../core/model';
export function PresentationSlide({doc,slide,step,onNavigate}:{doc:D;slide:D;step:number;onNavigate:(id:string)=>void}){
 const ref=useRef<HTMLDivElement>(null),previous=useRef({id:"",step:0});
 useLayoutEffect(()=>{if(!ref.current)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const changed=previous.current.id!==slide.id;const forward=changed||step>previous.current.step;previous.current={id:slide.id,step};
 const clean=applyPlayback(ref.current,slide,step,reduced,forward);
 const transition=slide.delivery?.transition??doc.presentation?.defaultTransition;
 const fade=changed&&!reduced&&transition?.type==='fade'?ref.current.animate([{opacity:0},{opacity:1}],{duration:Math.min(60000,transition.durationMs??400)}):null;
 return ()=>{clean();fade?.cancel();};
 },[slide,step,doc]);
 return <div ref={ref} className="playback-slide" data-playback-step={step} style={{width:doc.document.canvas.width,height:doc.document.canvas.height,transform:`scale(calc(100cqw / ${doc.document.canvas.width}px))`,transformOrigin:"top left"}}><SlideView doc={doc} slide={slide} interactive fragments={step} onNavigate={onNavigate}/></div>;
}
