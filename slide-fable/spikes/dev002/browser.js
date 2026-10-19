import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import PptxGenJS from 'pptxgenjs';
import DOMPurify from 'dompurify';
import katex from 'katex';
import {Editor,Extension} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

const W=1600,H=900,point=0.6;
const encoder=new TextEncoder();
function bytes(b64){return Uint8Array.from(atob(b64),c=>c.charCodeAt(0));}
const fonts={regular:bytes(window.SPIKE_FONTS.regular),bold:bytes(window.SPIKE_FONTS.bold)};
const g=(x,y,width,height)=>({x,y,width,height});
const text=(id,value,geometry,size=36,bold=false)=>({id,type:'text',geometry,style:{fontSize:size,color:'#142533'},text:{paragraphs:[{id:id+'-p',runs:[{text:value,marks:{bold}}]}]}});
const model={format:'ppd',schemaVersion:'0.3.1',document:{id:'dev002-spike',title:'Slide Fable – exportprov',canvas:{width:W,height:H,unit:'logical'}},theme:{id:'spike'},slides:[
 {id:'s1',content:{},view:{elements:[text('title','Slide Fable',g(100,110,1380,100),70,true),text('lead','Sökbar svensk text: åäö ÅÄÖ – räksmörgås.',g(100,280,1380,100),36),text('wrap','Långa texter behöver samma radbrytning i webbläsaren och vid export. Detta prov använder uppmätta textrader i stället för att låta varje exportmotor gissa layouten.',g(100,430,1000,250),36)]}},
 {id:'s2',content:{},view:{elements:[text('title2','Redigerbara objekt',g(100,80,1380,100),60,true),{id:'shape1',type:'shape',geometry:g(100,250,420,170),style:{fill:{color:'#c9e3e5'}}},text('shape-label','Beslut',g(130,300,360,80),40,true),{id:'table1',type:'table',geometry:g(680,250,800,240),cells:[[{id:'c1',text:'Objekt',header:true},{id:'c2',text:'Värde',header:true}],[{id:'c3',text:'Rubrik'},{id:'c4',text:'Ändra mig'}]]},text('hint','Text, form och tabell exporteras som egna Office-objekt.',g(100,640,1380,120),32)]}},
 {id:'s3',content:{},view:{elements:[{id:'glass',type:'shape',geometry:g(90,170,1420,540),effects:[{type:'backdropBlur',radius:22}]},text('glass-title','Glaseffekt med redigerbar text',g(150,240,1280,120),60,true),text('glass-body','Bakgrund och effekt blir ett separat bildlager. Rubriken förblir text i PDF och PPTX.',g(150,420,1160,200),36)]}}
],assets:{},presentation:{}};
model.slides[2].view.background={type:'gradient',style:{fill:{gradient:{type:'linear',stops:[{offset:0,color:'#073b51'},{offset:.45,color:'#42a4ad'},{offset:.7,color:'#b4a7cc'},{offset:1,color:'#132e4e'}]}}}};

