import type {D} from './model.ts';
/** Shared by the presenter and the self-contained HTML player. Unsupported effects stay visible. */
export function animationSchedule(slide:D){
 let group=0,start=0,end=0;
 return (slide.animations??[]).filter((a:D)=>['appear','fade'].includes(a.effect)&&['entrance','exit'].includes(a.phase??'entrance')).map((a:D)=>{
  if(a.trigger==='on-click'){group++;start=0;end=0;}
  const at=a.trigger==='after-previous'?end:start;
  start=at+Math.max(0,Math.min(60000,Number(a.delayMs)||0));
  const duration=Math.max(0,Math.min(60000,Number(a.durationMs)||0));end=start+duration;
  return {...a,phase:a.phase??'entrance',group,start,duration};
 });
}
export function playbackSteps(slide:D){return Math.max(0,...animationSchedule(slide).map((a:D)=>a.group),...(slide.delivery?.fragments??[]).map((f:D)=>f.order));}
/** Every invocation reconstructs state; no timers survive navigation or replay. */
export function applyPlayback(root:HTMLElement,slide:D,step:number,reduced=false,animate=true){
 const schedule=animationSchedule(slide),running:Animation[]=[],original=new Map<HTMLElement,{visibility:string;opacity:string}>();
 const targets=new Set<string>(schedule.map((a:D)=>a.targetId));
 for(const id of targets){
  const node=root.querySelector<HTMLElement>('[data-element-id="'+CSS.escape(id)+'"]');if(!node)continue;
  original.set(node,{visibility:node.style.visibility,opacity:node.style.opacity});const base=node.style.opacity===''?1:Number(node.style.opacity);
  const effects=schedule.filter((a:D)=>a.targetId===id);let visible=effects[0].phase==='exit';
  for(const a of effects){if(a.group<step||(!animate&&a.group<=step))visible=a.phase!=='exit';}
  node.style.visibility=visible?'visible':'hidden';node.style.opacity=visible?String(base):'0';
  const current=effects.filter((a:D)=>a.group===step&&animate);
  for(const a of current){
   const entrance=a.phase==='entrance',from=visible?base:0,to=entrance?base:0;
   if(!reduced&&typeof node.animate==='function'){
    // Visibility is animated too, so entrance delays cannot expose the target early.
    running.push(node.animate(a.effect==='fade'?[{opacity:from,visibility:'visible'},{opacity:to,visibility:entrance?'visible':'hidden'}]:[{opacity:to,visibility:entrance?'visible':'hidden'},{opacity:to,visibility:entrance?'visible':'hidden'}],{duration:a.effect==='appear'?1:Math.max(1,a.duration),delay:a.start,fill:'forwards',easing:'linear'}));
   }else{node.style.visibility=entrance?'visible':'hidden';node.style.opacity=String(to);}
   visible=entrance;
  }
 }
 return ()=>{for(const a of running)a.cancel();for(const [node,style] of original){node.style.visibility=style.visibility;node.style.opacity=style.opacity;}};
}
/** No imports or closures: embedded verbatim after its shared helpers in HTML export. */
export function portablePlayer(doc:D){
 const sections=Array.from(document.querySelectorAll<HTMLElement>('.portable')).filter(s=>s.dataset.hidden!=='true');let at=0,step=0,touch=0;let cleanup=()=>{};
 document.body.classList.add('enhanced');
 const current=()=>doc.slides.find((s:D)=>s.id===sections[at]?.dataset.slideId);
 function resize(){document.querySelectorAll<HTMLElement>('.portable-stage').forEach(w=>{const d=w.firstElementChild as HTMLElement,scale=Math.min(innerWidth/doc.document.canvas.width,(innerHeight-60)/doc.document.canvas.height);d.style.transform='scale('+scale+')';w.style.width=doc.document.canvas.width*scale+'px';w.style.height=doc.document.canvas.height*scale+'px';});}
 function show(i:number,n=0,animate=true){cleanup();const changed=at!==i;at=Math.max(0,Math.min(sections.length-1,i));step=n;document.querySelectorAll<HTMLElement>('.portable').forEach(s=>{s.hidden=s!==sections[at];});const s=current();if(!s)return;document.getElementById('page')!.textContent=(at+1)+' / '+sections.length+' · Steg '+step;const root=sections[at];root.dataset.playbackStep=String(step);
  for(const f of s.delivery?.fragments??[]){const node=root.querySelector<HTMLElement>('[data-element-id="'+CSS.escape(f.elementId)+'"]');if(node)node.hidden=f.order>step;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,clean=applyPlayback(root,s,step,reduced,animate),transition=s.delivery?.transition??doc.presentation?.defaultTransition;
  const fade=changed&&!reduced&&transition?.type==='fade'?root.animate([{opacity:0},{opacity:1}],{duration:Math.min(60000,transition.durationMs??400)}):null;cleanup=()=>{clean();fade?.cancel();};resize();
 }
 function navigate(direction:number){const max=playbackSteps(current()??{});if(direction>0&&step<max)show(at,step+1);else if(direction<0&&step>0)show(at,step-1,false);else{const next=Math.max(0,Math.min(sections.length-1,at+direction));if(next!==at)show(next,direction>0?0:playbackSteps(doc.slides.find((s:D)=>s.id===sections[next].dataset.slideId)),direction>0);}}
 document.getElementById('next')!.onclick=()=>navigate(1);document.getElementById('prev')!.onclick=()=>navigate(-1);
 document.addEventListener('click',e=>{const node=(e.target as HTMLElement).closest<HTMLElement>('[data-actions]');if(!node)return;for(const a of JSON.parse(node.dataset.actions!)){if(a.kind==='navigate-slide'){const i=sections.findIndex(s=>s.dataset.slideId===a.targetId);if(i>=0)show(i);}if(a.kind==='open-url'&&/^(https?:|mailto:|tel:)/i.test(a.url)&&!Array.from(a.url as string).some(c=>c.charCodeAt(0)<=32||c.charCodeAt(0)===92))window.open(a.url,'_blank','noopener,noreferrer');if(a.kind==='show-hide'){const target=sections[at].querySelector<HTMLElement>('[data-element-id="'+CSS.escape(a.targetId)+'"]');if(target)target.hidden=!target.hidden;}}});
 addEventListener('resize',resize);addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,select,textarea')||(e.key===' '&&(e.target as HTMLElement).closest('button,a')))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();navigate(1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();navigate(-1);}if(e.key==='Home')show(0);if(e.key==='End')show(sections.length-1);});
 addEventListener('touchstart',e=>touch=e.changedTouches[0].clientX,{passive:true});addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touch;if(Math.abs(dx)>60)navigate(dx<0?1:-1);},{passive:true});show(0);
}
