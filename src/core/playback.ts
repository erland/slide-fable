import type {D} from './model.ts';
/** Shared by the presenter and the self-contained HTML player. Unsupported effects stay visible. */
export function animationSchedule(slide:D){
 let group=0,previousStart=0,previousEnd=0;
 return (slide.animations??[]).filter((a:D)=>['appear','fade','fly-in','fly-out'].includes(a.effect)&&['entrance','exit'].includes(a.phase??'entrance')).map((a:D)=>{
  const trigger=a.trigger??'on-click';
  if(trigger==='on-click'){group++;previousStart=0;previousEnd=0;}
  const anchor=trigger==='after-previous'?previousEnd:trigger==='with-previous'?previousStart:0;
  const delay=Math.max(0,Math.min(60000,Number(a.delayMs)||0));
  const start=anchor+delay;
  const duration=Math.max(0,Math.min(60000,Number(a.durationMs)||0));
  previousStart=start;previousEnd=start+duration;
  return {...a,phase:a.phase??'entrance',group,start,duration};
 });
}
export function playbackSteps(slide:D){return Math.max(0,...animationSchedule(slide).map((a:D)=>a.group),...(slide.delivery?.fragments??[]).map((f:D)=>f.order));}
/** Always reconstruct a step from the PPD: no WAAPI state or timer survives navigation. */
export function applyPlayback(root:HTMLElement,slide:D,step:number,reduced=false,animate=true){
 const schedule=animationSchedule(slide),running:Animation[]=[],original=new Map<HTMLElement,{visibility:string;opacity:string}>();
 const keyOf=(a:D)=>a.targetId+'|'+(Number.isInteger(a.from?.paragraph?.x)?a.from.paragraph.x:'all');
 const targets=new Set<string>(schedule.map(keyOf));
 for(const key of targets){
  const effects=schedule.filter((a:D)=>keyOf(a)===key);
  const id=effects[0].targetId,index=effects[0].from?.paragraph?.x;
  const parent=root.querySelector<HTMLElement>('[data-element-id="'+CSS.escape(id)+'"]');
  // Paragraph effects target individual list paragraphs; the parent remains visible.
  const node=Number.isInteger(index)?parent?.querySelectorAll<HTMLElement>('p')[index]:parent;
  if(!node)continue;
  original.set(node,{visibility:node.style.visibility,opacity:node.style.opacity});
  const rawBase=node.style.opacity===''?1:Number(node.style.opacity),base=Number.isFinite(rawBase)?rawBase:1;
  let visible=effects[0].phase==='exit';
  for(const a of effects)if(a.group<step||(!animate&&a.group<=step))visible=a.phase!=='exit';
  node.style.visibility=visible?'visible':'hidden';node.style.opacity=visible?String(base):'0';
  const current=effects.filter((a:D)=>a.group===step&&animate);
  if(!current.length)continue;
  const finalVisible=current[current.length-1].phase!=='exit';
  if(reduced||typeof node.animate!=='function'){
   node.style.visibility=finalVisible?'visible':'hidden';
   node.style.opacity=finalVisible?String(base):'0';
   continue;
  }
  if(current.length===1){
   const a=current[0],entrance=a.phase==='entrance',from=visible?base:0,to=entrance?base:0;
   const isFly=a.effect==='fly-in'||a.effect==='fly-out';
   const delta=a.effect==='fly-in'?a.from?.offset:a.to;
   const off=((Number(delta?.x)||0)*110)+'% '+((Number(delta?.y)||0)*110)+'%';
   const frames=isFly
    ?[{opacity:entrance?0:base,visibility:'visible',translate:entrance?off:'0% 0%'},{opacity:entrance?base:0,visibility:entrance?'visible':'hidden',translate:entrance?'0% 0%':off}]
    :a.effect==='fade'
     ?[{opacity:from,visibility:'visible'},{opacity:to,visibility:entrance?'visible':'hidden'}]
     :[{opacity:to,visibility:entrance?'visible':'hidden'},{opacity:to,visibility:entrance?'visible':'hidden'}];
   running.push(node.animate(frames,{duration:a.effect==='appear'?1:Math.max(1,a.duration),delay:a.start,fill:'forwards',easing:'linear'}));
   continue;
  }
  // One WAAPI timeline per target prevents competing fill-forwards effects.
  // If two effects overlap on the same target, the latest started effect takes precedence.
  const ordered=current.map((a:D,index:number)=>({...a,index})).sort((a:D,b:D)=>a.start-b.start||a.index-b.index);
  const end=Math.max(1,...ordered.map((a:D)=>a.start+Math.max(a.effect==='appear'?1:a.duration,1)));
  const keyframes:{offset:number;opacity:number;visibility:string;translate?:string}[]=[{offset:0,opacity:visible?base:0,visibility:visible?'visible':'hidden'}];
  let priorEnd=0,priorVisible=visible;
  for(let i=0;i<ordered.length;i++){
   const a=ordered[i],entrance=a.phase==='entrance',from=entrance?0:base,to=entrance?base:0;
   const start=a.start,finish=Math.min(end,start+Math.max(a.effect==='appear'?1:a.duration,1));
   // Explicit duplicate keyframes at the boundary prevent a delayed entrance
   // from becoming visible before its trigger time.
   if(start>priorEnd)keyframes.push({offset:start/end,opacity:priorVisible?base:0,visibility:priorVisible?'visible':'hidden'});
   const startOpacity=a.effect==='appear'?to:from;
   const isFly=a.effect==='fly-in'||a.effect==='fly-out',delta=a.effect==='fly-in'?a.from?.offset:a.to;
   const off=((Number(delta?.x)||0)*110)+'% '+((Number(delta?.y)||0)*110)+'%';
   keyframes.push({offset:start/end,opacity:startOpacity,visibility:entrance||a.effect==='fade'||isFly?'visible':'hidden',...(isFly?{translate:entrance?off:'0% 0%'}:{})});
   const stop=Math.min(finish,ordered[i+1]?.start??finish),progress=Math.max(0,Math.min(1,(stop-start)/Math.max(a.effect==='appear'?1:a.duration,1)));
   const endOpacity=a.effect==='fade'||isFly?from+(to-from)*progress:to;
   keyframes.push({offset:stop/end,opacity:endOpacity,visibility:entrance||progress<1&&(a.effect==='fade'||isFly)?'visible':'hidden',...(isFly?{translate:entrance?((1-progress)*(Number(delta?.x)||0)*110)+'% '+((1-progress)*(Number(delta?.y)||0)*110)+'%':(progress*(Number(delta?.x)||0)*110)+'% '+(progress*(Number(delta?.y)||0)*110)+'%'}:{})});
   priorEnd=stop;priorVisible=entrance;
  }
  if(priorEnd<end)keyframes.push({offset:1,opacity:priorVisible?base:0,visibility:priorVisible?'visible':'hidden'});
  running.push(node.animate(keyframes,{duration:end,delay:0,fill:'forwards',easing:'linear'}));
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
