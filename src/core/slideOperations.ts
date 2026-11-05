import {copy,effective,layoutOf,masterOf,uid,type D} from './model.ts';
import {normalizePpd040Styles} from './ppd040Staging.ts';

const assetKeys=new Set(['assetRef','fallbackAssetRef','posterAssetRef','renderedAssetRef','captionsAssetRef']);
function visit(value:unknown,fn:(object:D)=>void){
 if(Array.isArray(value)){value.forEach(v=>visit(v,fn));return;}
 if(!value||typeof value!=='object')return;
 fn(value as D);for(const [key,child] of Object.entries(value))if(key!=='extensions')visit(child,fn);
}
function identities(value:unknown){const ids=new Map<string,string>();visit(value,o=>{if(typeof o.id==='string'&&!ids.has(o.id))ids.set(o.id,uid('copy'));});return ids;}
export function selectedSlideIds(doc:D,requested:readonly string[]):string[]{
 const ids=new Set(requested);if(requested.some(id=>!doc.slides.some((s:D)=>s.id===id)))throw Error('Bilden finns inte längre.');
 return doc.slides.filter((s:D)=>ids.has(s.id)).map((s:D)=>s.id);
}
export function moveSlidesBefore(order:readonly string[],ids:readonly string[],target:string|null):string[]{
 const set=new Set(ids);if(target!==null&&(!order.includes(target)||set.has(target)))return [...order];
 const moving=order.filter(id=>set.has(id)),remaining=order.filter(id=>!set.has(id));
 const at=target===null?remaining.length:remaining.indexOf(target);return [...remaining.slice(0,at),...moving,...remaining.slice(at)];
}
export function moveSlidesBy(order:readonly string[],ids:readonly string[],direction:-1|1):string[]{
 if(direction!==-1&&direction!==1)throw Error('INVALID_SLIDE_DIRECTION');
 const next=[...order],set=new Set(ids);
 if(direction===-1){for(let i=1;i<next.length;i++)if(set.has(next[i])&&!set.has(next[i-1]))[next[i-1],next[i]]=[next[i],next[i-1]];}
 else for(let i=next.length-2;i>=0;i--)if(set.has(next[i])&&!set.has(next[i+1]))[next[i],next[i+1]]=[next[i+1],next[i]];
 return next;
}
type RewriteContext={ids:Map<string,string>;slides:Map<string,string>;components?:Map<string,string>;componentElements?:Map<string,string>;assets?:Map<string,string>;sections?:Map<string,string>;external:boolean;removed:number};
function rewrite(value:D,ctx:RewriteContext):D{
 const result=copy(value),ref=(id:string)=>ctx.ids.get(id)??ctx.componentElements?.get(id)??id;
 visit(result,o=>{
  if(typeof o.id==='string')o.id=ref(o.id);
  if(o.componentId&&ctx.components)o.componentId=ctx.components.get(o.componentId)??o.componentId;
  if(o.sectionId&&ctx.sections)o.sectionId=ctx.sections.get(o.sectionId)??o.sectionId;
  for(const key of assetKeys)if(o[key]&&ctx.assets)o[key]=ctx.assets.get(o[key])??o[key];
  if(o.contentRef){const [id,field]=o.contentRef.split('#');o.contentRef=ref(id)+(field?'#'+field:'');}
  for(const key of ['elementId','from','to','parentId'])if(typeof o[key]==='string')o[key]=ref(o[key]);
  for(const key of ['children','accessibilityOrder'])if(Array.isArray(o[key]))o[key]=o[key].map((item:unknown)=>typeof item==='string'?ref(item):item);
  if(Array.isArray(o.actions))o.actions=o.actions.filter((action:D)=>{
   const map=action.kind==='navigate-slide'?ctx.slides:ctx.ids;
   if(!action.targetId)return true;
   if(map.has(action.targetId)){action.targetId=map.get(action.targetId);return true;}
   if(action.kind!=='navigate-slide'&&ctx.componentElements?.has(action.targetId)){action.targetId=ctx.componentElements.get(action.targetId);return true;}
   if(!ctx.external){ctx.removed++;return false;}return true;
  });
  if(Array.isArray(o.animations))o.animations=o.animations.filter((a:D)=>{if(ctx.ids.has(a.targetId)||ctx.componentElements?.has(a.targetId)){a.targetId=ref(a.targetId);return true;}if(!ctx.external){ctx.removed++;return false;}return true;});
  if(o.type==='component'&&o.overrides&&ctx.componentElements)o.overrides=Object.fromEntries(Object.entries(o.overrides).map(([key,v])=>[ctx.componentElements!.get(key)??key,v]));
 });
 return result;
}
export function duplicateSlides(doc:D,requested:readonly string[]):string[]{
 const ids=selectedSlideIds(doc,requested);if(doc.slides.length+ids.length>200)throw Error('Presentationens gräns på 200 bilder överskrids.');
 const slideMap=new Map(ids.map(id=>[id,uid('slide')]));
 const contexts=new Map<string,Map<string,string>>(),globalElements=new Map<string,string>();
 for(const s of doc.slides.filter((s:D)=>slideMap.has(s.id))){const map=identities(s);map.set(s.id,slideMap.get(s.id)!);contexts.set(s.id,map);for(const e of s.view.elements)globalElements.set(e.id,map.get(e.id)!);}
 doc.slides=doc.slides.flatMap((s:D)=>{
  if(!slideMap.has(s.id))return [s];
  const map=contexts.get(s.id)!;const clone=rewrite(s,{ids:map,slides:slideMap,componentElements:globalElements,external:true,removed:0});
  return [s,clone];
 });
 doc.slides.forEach((s:D,i:number)=>s.order=i);return ids.map(id=>slideMap.get(id)!);
}
function resolveColors(value:D,source:D){visit(value,o=>{if(o.colorToken){if(o.color===undefined&&source.theme.colors?.[o.colorToken])o.color=source.theme.colors[o.colorToken];delete o.colorToken;}});}
function materialize(element:D,source:D,slide:D,index:number):D{
 const next=copy(effective(source,slide,element));delete next.styleRef;
 next.style={fontSize:36,fontFamily:'Fable, sans-serif',color:next.style?.color??source.theme.colors?.[next.style?.colorToken]??'#183641',...next.style};
 next.zIndex=next.zIndex??index;resolveColors(next,source);return next;
}
/** Prepare an isolated candidate. The caller validates assets and checks revision before commit. */
export function reuseSlides(target:D,source:D,requested:readonly string[],afterId:string){
 if(target.schemaVersion==='0.3.1'&&source.schemaVersion==='0.4.0')throw Error('Bilder i det nya formatet kan inte infogas i en äldre presentation.');
 const ids=selectedSlideIds(source,requested);if(!ids.length)throw Error('Välj minst en bild.');
 if(target.slides.length+ids.length>200)throw Error('Presentationens gräns på 200 bilder överskrids.');
 const doc=copy(target),slideMap=new Map(ids.map(id=>[id,uid('slide')])),sectionMap=new Map<string,string>();
 const selected=source.slides.filter((s:D)=>slideMap.has(s.id)),prepared:D[]=[];
 for(const s of selected){
  const master=masterOf(source,s),layout=layoutOf(source,s),slide=copy(s);
  slide.view.elements=[...(master?.elements??[]).map((e:D)=>materialize(e,source,s,0)),...(layout?.elements??[]).map((e:D)=>materialize(e,source,s,0)),...s.view.elements.map((e:D,i:number)=>materialize(e,source,s,i))];
  slide.view.background=copy(s.view.background??layout?.background??master?.background??{type:'color',color:source.theme.colors?.surface??'#ffffff'});
  const width=source.document.canvas.width,height=source.document.canvas.height,targetWidth=target.document.canvas.width,targetHeight=target.document.canvas.height;
  if(width!==targetWidth||height!==targetHeight){
   if(![width,height,targetWidth,targetHeight].every(n=>Number.isFinite(n)&&n>0))throw Error('Bildformatet har ogiltiga mått.');
   const background=slide.view.background,id=uid('canvas-background');
   const underlay:D={id,type:'shape',shapeType:'rect',geometry:{x:0,y:0,width,height},style:{fill:{color:background.color??source.theme.colors?.surface??'#ffffff'}},zIndex:Math.min(-1,...slide.view.elements.map((e:D)=>e.zIndex??0))-1};
   if(background.type==='image'){underlay.type='image';delete underlay.shapeType;underlay.assetRef=background.assetRef;underlay.fit=background.fit??'cover';}
   else if(background.type==='gradient')underlay.style.fill=copy(background.style?.fill??underlay.style.fill);
   const childIds=new Set(slide.view.elements.flatMap((e:D)=>e.children??[])),roots=slide.view.elements.filter((e:D)=>!childIds.has(e.id)).map((e:D)=>e.id);
   const factor=Math.min(targetWidth/width,targetHeight/height),frameId=uid('canvas-frame');
   slide.view.elements=[underlay,...slide.view.elements,{id:frameId,type:'group',geometry:{x:(targetWidth-width*factor)/2,y:(targetHeight-height*factor)/2,width:width*factor,height:height*factor},transform:{x:0,y:0,width,height},children:[id,...roots],extensions:{slideFableCanvasFrame:true}}];
   slide.view.background={type:'color',color:background.color??source.theme.colors?.surface??'#ffffff'};
  }
  delete slide.masterId;delete slide.layoutId;delete slide.placeholderBindings;
  resolveColors(slide.view.background,source);prepared.push(slide);
  if(s.sectionId&&!sectionMap.has(s.sectionId))sectionMap.set(s.sectionId,uid('section'));
 }
 const needed=new Set<string>();visit(prepared,o=>{if(o.componentId)needed.add(o.componentId);});
 let count=-1;while(count!==needed.size){count=needed.size;for(const c of source.components??[])if(needed.has(c.id))visit(c,o=>{if(o.componentId)needed.add(o.componentId);});}
 for(const c of source.components??[])if(needed.has(c.id))visit(c,o=>{if(o.contentRef)throw Error('Komponenter med bildberoende text kan inte återanvändas ännu.');});
 const components=(source.components??[]).filter((c:D)=>needed.has(c.id)).map((c:D)=>({...copy(c),elements:c.elements.map((e:D,i:number)=>materialize(e,source,selected[0],i))}));
 const componentMap=new Map<string,string>(components.map((c:D)=>[c.id,uid('component')])),componentElements=identities(components);
 for(const [old,id] of componentMap)componentElements.set(old,id);
 const assets=new Map<string,string>();visit([prepared,components],o=>{for(const key of assetKeys)if(o[key]&&!assets.has(o[key]))assets.set(o[key],uid('asset'));});
 for(const [old,id] of assets){if(!source.assets[old])throw Error('En bildresurs saknas i källfilen.');doc.assets[id]=copy(source.assets[old]);}
 const importMasterId=uid('master'),importLayoutId=uid('layout');
 doc.masters??=[];doc.masters.push({id:importMasterId,name:'Återanvända bilder',elements:[],layouts:[{id:importLayoutId,name:'Frikopplad',placeholders:[]}]});
 const maps=new Map<string,Map<string,string>>();
 for(const s of prepared){const map=identities(s);map.set(s.id,slideMap.get(s.id)!);maps.set(s.id,map);for(const e of s.view.elements)componentElements.set(e.id,map.get(e.id)!);}
 const context={slides:slideMap,components:componentMap,componentElements,assets,sections:sectionMap,external:false,removed:0};
 let removed=0;doc.components??=[];doc.components.push(...components.map((c:D)=>{const ctx={...context,ids:componentElements};const cloned=rewrite(c,ctx);cloned.id=componentMap.get(c.id)!;removed+=ctx.removed;return cloned;}));
 for(const [old,id] of sectionMap){const section=source.presentation.sections?.find((s:D)=>s.id===old);if(section){doc.presentation.sections??=[];doc.presentation.sections.push({...copy(section),id});}}
 const clones=prepared.map(s=>{const ctx={...context,ids:maps.get(s.id)!};const cloned=rewrite(s,ctx);cloned.masterId=importMasterId;cloned.layoutId=importLayoutId;removed+=ctx.removed;return cloned;});
 const at=doc.slides.findIndex((s:D)=>s.id===afterId);if(at<0)throw Error('Den aktiva bilden finns inte längre.');
 doc.slides.splice(at+1,0,...clones);doc.slides.forEach((s:D,i:number)=>s.order=i);
 if(doc.schemaVersion==='0.4.0')normalizePpd040Styles(doc);
 return {doc,ids:clones.map(s=>s.id as string),removedLinks:removed};
}
