import {copy,newSlide,createDocument,effective,layoutOf,rich,uid,type D} from './model.ts';

export type ThemeChoice={id:string;name:string;ink:string;surface:string;accent:string;headingFont:string;bodyFont:string};
export const themeChoices:ThemeChoice[]=[
 {id:'fable',name:'Fable',ink:'#183641',surface:'#faf8f2',accent:'#cf694c',headingFont:'Georgia',bodyFont:'Fable'},
 {id:'midnight',name:'Midnatt',ink:'#f5f7fa',surface:'#173944',accent:'#efbb75',headingFont:'Georgia',bodyFont:'Fable'},
 {id:'clear',name:'Klarblå',ink:'#16324f',surface:'#f4f8fc',accent:'#236cb0',headingFont:'Arial',bodyFont:'Arial'}
];
export function applyThemeChoice(doc:D,choice:ThemeChoice){
 for(const color of [choice.ink,choice.surface,choice.accent])if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color))throw Error('INVALID_THEME_COLOR');
 for(const font of [choice.headingFont,choice.bodyFont])if(typeof font!=='string'||!font.trim()||font.length>200)throw Error('INVALID_THEME_FONT');
 const oldSurface=doc.theme.colors?.surface;
 doc.theme.colors={...doc.theme.colors,ink:choice.ink,surface:choice.surface,accent:choice.accent};
 doc.theme.typography={...doc.theme.typography,body:choice.bodyFont};
 doc.theme.styles={...doc.theme.styles,heading:{...doc.theme.styles?.heading,color:choice.ink,fontFamily:choice.headingFont},body:{...doc.theme.styles?.body,color:choice.ink,fontFamily:choice.bodyFont}};
 for(const master of doc.masters??[])for(const scene of [master,...master.layouts??[]])if(scene.background?.type==='color'&&scene.background.color===oldSurface)scene.background.color=choice.surface;
}
/** A new, portable PPD document containing the design, without source slide content. */
export function designTemplate(source:D):D{
 const doc=createDocument();
 doc.document={...doc.document,id:uid('document'),title:source.document.title+' – designmall',canvas:copy(source.document.canvas),language:source.document.language??'sv-SE'};
 doc.theme=copy(source.theme);doc.masters=copy(source.masters??[]);
 const needed=new Set<string>();
 const scan=(value:unknown,key:string,visit:(id:string)=>void)=>{
  if(Array.isArray(value))value.forEach(v=>scan(v,key,visit));
  else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){
   if(k===key&&typeof v==='string')visit(v);else scan(v,key,visit);
  }
 };
 scan(doc.masters,'componentId',id=>needed.add(id));
 let count=-1;while(count!==needed.size){count=needed.size;for(const c of source.components??[])if(needed.has(c.id))scan(c,'componentId',id=>needed.add(id));}
 doc.components=copy((source.components??[]).filter((c:D)=>needed.has(c.id)));
 doc.assets={};
 for(const key of ['assetRef','fallbackAssetRef','posterAssetRef','renderedAssetRef','captionsAssetRef'])scan([doc.masters,doc.components,doc.theme],key,id=>{if(source.assets[id])doc.assets[id]=copy(source.assets[id]);});
 doc.slides=[newSlide(doc,doc.masters[0]?.layouts?.[0]?.id??'blank')];
 return doc;
}

/** Keep layout-managed text identities reusable across layout switches.
 * Only objects previously attached to a placeholder are eligible for reattachment;
 * ordinary user-inserted text and shapes are never appropriated by the layout.
 */
export function applySlideLayout(d:D,s:D,layoutId:string){
 const master=d.masters.find((m:D)=>m.id===(s.masterId??d.document.defaultMasterId))??d.masters[0];
 const old=layoutOf(d,s),next=master?.layouts.find((l:D)=>l.id===layoutId);
 if(!next)throw Error('Layouten saknas');
 const used=new Set<string>(),bindings:D[]=[];
 const activeElements=new Set<string>();
 const remember=(element:D,placeholder:D)=>{
  element.extensions={...element.extensions,slideFableLayoutRole:placeholder.role,slideFableLayoutSlot:placeholder.id};
 };
 for(const binding of s.placeholderBindings??[]){
  const e=s.view.elements.find((item:D)=>item.id===binding.elementId);
  if(!e)continue;
  const rendered=effective(d,s,e);
  const previous=old?.placeholders?.find((p:D)=>p.id===binding.placeholderId);
  const target=next.placeholders?.find((p:D)=>p.role===previous?.role&&!used.has(p.id));
  if(target){
   const b=copy(binding);b.placeholderId=target.id;
   if(b.overrides)delete b.overrides.geometry;
   bindings.push(b);used.add(target.id);activeElements.add(e.id);
   remember(e,target);
  }else{
   // Detach rather than delete an unmatched object. Retain its last layout
   // role and slot for later reattachment, even after a blank layout.
   e.geometry=copy(rendered.geometry);e.style=copy(rendered.style);
   if(previous)remember(e,previous);
  }
 }
 for(const placeholder of next.placeholders??[]){
  if(used.has(placeholder.id)||placeholder.role==='image')continue;
  // Prefer the exact prior slot over a generic role match. This restores
  // the right-hand column rather than creating another empty text box.
  const candidates=s.view.elements.filter((e:D)=>e.type==='text'&&!activeElements.has(e.id)&&
   e.extensions?.slideFableLayoutRole===placeholder.role);
  const existing=candidates.find((e:D)=>e.extensions?.slideFableLayoutSlot===placeholder.id)??candidates[0];
  if(existing){
   bindings.push({placeholderId:placeholder.id,elementId:existing.id});
   used.add(placeholder.id);activeElements.add(existing.id);
   remember(existing,placeholder);
   continue;
  }
  const blockId=uid('block'),id=uid('text');
  s.content.blocks.push({id:blockId,kind:'text',text:rich(placeholder.role==='title'?'Din rubrik':'Ditt innehåll')});
  s.view.elements.push({id,type:'text',geometry:copy(placeholder.geometry),contentRef:blockId+'#text',
   extensions:{slideFableLayoutRole:placeholder.role,slideFableLayoutSlot:placeholder.id}});
  bindings.push({placeholderId:placeholder.id,elementId:id});
  used.add(placeholder.id);activeElements.add(id);
 }
 s.masterId=master.id;s.layoutId=layoutId;s.placeholderBindings=bindings;
}
