// PPD is an extensible wire format governed by JSON Schema. External values are
// unknown until runtime validation; D is used only behind that boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type D=Record<string,any>;
export const copy=<T>(value:T):T=>structuredClone(value);
export const uid=(prefix='id')=>prefix+'-'+crypto.randomUUID();
export const box=(x=100,y=100,width=500,height=160)=>({x,y,width,height,rotation:0,unit:'logical'});
export const rich=(text='Ny text')=>({paragraphs:[{id:uid('p'),runs:[{text}]}]});
export const plain=(text:D|string|undefined):string=>typeof text==='string'?text:(text?.paragraphs??[]).map((p:D)=>p.runs.map((r:D)=>r.text).join('')).join('\n');
export function scenes(doc:D):D[]{return [...(doc.masters??[]).flatMap((m:D)=>[m,...(m.layouts??[])]),...(doc.components??[]),...doc.slides.map((s:D)=>s.view)];}
export const allElements=(doc:D):D[]=>scenes(doc).flatMap(s=>s.elements??[]);
export function blocks(slide:D):D[]{const result:D[]=[];const visit=(items:D[])=>{for(const item of items){result.push(item);visit(item.children??[]);}};visit(slide.content.blocks??[]);return result;}
export function textOf(slide:D,element:D){if(!element.contentRef)return element.text??rich('');const [id,field]=element.contentRef.split('#');const b=blocks(slide).find(b=>b.id===id);return b?.[field??'text']??b?.body??b?.title??rich('');}
export function setText(slide:D,element:D,value:D|string){if(element.contentRef){const [id,field]=element.contentRef.split('#');const b=blocks(slide).find(b=>b.id===id);if(b)b[field??'text']=value;}else element.text=value;}
export function masterOf(doc:D,slide:D){return doc.masters?.find((m:D)=>m.id===(slide.masterId??doc.document.defaultMasterId));}
export function layoutOf(doc:D,slide:D){return masterOf(doc,slide)?.layouts?.find((l:D)=>l.id===(slide.layoutId??doc.document.defaultLayoutId));}
export function effective(doc:D,slide:D,element:D):D{
 const binding=slide.placeholderBindings?.find((b:D)=>b.elementId===element.id);
 const ph=layoutOf(doc,slide)?.placeholders?.find((p:D)=>p.id===binding?.placeholderId);
 return {...element,geometry:binding?.overrides?.geometry??ph?.geometry??element.geometry??box(),style:{...(doc.theme.styles?.[ph?.styleRef??element.styleRef]??{}),...element.style,...binding?.overrides?.style}};
}
export function newSlide(doc:D,layout='title'){
 const master=doc.masters?.[0],lo=master?.layouts?.find((l:D)=>l.id===layout)??master?.layouts?.[0];
 const slide:D={id:uid('slide'),title:'Ny bild',content:{blocks:[]},view:{elements:[]},delivery:{speakerNotes:''}};
 if(master&&lo){slide.masterId=master.id;slide.layoutId=lo.id;slide.placeholderBindings=[];for(const ph of lo.placeholders??[]){if(ph.role==='image')continue;const bid=uid('block'),eid=uid('text');slide.content.blocks.push({id:bid,kind:'text',text:rich(ph.role==='title'?'Din rubrik':'Ditt innehåll')});slide.view.elements.push({id:eid,type:'text',geometry:copy(ph.geometry),contentRef:bid+'#text'});slide.placeholderBindings.push({placeholderId:ph.id,elementId:eid});}}
 return slide;
}
export function createDocument():D{
 const doc:D={format:'ppd',schemaVersion:'0.3.1',document:{id:uid('doc'),title:'Min presentation',language:'sv-SE',revision:0,canvas:{width:1600,height:900,unit:'logical'}},theme:{id:'theme',colors:{ink:'#183641',surface:'#faf8f2',accent:'#cf694c'},typography:{body:'Fable'},styles:{heading:{fontSize:72,color:'#183641',fontWeight:700},body:{fontSize:36,color:'#183641'}}},masters:[{id:'master',name:'Grundmaster',background:{type:'color',color:'#faf8f2'},elements:[],layouts:[
 {id:'title',name:'Titel',placeholders:[{id:'title',role:'title',geometry:box(100,200,1400,160),styleRef:'heading'},{id:'body',role:'body',geometry:box(100,450,1200,220),styleRef:'body'}]},
 {id:'content',name:'Innehåll',placeholders:[{id:'title',role:'title',geometry:box(100,70,1400,140),styleRef:'heading'},{id:'body',role:'body',geometry:box(100,300,1400,480),styleRef:'body'}]},
 {id:'columns',name:'Två kolumner',placeholders:[{id:'title',role:'title',geometry:box(100,70,1400,140),styleRef:'heading'},{id:'left',role:'body',geometry:box(100,300,650,480),styleRef:'body'},{id:'right',role:'body',geometry:box(850,300,650,480),styleRef:'body'}]},
 {id:'image-text',name:'Bild + text',placeholders:[{id:'title',role:'title',geometry:box(100,70,1400,140),styleRef:'heading'},{id:'body',role:'body',geometry:box(850,300,650,480),styleRef:'body'},{id:'image',role:'image',geometry:box(100,300,650,480)}]},
 {id:'blank',name:'Tom',placeholders:[]}
 ]}],components:[],slides:[],assets:{},presentation:{navigation:{keyboard:true,touch:true}},provenance:{privacyProfile:'full'}};
 const slide=newSlide(doc);slide.title='En idé att berätta';setText(slide,slide.view.elements[0],rich('En idé. En berättelse.'));setText(slide,slide.view.elements[1],rich('Ge dina tankar en tydlig form.'));doc.slides.push(slide);return doc;
}
