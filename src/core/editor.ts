import {duplicateSlides,moveSlidesBefore,moveSlidesBy,selectedSlideIds,reuseSlides} from './slideOperations.ts';
import {applySlideLayout,applyThemeChoice,type ThemeChoice} from './designGallery.ts';
import {applySlideBackground,resetSlideBackground,type BackgroundScope} from './backgroundControls.ts';
import {supportsFormat,validateFormatChange,selectionFormatPatch,type SelectionFormatChange} from './selectionFormatting.ts';
import {inspectPpd040} from './ppd040Preflight.ts';
import {toOutline,normalizePpd040Styles} from './ppd040Staging.ts';
import {validateCore,validateFull} from './contract.ts';
import {allElements,blocks,box,copy,createDocument,effective,layoutOf,newSlide,plain,rich,setText,textOf,uid,isGeometry,isElementCommand,type Geometry,type D} from './model.ts';
import {updateSafety} from '../pwa/safety.ts';
import {arrangeSelection,matchSelectionSize,scaleSelection,snapSelectionScaleFromCorner,type ArrangeItem,type ArrangeMode,type MatchSizeMode,type ScaleCorner} from './arrange.ts';
export type EditorState={doc:D;slideId:string;selected:string[];dirty:boolean;exportedRevision:number|null;readOnly:boolean;original:string;warnings:string[];undo:number;redo:number};
function validateEditorDocument(doc:D){
 if(doc.schemaVersion==='0.4.0'){
  const report=inspectPpd040(doc);
  if(!report.ready)throw Error('PPD_040_INVALID: '+(report.issues[0]?.code??'UNKNOWN'));
 }else validateCore(doc);
}
/** Follow stable paragraph identities when rich text is reordered. Stale steps are dropped rather than animating another paragraph. */
function reconcileParagraphAnimations(slide:D,elementId:string,before:D|string,after:D|string){
 const oldParagraphs=typeof before==='string'?[]:before?.paragraphs??[];
 const newParagraphs=typeof after==='string'?[]:after?.paragraphs??[];
 if(!oldParagraphs.length||!slide.animations?.length)return;
 const positions=new Map<string,number>();
 newParagraphs.forEach((p:D,i:number)=>{if(typeof p.id==='string'&&p.paragraphStyle?.listType&&p.paragraphStyle.listType!=='none')positions.set(p.id,i);});
 slide.animations=slide.animations.flatMap((a:D)=>{
  const index=a.from?.paragraph?.x;
  if(a.targetId!==elementId||!Number.isInteger(index))return [a];
  const oldId=oldParagraphs[index]?.id;
  if(typeof oldId!=='string'||!positions.has(oldId))return [];
  return [{...a,from:{...a.from,paragraph:{...a.from.paragraph,x:positions.get(oldId)}}}];
 });
}
export class EditorStore{
 private state:EditorState;private listeners=new Set<()=>void>();private past:D[]=[];private future:D[]=[];
 constructor(doc=createDocument()){validateEditorDocument(doc);this.state={doc,slideId:doc.slides[0].id,selected:[],dirty:false,exportedRevision:null,readOnly:false,original:'',warnings:[],undo:0,redo:0};}
 getSnapshot=()=>this.state;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>{this.listeners.delete(fn);};};
 private publish(patch:Partial<EditorState>){this.state={...this.state,...patch,undo:this.past.length,redo:this.future.length};for(const fn of this.listeners)fn();}
 select(ids:string[]){this.publish({selected:ids});}
 selectSlide(id:string){if(this.state.doc.slides.some((s:D)=>s.id===id))this.publish({slideId:id,selected:[]});}
 get slide():D{return this.state.doc.slides.find((s:D)=>s.id===this.state.slideId)??this.state.doc.slides[0];}
 load(doc:D,readOnly=false,original='',warnings:string[]=[]){if(!readOnly)validateEditorDocument(doc);this.past=[];this.future=[];updateSafety.setDirty(false);this.publish({doc:copy(doc),slideId:doc.slides[0].id,selected:[],dirty:false,exportedRevision:null,readOnly,original,warnings});}
 transaction(change:(doc:D,slide:D)=>void){if(this.state.readOnly)throw Error('READ_ONLY');if(updateSafety.getSnapshot().locked)throw Error('UPDATE_LOCKED');const next=copy(this.state.doc);const slide=next.slides.find((s:D)=>s.id===this.state.slideId)??next.slides[0];change(next,slide);next.document.revision=(Number(next.document.revision)||0)+1;next.document.modifiedAt=new Date().toISOString();delete next.build;if(next.schemaVersion==='0.4.0')normalizePpd040Styles(next);validateEditorDocument(next);updateSafety.setDirty(true);this.past.push(this.state.doc);while(this.past.length>50)this.past.shift();let budget=0;for(let i=this.past.length-1;i>=0;i--){budget+=JSON.stringify(this.past[i]).length;if(budget>64*1024*1024&&i<this.past.length-1){this.past.splice(0,i+1);break;}}this.future=[];this.publish({doc:next,dirty:true});}
 undo(){if(!this.past.length||this.state.readOnly)return;if(!updateSafety.setDirty(true))return;this.future.push(this.state.doc);this.publish({doc:this.past.pop()!,selected:[],dirty:true});}
 redo(){if(!this.future.length||this.state.readOnly)return;if(!updateSafety.setDirty(true))return;this.past.push(this.state.doc);this.publish({doc:this.future.pop()!,selected:[],dirty:true});}
 /** Export acknowledges only the downloaded revision, never local IndexedDB persistence. */
 markExported(revision:number){if(Number(this.state.doc.document.revision??0)!==revision)return;this.publish({exportedRevision:revision});}
 /** A completed CAS write may clear dirty only if this exact snapshot is still current. */
 markPersisted(snapshot:D){if(this.state.doc!==snapshot)return false;updateSafety.setDirty(false);this.publish({dirty:false});return true;}
 /** Compile-time checked operations for the common editor command path. */
 setSlideTitle(title:string){if(typeof title!=='string')throw Error('INVALID_SLIDE_TITLE');this.updateSlide({title});}
 setElementGeometry(id:string,geometry:Geometry){
  if(typeof id!=='string'||!isGeometry(geometry))throw Error('INVALID_GEOMETRY');
  if(!this.slide.view.elements.some((element:D)=>element.id===id))return false;
  this.updateElement(id,{geometry});return true;
 }
 insertTypedElement(element:import('./model.ts').ElementCommand){
  if(!isElementCommand(element))throw Error('INVALID_ELEMENT');
  this.insert(element);return element.id;
 }
 setTransition(type:string,durationMs:number){
  if(!['none','fade'].includes(type)||!Number.isInteger(durationMs)||durationMs<0||durationMs>60000)throw Error('INVALID_TRANSITION');
  this.transaction((_d,s)=>{s.delivery={...s.delivery,transition:{type,durationMs}};});
 }
 addAnimation(targetId:string,effect:string){
  if(this.state.doc.schemaVersion!=='0.4.0')throw Error('ANIMATION_REQUIRES_PPD_040');
  const target=this.slide.view.elements.find((e:D)=>e.id===targetId&&!e.locked&&e.visible!==false);
  if(!target||!['appear','fade','exit','fly-in','fly-out','bullet-steps'].includes(effect))throw Error('INVALID_ANIMATION');
  if(effect==='bullet-steps'){
   if(!['text','shape'].includes(target.type))throw Error('BULLETS_REQUIRE_TEXT');
   const value=textOf(this.slide,target);
   const paragraphs=typeof value==='string'?[]:value.paragraphs??[];
   const indices=paragraphs.map((p:D,i:number)=>p.paragraphStyle?.listType&&p.paragraphStyle.listType!=='none'?i:-1).filter((i:number)=>i>=0);
   if(indices.length<2)throw Error('BULLETS_REQUIRE_LIST');
   this.transaction((d,s)=>{
    s.animations??=[];
    // Reapplying bullet steps replaces the prior sequence without accumulating click groups.
    const isBulletStep=(a:D)=>a.targetId===targetId&&a.effect==='appear'&&a.phase==='entrance'&&Number.isInteger(a.from?.paragraph?.x);
    const first=s.animations.findIndex(isBulletStep);
    s.animations=s.animations.filter((a:D)=>!isBulletStep(a));
    const steps=indices.map((index:number)=>({id:uid('animation'),targetId,effect:'appear',phase:'entrance',trigger:'on-click',durationMs:0,delayMs:0,from:{paragraph:{x:index,y:0}}}));
    s.animations.splice(first<0?s.animations.length:first,0,...steps);
    validateCore(d);
   });
   return;
  }
  this.transaction((d,s)=>{s.animations??=[];s.animations.push({id:uid('animation'),targetId,effect:effect==='exit'?'appear':effect,phase:effect==='exit'||effect==='fly-out'?'exit':'entrance',trigger:'on-click',durationMs:['fade','fly-in','fly-out'].includes(effect)?400:0,delayMs:0,...(effect==='fly-in'?{from:{offset:{x:-1,y:0}}}:effect==='fly-out'?{to:{x:1,y:0}}:{})});validateCore(d);});
 }
 updateAnimation(id:string,patch:D){
  for(const [key,value] of Object.entries(patch)){
   const timing=['durationMs','delayMs'].includes(key)&&Number.isInteger(value)&&Number(value)>=0&&Number(value)<=60000;
   const trigger=key==='trigger'&&['on-click','with-previous','after-previous'].includes(String(value));
   const offset=key==='from'&&value&&typeof value==='object'&&Object.keys(value).length===1&&Object.keys(value)[0]==='offset'&&[-1,0,1].includes(value.offset?.x)&&[-1,0,1].includes(value.offset?.y)&&Math.abs(value.offset.x)+Math.abs(value.offset.y)===1;
   const destination=key==='to'&&value&&typeof value==='object'&&Object.keys(value).length===2&&[-1,0,1].includes(value.x)&&[-1,0,1].includes(value.y)&&Math.abs(value.x)+Math.abs(value.y)===1;
   if(!timing&&!trigger&&!offset&&!destination)throw Error('INVALID_ANIMATION_PATCH');
  }
  this.transaction((d,s)=>{const a=s.animations?.find((a:D)=>a.id===id);if(!a)throw Error('ANIMATION_NOT_FOUND');if('from' in patch&&a.effect!=='fly-in'||'to' in patch&&a.effect!=='fly-out')throw Error('INVALID_ANIMATION_PATCH');Object.assign(a,patch);validateCore(d);});
 }
 removeAnimation(id:string){this.transaction((_d,s)=>{s.animations=(s.animations??[]).filter((a:D)=>a.id!==id);});}
 moveAnimation(id:string,delta:number){this.transaction((_d,s)=>{const items=s.animations??[],i=items.findIndex((a:D)=>a.id===id),to=i+delta;if(i<0||to<0||to>=items.length||![-1,1].includes(delta))return;[items[i],items[to]]=[items[to],items[i]];});}
 updateDocument(patch:D){this.transaction(d=>Object.assign(d.document,patch));}
 updateSlide(patch:D){this.transaction((_d,s)=>Object.assign(s,patch));}
 updateElement(id:string,patch:D){this.transaction((d,s)=>{const e=s.view.elements.find((e:D)=>e.id===id);if(!e)return;const adjusted=copy(patch);
 if(d.schemaVersion==='0.4.0'&&adjusted.style)adjusted.style=toOutline(adjusted.style);
 const previousText='text' in adjusted?copy(textOf(s,e)):null;
 Object.assign(e,adjusted);
 if(previousText!==null)reconcileParagraphAnimations(s,id,previousText,textOf(s,e));
 const binding=s.placeholderBindings?.find((b:D)=>b.elementId===id);if(binding){binding.overrides={...binding.overrides};for(const k of ['geometry','style'])if(adjusted[k])binding.overrides[k]=copy(adjusted[k]);}});}
 formatSelected(change:SelectionFormatChange){
  validateFormatChange(change);
  const ids=new Set(this.state.selected);
  const targets=this.slide.view.elements.filter((e:D)=>ids.has(e.id)&&supportsFormat(e,change.key));
  if(!targets.length)return;
  this.transaction((d,s)=>{
   for(const e of s.view.elements.filter((item:D)=>ids.has(item.id)&&supportsFormat(item,change.key))){
    const patch=selectionFormatPatch(d,s,e,change);
    Object.assign(e,patch);
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===e.id);
    if(binding)binding.overrides={...binding.overrides,style:copy(patch.style)};
    if(change.key==='color'||change.key==='fontSize'){
     const text=copy(textOf(s,e));
     if(typeof text!=='string'){
      // Shared semantic content must not recolor locked or unselected instances.
      if(e.contentRef&&s.view.elements.some((other:D)=>other.id!==e.id&&other.contentRef===e.contentRef&&(!ids.has(other.id)||!supportsFormat(other,change.key)))){
       const blockId=uid('block');
       for(const p of text.paragraphs??[])p.id=uid('p');
       s.content.blocks.push({id:blockId,kind:'text',text});
       e.contentRef=blockId+'#text';
       if(binding?.contentRef)binding.contentRef=e.contentRef;
      }
      for(const p of text.paragraphs??[])for(const run of p.runs??[])run[change.key==='fontSize'?'size':'color']=change.value;
      setText(s,e,text);
     }
    }
   }
  });
 }
 editText(id:string,value:D|string){this.transaction((_d,s)=>{const e=s.view.elements.find((e:D)=>e.id===id);if(e){const previous=copy(textOf(s,e));setText(s,e,copy(value));reconcileParagraphAnimations(s,id,previous,textOf(s,e));}});}
 insert(element:D){this.transaction((d,s)=>s.view.elements.push(d.schemaVersion==='0.4.0'&&element.style?{...element,style:toOutline(element.style)}:element));this.select([element.id]);}
 add(type:string,shapeType='rect'){const g=box(180+this.slide.view.elements.length*12,220,600,240),base:D={id:uid(type),type,geometry:g,style:{}};
 if(type==='text'){base.text=rich('Ny text');base.style={fontSize:40,color:'#183641'};}
 if(type==='shape'){base.shapeType=shapeType==='round'?'rect':shapeType;base.style={fill:{color:'#d5e5df'},stroke:{color:'#183641'},strokeWidth:2,cornerRadius:shapeType==='round'?30:12,fontSize:32,color:'#183641',align:'center',verticalAlign:'middle',padding:14};base.text=rich('');}
 if(type==='line'||type==='arrow'){base.geometry=box(200,300,600,10);base.style={stroke:{color:'#cf694c'},strokeWidth:5};}
 if(type==='table'){base.cells=[[{id:uid('cell'),text:'Rubrik A',header:true},{id:uid('cell'),text:'Rubrik B',header:true}],[{id:uid('cell'),text:'Värde A'},{id:uid('cell'),text:'Värde B'}]];base.geometry=box(150,300,1100,300);}
 if(type==='chart'){base.chartType='bar';base.dataset={categories:['A','B','C'],series:[{id:uid('series'),name:'Serie 1',values:[4,8,6]}]};base.geometry=box(180,260,1100,500);}
 if(type==='semanticDiagram'){base.semanticDiagram={kind:'process',nodes:[{id:uid('node'),label:'Förbered'},{id:uid('node'),label:'Besluta'},{id:uid('node'),label:'Genomför'}],edges:[],layout:{algorithm:'flow',direction:'lr'}};const n=base.semanticDiagram.nodes;base.semanticDiagram.edges=n.slice(1).map((v:D,i:number)=>({id:uid('edge'),from:n[i].id,to:v.id}));base.geometry=box(120,320,1300,260);}
 if(type==='equation'){base.equation={sourceFormat:'latex',source:'E = mc^2',altText:'Energi är massa gånger ljushastigheten i kvadrat'};base.geometry=box(350,300,800,200);}
 if(type==='vectorPath'){base.vectorPath={format:'svg-path',pathData:'M 0 100 C 120 0 240 200 360 100 L 360 200 L 0 200 Z',viewBox:'0 0 360 200'};base.style={fill:{color:'#d5e5df'},stroke:{color:'#183641'},strokeWidth:3};}
 if(this.state.doc.schemaVersion==='0.4.0')base.style=toOutline(base.style);
 this.insert(base);return base.id;}
 addSlide(layout='title'){let id='';this.transaction(d=>{const s=newSlide(d,layout);d.slides.push(s);id=s.id;});this.selectSlide(id);}
 removeSlides(ids:string[]){let next='';this.transaction(d=>{d.slides=d.slides.filter((s:D)=>!ids.includes(s.id));if(!d.slides.length)d.slides.push(newSlide(d,'blank'));if(ids.includes(d.presentation.initialSlideId))delete d.presentation.initialSlideId;for(const e of allElements(d))if(e.actions)e.actions=e.actions.filter((a:D)=>a.kind!=='navigate-slide'||!ids.includes(a.targetId));next=d.slides[0].id;});this.selectSlide(next);}
 moveSlide(id:string,direction:number){const slides=this.state.doc.slides;const i=slides.findIndex((s:D)=>s.id===id);if(i<0||!Number.isFinite(direction)||direction===0)return;const j=Math.max(0,Math.min(slides.length-1,i+direction));if(i===j)return;this.transaction(d=>{[d.slides[i],d.slides[j]]=[d.slides[j],d.slides[i]];d.slides.forEach((s:D,index:number)=>s.order=index);});}
 duplicateSlide(){let id='';this.transaction((d,s)=>{const c=copy(s);c.id=uid('slide');id=c.id;const result=cloneObjects(s.view.elements,s.content.blocks??[]);c.view.elements=result.elements;c.content.blocks=result.blocks;c.placeholderBindings=c.placeholderBindings?.map((b:D)=>({...b,elementId:result.ids.get(b.elementId)??b.elementId,contentRef:b.contentRef?remapRef(b.contentRef,result.blockIds):undefined}));c.view.accessibilityOrder=c.view.accessibilityOrder?.map((x:string)=>result.ids.get(x)??x);c.delivery??={};c.delivery.fragments=c.delivery.fragments?.map((f:D)=>({...f,id:f.id?uid('fragment'):undefined,elementId:result.ids.get(f.elementId)??f.elementId}));d.slides.splice(d.slides.indexOf(s)+1,0,c);});this.selectSlide(id);}
 removeSelected(){const selected=new Set(this.state.selected);this.transaction((_d,s)=>{const collect=(id:string)=>{const e=s.view.elements.find((e:D)=>e.id===id);for(const child of e?.children??[]){selected.add(child);collect(child);}};for(const id of [...selected])collect(id);s.view.elements=s.view.elements.filter((e:D)=>!selected.has(e.id));for(const e of s.view.elements){if(e.children)e.children=e.children.filter((id:string)=>!selected.has(id));for(const a of ['startAnchor','endAnchor'])if(selected.has(e[a]?.elementId))delete e[a];e.actions=e.actions?.filter((a:D)=>!selected.has(a.targetId));}s.placeholderBindings=s.placeholderBindings?.filter((b:D)=>!selected.has(b.elementId));s.view.accessibilityOrder=s.view.accessibilityOrder?.filter((id:string)=>!selected.has(id));if(s.animations)s.animations=s.animations.filter((a:D)=>!selected.has(a.targetId));if(s.delivery?.fragments)s.delivery.fragments=s.delivery.fragments.filter((f:D)=>!selected.has(f.elementId));});this.select([]);}
 copySelected(){const roots=this.state.selected,ids=new Set(roots);const collect=(id:string)=>{const el=this.slide.view.elements.find((e:D)=>e.id===id);for(const ch of el?.children??[]){ids.add(ch);collect(ch);}};roots.forEach(collect);return {elements:copy(this.slide.view.elements.filter((e:D)=>ids.has(e.id))),blocks:copy(blocks(this.slide).filter(b=>this.slide.view.elements.some((e:D)=>ids.has(e.id)&&e.contentRef?.split('#')[0]===b.id))),assets:copy(this.state.doc.assets),roots};}
 paste(payload:D){let selected:string[]=[];this.transaction((d,s)=>{const c=cloneObjects(payload.elements,payload.blocks);const assetMap=new Map<string,string>();for(const [id,a] of Object.entries(payload.assets) as [string,D][]){if(d.assets[id]&&JSON.stringify(d.assets[id])!==JSON.stringify(a)){const n=uid('asset');d.assets[n]=copy(a);assetMap.set(id,n);}else d.assets[id]=copy(a);}const rewrite=(o:D)=>{for(const [k,v] of Object.entries(o)){if(typeof v==='string'&&['assetRef','fallbackAssetRef','posterAssetRef','renderedAssetRef'].includes(k)&&assetMap.has(v))o[k]=assetMap.get(v);else if(Array.isArray(v))v.forEach(x=>{if(x&&typeof x==='object')rewrite(x);});else if(v&&typeof v==='object'&&k!=='extensions')rewrite(v);}};c.elements.forEach(e=>{rewrite(e);if(e.geometry&&(payload.roots??payload.elements.map((x:D)=>x.id)).some((id:string)=>c.ids.get(id)===e.id)){e.geometry.x+=24;e.geometry.y+=24;}});s.view.elements.push(...c.elements);s.content.blocks??=[];s.content.blocks.push(...c.blocks);selected=(payload.roots??payload.elements.map((e:D)=>e.id)).map((id:string)=>c.ids.get(id)!);});this.select(selected);}
 /** Duplicate selected objects as one undoable operation. Paste already
  * remaps element, block and asset references and offsets copies by 24 px. */
 duplicateSelected(){
  if(!this.state.selected.length)return [];
  this.paste(this.copySelected());
  return [...this.state.selected];
 }
 group(){if(this.state.selected.length<2)return;let id='';this.transaction((d,s)=>{const children=s.view.elements.filter((e:D)=>this.state.selected.includes(e.id));if(children.some((e:D)=>s.view.elements.some((p:D)=>p.children?.includes(e.id))))throw Error('Gruppera objekt på samma översta nivå.');const geometries=children.map((e:D)=>effective(d,s,e).geometry);const x=Math.min(...geometries.map((g:D)=>g.x)),y=Math.min(...geometries.map((g:D)=>g.y)),r=Math.max(...geometries.map((g:D)=>g.x+g.width)),b=Math.max(...geometries.map((g:D)=>g.y+g.height));for(const [i,e] of children.entries())e.geometry={...geometries[i],x:geometries[i].x-x,y:geometries[i].y-y};s.placeholderBindings=s.placeholderBindings?.filter((b:D)=>!children.some((e:D)=>e.id===b.elementId));id=uid('group');s.view.elements.push({id,type:'group',geometry:box(x,y,r-x,b-y),transform:box(0,0,r-x,b-y),children:children.map((e:D)=>e.id)});});this.select([id]);}
 ungroup(){const id=this.state.selected[0];this.transaction((_d,s)=>{const g=s.view.elements.find((e:D)=>e.id===id&&e.type==='group');if(!g)return;if(g.geometry.rotation)throw Error('Återställ gruppens rotation före avgruppering.');const b=g.geometry,t=g.transform??b;for(const cid of g.children){const e=s.view.elements.find((e:D)=>e.id===cid);e.geometry={...e.geometry,x:b.x+e.geometry.x*b.width/t.width,y:b.y+e.geometry.y*b.height/t.height,width:e.geometry.width*b.width/t.width,height:e.geometry.height*b.height/t.height};}s.view.elements=s.view.elements.filter((e:D)=>e.id!==id);if(s.animations)s.animations=s.animations.filter((a:D)=>a.targetId!==id);});this.select([]);}
 /** Move the entire editable selection as one undoable keyboard operation. */
 nudgeSelected(dx:number,dy:number){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))throw Error('INVALID_NUDGE_DELTA');
  if(dx===0&&dy===0)return;
  const ids=new Set(this.state.selected);
  if(!this.slide.view.elements.some((e:D)=>ids.has(e.id)&&!e.locked))return;
  this.transaction((d,s)=>{
   for(const e of s.view.elements){
    if(!ids.has(e.id)||e.locked)continue;
    const g=effective(d,s,e).geometry;
    const moved={...g,x:g.x+dx,y:g.y+dy};
    e.geometry={...e.geometry,x:moved.x,y:moved.y};
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===e.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(moved)};
   }
  });
 }
 align(mode:string){
  const ids=this.state.selected;
  const editable=this.slide.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked);
  const count=editable.length;
  if(count<2||mode.startsWith('distribute-')&&count<3)return;
  const supported=['left','center','right','top','middle','bottom','distribute-x','distribute-y'];
  if(!supported.includes(mode))throw Error('INVALID_ARRANGEMENT_MODE');
  this.transaction((d,s)=>{
   const elements=s.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked);
   const layout=arrangeSelection(elements.map((e:D)=>({id:e.id,geometry:effective(d,s,e).geometry})),mode as ArrangeMode);
   for(const item of layout){
    const element=elements.find((e:D)=>e.id===item.id);
    element.geometry={...element.geometry,...item.geometry};
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===element.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(item.geometry)};
   }
  });
 }
 matchSize(mode:MatchSizeMode){
  const ids=this.state.selected;
  // The first selected, unlocked rectangular object is the size reference.
  const eligible=this.slide.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
  if(eligible.length<2)return;
  const reference=ids.find(id=>eligible.some((e:D)=>e.id===id))!;
  const measured=eligible.map((e:D)=>({id:e.id,geometry:effective(this.state.doc,this.slide,e).geometry}));
  const target=matchSelectionSize(measured,reference,mode);
  if(target.every((item,i)=>item.geometry.width===measured[i].geometry.width&&item.geometry.height===measured[i].geometry.height))return;
  this.transaction((d,s)=>{
   const elements=s.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
   const layout=matchSelectionSize(elements.map((e:D)=>({id:e.id,geometry:effective(d,s,e).geometry})),reference,mode);
   for(const item of layout){
    if(item.id===reference)continue;
    const element=elements.find((e:D)=>e.id===item.id);
    element.geometry={...element.geometry,...item.geometry};
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===element.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(item.geometry)};
   }
  });
 }

 scaleSelected(factor:number){
  if(!Number.isFinite(factor)||factor<0.25||factor>2)throw Error('INVALID_SCALE_FACTOR');
  const ids=this.state.selected;
  const eligible=this.slide.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
  if(eligible.length<2||factor===1)return;
  const measured=eligible.map((e:D)=>({id:e.id,geometry:effective(this.state.doc,this.slide,e).geometry}));
  // Reject scales that would make any selected element too small.
  if(measured.some((item:ArrangeItem)=>item.geometry.width*factor<10||item.geometry.height*factor<10))throw Error('SCALE_BELOW_MINIMUM');
  this.transaction((d,s)=>{
   const objects=s.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
   const scaled=scaleSelection(objects.map((e:D)=>({id:e.id,geometry:effective(d,s,e).geometry})),factor);
   for(const item of scaled){
    const element=objects.find((e:D)=>e.id===item.id);
    element.geometry={...element.geometry,...item.geometry};
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===element.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(item.geometry)};
   }
  });
 }

 scaleSelectedFromCorner(corner:ScaleCorner,dx:number,dy:number,snapToObjects=false){
  const ids=this.state.selected;
  const elements=this.slide.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
  if(elements.length<2)return;
  const source=elements.map((e:D)=>({id:e.id,geometry:effective(this.state.doc,this.slide,e).geometry}));
  const neighbors=this.slide.view.elements.filter((e:D)=>!ids.includes(e.id)&&e.visible!==false).map((e:D)=>effective(this.state.doc,this.slide,e).geometry);
  const result=snapSelectionScaleFromCorner(source,corner,dx,dy,neighbors,snapToObjects);
  if(result.factor===1)return;
  this.transaction((d,s)=>{
   const editable=s.view.elements.filter((e:D)=>ids.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
   const scaled=snapSelectionScaleFromCorner(editable.map((e:D)=>({id:e.id,geometry:effective(d,s,e).geometry})),corner,dx,dy,neighbors,snapToObjects);
   for(const item of scaled.items){
    const element=editable.find((e:D)=>e.id===item.id);
    element.geometry={...element.geometry,...item.geometry};
    const binding=s.placeholderBindings?.find((b:D)=>b.elementId===element.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(item.geometry)};
   }
  });
 }

 reorder(id:string,mode:string){this.transaction((_d,s)=>{const sorted=[...s.view.elements].sort((a:D,b:D)=>(a.zIndex??0)-(b.zIndex??0));const i=sorted.findIndex((e:D)=>e.id===id);const [e]=sorted.splice(i,1);sorted.splice(mode==='front'?sorted.length:mode==='back'?0:Math.max(0,Math.min(sorted.length,i+(mode==='up'?1:-1))),0,e);sorted.forEach((e:D,i:number)=>e.zIndex=i);});}
 applyTheme(choice:ThemeChoice){this.transaction(d=>applyThemeChoice(d,choice));}
 setBackgroundColor(color:string,scope:BackgroundScope='current'){if(!/^#[\da-f]{6}$/i.test(color))throw Error('INVALID_BACKGROUND_COLOR');const targets=scope==='all'?this.state.doc.slides:[this.slide];if(targets.every((s:D)=>s.view.background?.type==='color'&&s.view.background.color?.toLowerCase()===color.toLowerCase()))return;this.transaction(d=>applySlideBackground(d,this.state.slideId,color,scope));}
 resetBackground(scope:BackgroundScope='current'){const targets=scope==='all'?this.state.doc.slides:[this.slide];if(!targets.some((s:D)=>s.view.background!==undefined))return;this.transaction(d=>resetSlideBackground(d,this.state.slideId,scope));}
 applyLayout(layoutId:string){if(layoutOf(this.state.doc,this.slide)?.id!==layoutId)this.transaction((d,s)=>applySlideLayout(d,s,layoutId));}
 applyLayouts(ids:string[],layoutId:string){const selected=selectedSlideIds(this.state.doc,ids);if(!selected.length)return;this.transaction(d=>{for(const s of d.slides)if(selected.includes(s.id)&&layoutOf(d,s)?.id!==layoutId)applySlideLayout(d,s,layoutId);validateCore(d);});}
 duplicateSlides(ids:string[]){if(!ids.length)return [];let created:string[]=[];this.transaction(d=>{created=duplicateSlides(d,ids);validateCore(d);});this.selectSlide(created[0]);return created;}
 setSlidesHidden(ids:string[],hidden:boolean){const selected=selectedSlideIds(this.state.doc,ids);if(!selected.some(id=>Boolean(this.state.doc.slides.find((s:D)=>s.id===id).hidden)!==hidden))return;this.transaction(d=>{for(const s of d.slides)if(selected.includes(s.id))s.hidden=hidden;});}
 reorderSlides(ids:string[],target:string|null){this.applySlideOrder(moveSlidesBefore(this.state.doc.slides.map((s:D)=>s.id),ids,target));}
 moveSlides(ids:string[],direction:-1|1){this.applySlideOrder(moveSlidesBy(this.state.doc.slides.map((s:D)=>s.id),ids,direction));}
 private applySlideOrder(order:string[]){if(order.every((id,i)=>id===this.state.doc.slides[i]?.id))return;this.transaction(d=>{const map=new Map<string,D>(d.slides.map((s:D)=>[s.id,s]));d.slides=order.map(id=>map.get(id)!);d.slides.forEach((s:D,i:number)=>s.order=i);});}
 async reuseSlides(source:D,ids:string[]){
  if(this.state.readOnly)throw Error('READ_ONLY');const base=this.state.doc,after=this.state.slideId;
  await validateFull(source);const candidate=reuseSlides(base,source,ids,after);await validateFull(candidate.doc);
  if(this.state.doc!==base||this.state.slideId!==after)throw Error('Presentationens innehåll ändrades. Försök infoga bilderna igen.');
  this.transaction(d=>Object.assign(d,candidate.doc));this.selectSlide(candidate.ids[0]);return candidate;
 }
 detachLayout(){this.transaction((d,s)=>{for(const e of s.view.elements){const v=effective(d,s,e);e.geometry=copy(v.geometry);e.style=copy(v.style);}delete s.layoutId;delete s.masterId;delete s.placeholderBindings;delete d.document.defaultMasterId;delete d.document.defaultLayoutId;});}
 resetLayout(){this.transaction((_d,s)=>{for(const b of s.placeholderBindings??[])delete b.overrides;});}
 makeComponent(){const payload=this.copySelected();let cid='';this.transaction((d,s)=>{const selected=s.view.elements.filter((e:D)=>this.state.selected.includes(e.id));if(!selected.length)return;const minx=Math.min(...selected.map((e:D)=>e.geometry.x)),miny=Math.min(...selected.map((e:D)=>e.geometry.y));const clone=cloneObjects(payload.elements,[]);for(const e of clone.elements){if(e.contentRef){e.text=rich(plain(blocks(s).find((b:D)=>b.id===e.contentRef.split('#')[0])?.text));delete e.contentRef;}e.geometry.x-=minx;e.geometry.y-=miny;}cid=uid('component');d.components??=[];d.components.push({id:cid,name:'Komponent '+(d.components.length+1),elements:clone.elements,slots:[]});});return cid;}
 insertComponent(id:string){this.insert({id:uid('instance'),type:'component',componentId:id,geometry:box(100,200,1000,500),overrides:{}});}
 replaceAll(search:string,replacement:string){if(!search)return;this.transaction(d=>{for(const s of d.slides){for(const b of blocks(s)){if(typeof b.text==='string')b.text=b.text.split(search).join(replacement);else for(const p of b.text?.paragraphs??[])for(const r of p.runs)r.text=r.text.split(search).join(replacement);}for(const e of s.view.elements){if(typeof e.text==='string')e.text=e.text.split(search).join(replacement);else for(const p of e.text?.paragraphs??[])for(const r of p.runs)r.text=r.text.split(search).join(replacement);}}});}
}
function remapRef(ref:string,map:Map<string,string>){const [id,field]=ref.split('#');return (map.get(id)??id)+(field?'#'+field:'');}
function cloneObjects(elements:D[],sourceBlocks:D[]){
 const ids=new Map<string,string>(elements.map(e=>[e.id,uid(e.type)]));const flattened:D[]=[];const visit=(items:D[])=>{for(const b of items){flattened.push(b);visit(b.children??[]);}};visit(sourceBlocks);const blockIds=new Map<string,string>(flattened.map(b=>[b.id,uid('block')]));const nested=new Set(flattened.flatMap(b=>(b.children??[]).map((x:D)=>x.id)));
 const cloneBlock=(b:D):D=>({...copy(b),id:blockIds.get(b.id),...(b.children?{children:b.children.map(cloneBlock)}:{})});const clonedBlocks=sourceBlocks.filter(b=>!nested.has(b.id)).map(cloneBlock);
 const result=copy(elements);for(const e of result){e.id=ids.get(e.id);if(e.contentRef)e.contentRef=remapRef(e.contentRef,blockIds);if(e.children)e.children=e.children.map((id:string)=>ids.get(id)??id);for(const a of ['startAnchor','endAnchor'])if(e[a]){if(ids.has(e[a].elementId))e[a].elementId=ids.get(e[a].elementId);else delete e[a];}if(e.semanticDiagram){const nm=new Map<string,string>(e.semanticDiagram.nodes.map((n:D)=>[n.id,uid('node')]));e.semanticDiagram.nodes.forEach((n:D)=>n.id=nm.get(n.id));e.semanticDiagram.edges?.forEach((a:D)=>{a.id=uid('edge');a.from=nm.get(a.from);a.to=nm.get(a.to);});}}return {elements:result,blocks:clonedBlocks,ids,blockIds};
}
export const editorStore=new EditorStore();
