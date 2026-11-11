import {useLayoutEffect,useRef,useState} from 'react';
import {applyPlayback} from '../core/playback';
import {SlideView} from '../editor/Renderer';
import type {D} from '../core/model';

/** Numeric transform avoids CSS length division (100cqw / 1600px),
 * which is not consistently evaluated on older mobile Safari versions.
 * The parent is the presentation-fit/animation-preview-stage viewport.
 */
export function PresentationSlide({doc,slide,step,onNavigate}:{doc:D;slide:D;step:number;onNavigate:(id:string)=>void}){
 const ref=useRef<HTMLDivElement>(null),previous=useRef({id:"",step:0});
 const [width,setWidth]=useState(0);
 useLayoutEffect(()=>{
  const parent=ref.current?.parentElement;
  if(!parent)return;
  const update=()=>setWidth(parent.getBoundingClientRect().width);
  update();
  const observer=new ResizeObserver(update);
  observer.observe(parent);
  return ()=>observer.disconnect();
 },[]);
 useLayoutEffect(()=>{if(!ref.current)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const changed=previous.current.id!==slide.id;const forward=changed||step>previous.current.step;previous.current={id:slide.id,step};
 const clean=applyPlayback(ref.current,slide,step,reduced,forward);
 const transition=slide.delivery?.transition??doc.presentation?.defaultTransition;
 const fade=changed&&!reduced&&transition?.type==='fade'?ref.current.animate([{opacity:0},{opacity:1}],{duration:Math.min(60000,transition.durationMs??400)}):null;
 return ()=>{clean();fade?.cancel();};
 },[slide,step,doc]);
 const canvasWidth=doc.document.canvas.width,canvasHeight=doc.document.canvas.height;
 const scale=width>0&&canvasWidth>0?width/canvasWidth:0;
 return <div ref={ref} className="playback-slide" data-playback-step={step} data-playback-scale={scale}
  style={{width:canvasWidth,height:canvasHeight,transform:`scale(${scale})`,transformOrigin:'top left'}}>
  <SlideView doc={doc} slide={slide} interactive fragments={step} onNavigate={onNavigate}/>
 </div>;
}
