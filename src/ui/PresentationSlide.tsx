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
  const holder=ref.current?.parentElement;
  if(!holder)return;
  const screen=holder.classList.contains('presentation-fit')?holder.parentElement:null;
  const canvasWidth=doc.document.canvas.width,canvasHeight=doc.document.canvas.height;
  const update=()=>{
   if(screen&&canvasWidth>0&&canvasHeight>0){
    // Measure the real available viewport instead of relying on nested CSS
    // multiplication/division, which can resolve to auto on older browsers.
    const bounds=screen.getBoundingClientRect();
    const fittedWidth=Math.max(0,Math.min(bounds.width,bounds.height*canvasWidth/canvasHeight));
    holder.style.width=fittedWidth+'px';
    holder.style.height=(fittedWidth*canvasHeight/canvasWidth)+'px';
   }
   setWidth(holder.getBoundingClientRect().width);
  };
  update();
  const observer=new ResizeObserver(update);
  observer.observe(screen??holder);
  return ()=>{
   observer.disconnect();
   if(screen){holder.style.removeProperty('width');holder.style.removeProperty('height');}
  };
 },[doc.document.canvas.width,doc.document.canvas.height]);
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