function paragraphDOM(p){
 const node=document.createElement('p');
 for(const run of p.runs){const span=document.createElement('span');span.textContent=run.text;span.dataset.bold=String(Boolean(run.marks?.bold));span.style.fontWeight=run.marks?.bold?'700':'400';if(run.marks?.italic)span.style.fontStyle='italic';node.append(span);}
 return node;
}
function background(slide){
 if(slide.view.background?.type==='gradient')return 'linear-gradient(125deg,'+slide.view.background.style.fill.gradient.stops.map(s=>s.color+' '+s.offset*100+'%').join(',')+')';
 return '#ffffff';
}
function render(slide){
 const stage=document.createElement('div');stage.className='stage';stage.dataset.slide=slide.id;stage.style.background=background(slide);
 for(const el of slide.view.elements){const node=document.createElement('div');node.dataset.id=el.id;const box=el.geometry;Object.assign(node.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
  if(el.type==='text'){node.className='text';node.style.fontSize=el.style.fontSize+'px';node.style.color=el.style.color;el.text.paragraphs.forEach(p=>node.append(paragraphDOM(p)));}
  if(el.type==='shape'){node.className='shape';if(el.effects){Object.assign(node.style,{background:'rgba(255,255,255,.65)',backdropFilter:'blur(22px)',border:'2px solid rgba(255,255,255,.7)',borderRadius:'24px'});}else node.style.background=el.style.fill.color;}
  if(el.type==='table'){node.className='shape';node.style.display='grid';node.style.gridTemplateRows=`repeat(${el.cells.length},1fr)`;for(const row of el.cells){const r=document.createElement('div');r.style.display='grid';r.style.gridTemplateColumns=`repeat(${row.length},1fr)`;for(const cell of row){const c=document.createElement('div');c.textContent=cell.text;Object.assign(c.style,{border:'1px solid #84939d',padding:'20px',fontSize:'32px',background:cell.header?'#e8f0f3':'#fff'});r.append(c);}node.append(r);}}
  stage.append(node);
 }
 return stage;
}
function measureText(stage){
 const fragments=[];
 for(const node of stage.querySelectorAll('.text')){
  const el=model.slides.flatMap(s=>s.view.elements).find(e=>e.id===node.dataset.id);
  for(const span of node.querySelectorAll('span')){
   const str=span.firstChild;if(!str)continue;let current=null;
   for(let i=0;i<str.length;i++){
    const range=document.createRange();range.setStart(str,i);range.setEnd(str,i+1);const rect=range.getBoundingClientRect(),parent=stage.getBoundingClientRect();
    const x=rect.x-parent.x,y=rect.y-parent.y;
    if(current&&Math.abs(current.y-y)<.5){current.text+=str.textContent[i];current.width=rect.right-parent.x-current.x;}
    else{current={elementId:el.id,text:str.textContent[i],x,y,width:rect.width,size:el.style.fontSize,bold:span.dataset.bold==='true',color:el.style.color};fragments.push(current);}
   }
  }
 }
 return fragments;
}
function canvasBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}
async function base64(blob){return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});}
async function effectLayer(slide){
 // Explicit visual fallback for this spike, not a claimed general CSS rasterizer.
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');const grad=ctx.createLinearGradient(0,0,W,H);for(const stop of slide.view.background.style.fill.gradient.stops)grad.addColorStop(stop.offset,stop.color);ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);const panel=slide.view.elements.find(e=>e.effects),b=panel.geometry;ctx.fillStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.roundRect(b.x,b.y,b.width,b.height,24);ctx.fill();return new Uint8Array(await (await canvasBlob(c)).arrayBuffer());
}
const report=[];
function addReport(format,slide,el,status,reason){report.push({format,slideId:slide.id,elementId:el.id,status,reason});}
async function pdf(){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const normal=await doc.embedFont(fonts.regular,{subset:true});const bold=await doc.embedFont(fonts.bold,{subset:true});
 for(const slide of model.slides){const page=doc.addPage([W*point,H*point]);
  if(slide.id==='s3'){const img=await doc.embedPng(await effectLayer(slide));page.drawImage(img,{x:0,y:0,width:W*point,height:H*point});}
  for(const el of slide.view.elements){const b=el.geometry;
   if(el.type==='shape'){if(!el.effects)page.drawRectangle({x:b.x*point,y:(H-b.y-b.height)*point,width:b.width*point,height:b.height*point,color:rgb(.788,.89,.898)});addReport('pdf',slide,el,el.effects?'rasterized':'native',el.effects?'Spike effect approximation; not general backdrop parity':'');}
   if(el.type==='table'){for(let r=0;r<el.cells.length;r++)for(let col=0;col<el.cells[r].length;col++){const x=b.x+col*b.width/2,y=b.y+r*b.height/2;page.drawRectangle({x:x*point,y:(H-y-b.height/2)*point,width:b.width/2*point,height:b.height/2*point,borderWidth:point,borderColor:rgb(.5,.57,.61),color:el.cells[r][col].header?rgb(.91,.94,.95):rgb(1,1,1)});page.drawText(el.cells[r][col].text,{x:(x+20)*point,y:(H-y-52)*point,size:32*point,font:normal});}addReport('pdf',slide,el,'native','Text and cell vectors');}
  }
  for(const f of layouts[slide.id]){page.drawText(f.text,{x:f.x*point,y:(H-f.y-f.size*.93)*point,size:f.size*point,font:f.bold?bold:normal,color:rgb(.078,.145,.2)});}
  for(const el of slide.view.elements.filter(e=>e.type==='text'))addReport('pdf',slide,el,'native','Measured line fragments; searchable embedded font');
 }
 doc.setTitle(model.document.title);return doc.save();
}
async function pptx(){
 const p=new PptxGenJS();p.defineLayout({name:'SPIKE',width:13.3333333333,height:7.5});p.layout='SPIKE';p.author='Slide Fable';p.title=model.document.title;p.subject='DEV-002 technical export proof';
 for(const slide of model.slides){const s=p.addSlide();
  if(slide.id==='s3')s.addImage({data:'image/png;base64,'+await base64(new Blob([await effectLayer(slide)])),x:0,y:0,w:W/120,h:H/120});
  for(const el of slide.view.elements){const b=el.geometry;
   if(el.type==='shape'){if(!el.effects)s.addShape(p.ShapeType.rect,{x:b.x/120,y:b.y/120,w:b.width/120,h:b.height/120,fill:{color:'C9E3E5'},line:{color:'C9E3E5'},objectName:el.id});addReport('pptx',slide,el,el.effects?'rasterized':'native',el.effects?'Spike effect approximation; text separately editable':'');}
   if(el.type==='table'){s.addTable(el.cells.map(row=>row.map(c=>({text:c.text,options:{bold:Boolean(c.header)}}))),{x:b.x/120,y:b.y/120,w:b.width/120,h:b.height/120,fontFace:'DejaVu Sans',fontSize:32*point,border:{type:'solid',pt:1,color:'84939D'},margin:12,autoPage:false});addReport('pptx',slide,el,'native','Native OOXML table');}
  }
  for(const f of layouts[slide.id])s.addText(f.text,{x:f.x/120,y:f.y/120,w:(f.width+8)/120,h:f.size*1.35/120,fontFace:'DejaVu Sans',fontSize:f.size*point,bold:f.bold,margin:0,breakLine:false,color:'142533',objectName:f.elementId});
  for(const el of slide.view.elements.filter(e=>e.type==='text'))addReport('pptx',slide,el,'native','Measured lines as separate textboxes; font substitution possible in Office');
 }
 return new Uint8Array(await p.write({outputType:'arraybuffer',compression:true}));
}
function download(data,name,mime){const url=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

const Attributes=Extension.create({name:'ppdAttributes',addGlobalAttributes(){return [{types:['paragraph'],attributes:{ppdId:{default:null},ppdStyle:{default:null}}}];}});
const rich={paragraphs:[{id:'p-rich',paragraphStyle:{align:'left'},runs:[{text:'Rik text med '},{text:'fetstil',marks:{bold:true}},{text:' och en länk',link:'https://example.org'}]}]};
function toPM(input){return {type:'doc',content:input.paragraphs.map(p=>({type:'paragraph',attrs:{ppdId:p.id,ppdStyle:p.paragraphStyle??null},content:p.runs.map(r=>({type:'text',text:r.text,marks:[...Object.entries(r.marks??{}).filter(([,v])=>v).map(([type])=>({type})),...(r.link?[{type:'link',attrs:{href:r.link}}]:[])]}))}))};}
function fromPM(input){return {paragraphs:input.content.map((p,i)=>({id:p.attrs.ppdId??'new-'+i,...(p.attrs.ppdStyle?{paragraphStyle:p.attrs.ppdStyle}:{}),runs:(p.content??[]).map(r=>({text:r.text??'',...(r.marks?.some(m=>m.type!=='link')?{marks:Object.fromEntries(r.marks.filter(m=>m.type!=='link').map(m=>[m.type,true]))}:{}),...(r.marks?.find(m=>m.type==='link')?{link:r.marks.find(m=>m.type==='link').attrs.href}:{})}))}))};}
function sanitizeSVG(source){
 if(/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('UNSAFE_SVG');
 const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
 if(parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')throw Error('UNSAFE_SVG');
 for(const e of parsed.querySelectorAll('*')){if(['script','foreignObject','style','image','use','animate','set'].includes(e.localName))throw Error('UNSAFE_SVG');for(const a of e.attributes)if(/^on/i.test(a.name)||/href|src|style/i.test(a.name)||/url\(\s*[^#]/i.test(a.value))throw Error('UNSAFE_SVG');}
 return DOMPurify.sanitize(source,{USE_PROFILES:{svg:true,svgFilters:false},FORBID_TAGS:['foreignObject','style','image','use','animate','set'],FORBID_ATTR:['href','xlink:href','style']});
}
function mathml(source){return DOMPurify.sanitize(source,{ALLOWED_TAGS:['math','mrow','mi','mn','mo','msup','msub','mfrac','msqrt','mtext'],ALLOWED_ATTR:['xmlns','display'],PARSER_MEDIA_TYPE:'application/xhtml+xml'});}
function latex(source){if(source.length>10000||/\\(?:includegraphics|href|url|html[A-Za-z]*|def|gdef|newcommand|renewcommand)\b/.test(source))throw Error('UNSAFE_LATEX');return katex.renderToString(source,{throwOnError:true,trust:false,strict:'error',maxExpand:100,maxSize:20,output:'mathml'});}
const editor=new Editor({element:document.getElementById('editor'),extensions:[StarterKit.configure({link:{openOnClick:false}}),Attributes],content:toPM(rich)});
const layouts={};
async function init(){
 await document.fonts.ready;
 for(const slide of model.slides){const hidden=render(slide);document.getElementById('measure').append(hidden);layouts[slide.id]=measureText(hidden);const preview=document.createElement('div');preview.className='preview';preview.append(render(slide));document.getElementById('previews').append(preview);}
 const resize=()=>{for(const p of document.querySelectorAll('.preview'))p.firstElementChild.style.transform=`scale(${p.clientWidth/W})`;};resize();window.addEventListener('resize',resize);
 document.getElementById('pdf').onclick=async()=>download(await pdf(),'slide-fable-dev002.pdf','application/pdf');
 document.getElementById('pptx').onclick=async()=>download(await pptx(),'slide-fable-dev002.pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation');
 window.spike={model,layouts,pdf,pptx,report,toPM,fromPM,rich,editor,sanitizeSVG,mathml,latex};
 document.getElementById('status').textContent='Redo – lokal textlayout och export utan nätresurser.';
}
init().catch(e=>{document.getElementById('status').textContent=e.message;throw e;});
