/** SF-NEXT-04b/04c: editor/PPD/PPTX geometry, rotation, embedded image and PDF raster parity.
 * Chromium + pdftoppm are required. No Office rendering is claimed.
 */
import {chromium} from 'playwright';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import sharp from 'sharp';
const execFileAsync=promisify(execFile);
const output=await mkdtemp(path.join(tmpdir(),'sf-export-parity-'));
const port=5209;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
const shapes=[
 {id:'parity-coral',geometry:{x:180,y:170,width:320,height:200,rotation:0,unit:'logical'},fill:'#cf694c'},
 {id:'parity-blue',geometry:{x:950,y:460,width:380,height:230,rotation:0,unit:'logical'},fill:'#2a738b'},
 {id:'parity-rotated',geometry:{x:720,y:170,width:180,height:180,rotation:30,unit:'logical'},fill:'#529944'},
];
const almost=(actual,expected,tolerance,label)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} vs ${expected} (+/- ${tolerance})`);
try{
 await new Promise((resolve,reject)=>{
  let log='';const timer=setTimeout(()=>reject(Error('Vite did not start: '+log)),20000);
  server.stdout.on('data',d=>{log+=String(d);if(log.includes(String(port))){clearTimeout(timer);resolve();}});
  server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exited with '+code));});
 });
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/`);
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const data=await page.evaluate(async specs=>{
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const {normalizePpd040Styles}=await import('/src/core/ppd040Staging.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument();const slide=newSlide(doc,'blank');doc.slides=[slide];
  slide.view.elements=specs.map(spec=>({id:spec.id,type:'shape',shapeType:'rect',geometry:spec.geometry,style:{fill:{color:spec.fill},stroke:{color:spec.fill},strokeWidth:0}}));
  // Deterministic opaque image; unlike the shapes, this must remain a native PPTX picture.
  const canvas=document.createElement('canvas');canvas.width=60;canvas.height=60;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ddbb33';ctx.fillRect(0,0,60,60);
  doc.assets['parity-image']={kind:'image',storage:'embedded',mimeType:'image/png',uri:canvas.toDataURL(),altText:'Paritetsbild'};
  slide.view.elements.push({id:'parity-image-element',type:'image',assetRef:'parity-image',geometry:{x:290,y:490,width:210,height:210,rotation:0,unit:'logical'}});
  normalizePpd040Styles(doc);
  editorStore.load(doc);
  const pdf=await pdfExport(doc,[slide],'editable-first',false);
  const pptx=await pptxExport(doc,[slide],'editable-first',false);
  return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file),canvas:doc.document.canvas,geometry:slide.view.elements.map(e=>({id:e.id,geometry:e.geometry}))};
 },shapes);
 assert.deepEqual(data.geometry.filter(e=>e.id!=='parity-image-element'),shapes.map(({id,geometry})=>({id,geometry})),'Fixture geometry must survive editor loading');
 assert.deepEqual(data.geometry.find(e=>e.id==='parity-image-element')?.geometry,{x:290,y:490,width:210,height:210,rotation:0,unit:'logical'},'Image geometry survives editor loading');
 // Validate on-canvas positions, normalized to the visible slide, independently of zoom.
 const editorRects=await page.evaluate(ids=>{
  const slide=document.querySelector('.stage .slide-render');
  if(!slide)throw Error('Slide render missing');
  const s=slide.getBoundingClientRect();
  return {slide:{x:s.x,y:s.y,width:s.width,height:s.height},objects:ids.map(id=>{
   const e=slide.querySelector(`[data-element-id="${id}"]`);
   if(!e)throw Error('Editor element missing: '+id);
   const r=e.getBoundingClientRect();return {id,x:r.x,y:r.y,width:r.width,height:r.height};
  })};
 },[...shapes.map(s=>s.id),'parity-image-element']);
 for(const shape of shapes){
  const r=editorRects.objects.find(o=>o.id===shape.id),s=editorRects.slide,g=shape.geometry;
  if(g.rotation){
   // getBoundingClientRect includes rotation. Verify the center instead of the unrotated bounding box.
   almost((r.x+r.width/2-s.x)/s.width,(g.x+g.width/2)/1600,.015,shape.id+' editor center x');
   almost((r.y+r.height/2-s.y)/s.height,(g.y+g.height/2)/900,.015,shape.id+' editor center y');
   continue;
  }
  almost((r.x-s.x)/s.width,g.x/1600,.015,shape.id+' editor x');
  almost((r.y-s.y)/s.height,g.y/900,.015,shape.id+' editor y');
  almost(r.width/s.width,g.width/1600,.015,shape.id+' editor width');
  almost(r.height/s.height,g.height/900,.015,shape.id+' editor height');
 }
 const ir=editorRects.objects.find(o=>o.id==='parity-image-element'),ss=editorRects.slide;
 almost((ir.x-ss.x)/ss.width,290/1600,.015,'image editor x');
 almost((ir.y-ss.y)/ss.height,490/900,.015,'image editor y');
 almost(ir.width/ss.width,210/1600,.015,'image editor width');
 console.log('PASS editor geometry matches PPD reference (including rotation and image)');
 const zip=await JSZip.loadAsync(Uint8Array.from(data.pptx));
 const xml=await zip.file('ppt/slides/slide1.xml').async('string');
 const nativeShapes=[...xml.matchAll(/<p:sp>\s*([\s\S]*?)<\/p:sp>/g)].map(m=>{
  const off=m[1].match(/<a:off\s+x="(\d+)"\s+y="(\d+)"\s*\/>/);
  const ext=m[1].match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/);
  return off&&ext?{x:Number(off[1]),y:Number(off[2]),w:Number(ext[1]),h:Number(ext[2]),rotation:Number(m[1].match(/<a:xfrm[^>]*rot="(\d+)"/)?.[1]??0)}:null;
 }).filter(Boolean);
 const emuPerLogical=914400/(1600/13.3333333333);
 for(const shape of shapes){
  const g=shape.geometry;
  const found=nativeShapes.some(p=>Math.abs(p.x-g.x*emuPerLogical)<100&&Math.abs(p.y-g.y*emuPerLogical)<100&&Math.abs(p.w-g.width*emuPerLogical)<100&&Math.abs(p.h-g.height*emuPerLogical)<100);
  assert.ok(found,`${shape.id}: editable native PPTX shape with reference bounds missing`);
  if(g.rotation){const match=nativeShapes.find(p=>Math.abs(p.x-g.x*emuPerLogical)<100&&Math.abs(p.y-g.y*emuPerLogical)<100);assert.ok(match,'Rotated native shape missing');almost(match.rotation,g.rotation*60000,1,'PPTX native shape angle');}
 }
 console.log('PASS PPTX native editable shape positions, extents and rotation');
 const pics=[...xml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/g)].map(m=>m[1]);
 assert.ok(pics.some(pic=>{const off=pic.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/),ext=pic.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);return off&&ext&&Math.abs(Number(off[1])-290*emuPerLogical)<100&&Math.abs(Number(off[2])-490*emuPerLogical)<100&&Math.abs(Number(ext[1])-210*emuPerLogical)<100&&Math.abs(Number(ext[2])-210*emuPerLogical)<100;}),'PPTX must contain native editable image with expected bounds');
 // Check the image relationship and target bytes, rather than guessing the media filename.
 const pictureRelIds=pics.map(pic=>pic.match(/<a:blip\s+[^>]*r:embed="([^"]+)"/)?.[1]).filter(Boolean);
 assert.ok(pictureRelIds.length>0,'PPTX picture must refer to embedded media');
 const slideRels=await zip.file('ppt/slides/_rels/slide1.xml.rels')?.async('string');
 assert.ok(slideRels,'PPTX slide relationship part is required for pictures');
 for(const relId of pictureRelIds){
  const rel=slideRels.match(new RegExp('<Relationship\\b(?=[^>]*\\bId="'+relId+'")(?=[^>]*\\bTarget="([^"]+)")[^>]*/>'));
  assert.ok(rel,`PPTX picture relationship ${relId} must resolve to media`);
  const mediaPath=path.posix.normalize(path.posix.join('ppt/slides',rel[1].replace(/^\//,'')));
  const imageFile=zip.file(mediaPath);
  assert.ok(imageFile,`PPTX embedded image file missing: ${mediaPath}`);
  const bytes=await imageFile.async('uint8array');
  const png=bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const jpeg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  assert.ok(png||jpeg,`PPTX embedded picture has unsupported bytes: ${mediaPath}`);
 }
 console.log('PASS PPTX native image bounds and embedded media');
 const pdfPath=path.join(output,'parity.pdf'),pngBase=path.join(output,'parity');
 await writeFile(pdfPath,Uint8Array.from(data.pdf));
 await execFileAsync('pdftoppm',['-f','1','-l','1','-singlefile','-png','-scale-to-x','1600','-scale-to-y','900',pdfPath,pngBase]);
 const raster=await sharp(pngBase+'.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=raster.info;
 const pixel=(x,y)=>{const p=(Math.floor(y)*width+Math.floor(x))*channels;return [...raster.data.subarray(p,p+3)];};
 for(const shape of shapes){
  const g=shape.geometry,expected=[1,3,5].map((_,i)=>Number.parseInt(shape.fill.slice(1+i*2,3+i*2),16));
  const actual=pixel((g.x+g.width/2)*width/1600,(g.y+g.height/2)*height/900);
  assert.ok(actual.every((v,i)=>Math.abs(v-expected[i])<12),`${shape.id}: PDF pixel at center ${actual} != ${expected}`);
 }
 const imagePixel=pixel(395*width/1600,595*height/900);
 assert.ok(imagePixel.every((v,i)=>Math.abs(v-[221,187,51][i])<14),'PDF embedded image must render with reference color: '+imagePixel);
 console.log('PASS PDF embedded image rendered at reference location');
 const outside=pixel(750*width/1600,430*height/900);
 assert.ok(outside.every(v=>v>210),'PDF empty area should remain light (detects oversized or misplaced shapes)');
 console.log('PASS PDF rendered pixel locations, dimensions '+width+'x'+height);
 assert.deepEqual(pageErrors,[],'Browser must not report page errors');
}finally{
 await browser?.close();server.kill('SIGTERM');await rm(output,{recursive:true,force:true});
}
