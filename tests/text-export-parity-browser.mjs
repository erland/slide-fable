/** Visual regression for native editable text in PDF and PPTX.
 * Requires Chromium and pdftoppm (already installed by verify CI).
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import JSZip from 'jszip';
const execFileAsync=promisify(execFile);
const output=path.resolve(process.env.EDITOR_OUTPUT??'../editor-evidence');
await mkdir(output,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5197','--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{
  let message='';
  const timeout=setTimeout(()=>reject(Error('Vite timed out: '+message)),20000);
  server.stdout.on('data',b=>{message+=String(b);if(message.includes('5197')){clearTimeout(timeout);resolve();}});
  server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exited '+code+': '+message));});
 });
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5197/');
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const data=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const {measure,flatten}=await import('/src/export/officeShared.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=doc.slides[0];
  slide.view.elements=[
   {id:'export-text-fit',type:'text',geometry:{x:150,y:140,width:400,height:95},style:{fontSize:50,color:'#183641',fontFamily:'Fable'},text:{overflow:'shrink-to-fit',paragraphs:[
    {id:'p-one',runs:[{text:'Lång rubrik ÅÄÖ och test av radbrytning med flera ord',marks:{bold:true}}]},
    {id:'p-two',runs:[{text:'Andra raden med kursiv text och fortsatt radbrytning',marks:{italic:true}}]}
   ]}}
  ];
  editorStore.load(doc);
  const element=flatten(doc,slide).find(e=>e.id==='export-text-fit');
  const fragments=await measure(doc,slide,element);
  const pdf=await pdfExport(doc,[slide],'editable-first',false);
  const pptx=await pptxExport(doc,[slide],'editable-first',false);
  return {fragments,geometry:element.geometry,pdf:Array.from(pdf.file),pptx:Array.from(pptx.file)};
 });
 assert.ok(data.fragments.length>=2,'The PDF/PPTX measuring pipeline must preserve multiple text fragments');
 assert.ok(data.fragments.some(f=>f.bold)&&data.fragments.some(f=>f.italic),'Mixed rich-text styles must survive fragment measurement');
 const slide=page.locator('.stage .slide-render').first();
 await slide.locator('[data-element-id="export-text-fit"]').waitFor();
 await page.waitForFunction(()=>{
  const el=document.querySelector('.stage [data-element-id="export-text-fit"] .text-fit-content');
  return Boolean(el&&new DOMMatrixReadOnly(getComputedStyle(el).transform).a<.99);
 });
 const screenshot=await slide.screenshot({animations:'disabled',caret:'hide'});
 await writeFile(path.join(output,'text-parity-editor.png'),screenshot);
 const pdfPath=path.join(output,'text-parity.pdf'),prefix=path.join(output,'text-parity-pdf');
 await writeFile(pdfPath,Uint8Array.from(data.pdf));
 await execFileAsync('pdftoppm',['-f','1','-l','1','-singlefile','-png','-r','120',pdfPath,prefix]);
 const editor=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const rendered=await sharp(prefix+'.png').resize(editor.info.width,editor.info.height,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 // Ink is segmented only in the fixture text zone; the comparison tolerates
 // font-rasterizer antialiasing but catches missing, oversized or displaced text.
 function bounds(data,width,height){
  let x0=width,y0=height,x1=0,y1=0,pixels=0;
  const crop={x:130/1600*width,y:115/900*height,w:470/1600*width,h:220/900*height};
  for(let y=Math.max(0,Math.floor(crop.y));y<Math.min(height,Math.ceil(crop.y+crop.h));y++)
   for(let x=Math.max(0,Math.floor(crop.x));x<Math.min(width,Math.ceil(crop.x+crop.w));x++){
    const i=(y*width+x)*3;
    if(data[i]<145&&data[i+1]<160&&data[i+2]<165){
     x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);pixels++;
    }
   }
  return {x0,y0,x1,y1,pixels,width:x1-x0+1,height:y1-y0+1,cx:(x0+x1)/2,cy:(y0+y1)/2};
 }
 const a=bounds(editor.data,editor.info.width,editor.info.height),b=bounds(rendered.data,rendered.info.width,rendered.info.height);
 const metrics={editor:a,pdf:b,centerError:Math.hypot(a.cx-b.cx,a.cy-b.cy),widthRatio:b.width/a.width,heightRatio:b.height/a.height,inkRatio:b.pixels/a.pixels};
 await writeFile(path.join(output,'text-parity-metrics.json'),JSON.stringify(metrics,null,2));
 assert.ok(a.pixels>200&&b.pixels>200,'Text must have measurable ink in editor and PDF');
 assert.ok(metrics.centerError<32,'PDF text is displaced relative to editor: '+JSON.stringify(metrics));
 assert.ok(metrics.widthRatio>.65&&metrics.widthRatio<1.5,'PDF text width differs substantially: '+JSON.stringify(metrics));
 assert.ok(metrics.heightRatio>.65&&metrics.heightRatio<1.5,'PDF text height differs substantially: '+JSON.stringify(metrics));
 assert.ok(metrics.inkRatio>.35&&metrics.inkRatio<2.7,'PDF text ink quantity differs substantially: '+JSON.stringify(metrics));
 console.log('PASS editor-vs-native-PDF: text ink position and extent');

 const zip=await JSZip.loadAsync(Uint8Array.from(data.pptx));
 const xml=await zip.file('ppt/slides/slide1.xml').async('string');
 assert.ok(xml.includes('ÅÄÖ')||xml.includes('&#'),'PPTX must contain editable Swedish text runs');
 assert.ok(xml.includes('Lång rubrik')&&xml.includes('Andra raden'),'PPTX must preserve text as native runs');
 const sizeAttributes=[...xml.matchAll(/\bsz="(\d+)"/g)].map(m=>Number(m[1])/100);
 const units=1600/13.3333333333,factor=72/units;
 assert.ok(data.fragments.some(f=>sizeAttributes.some(n=>Math.abs(n-f.size*factor)<.6)),'PPTX native font size must match measured scaled text');
 console.log('PASS native-PPTX: rich text runs and scaled font sizes');
 assert.deepEqual(errors,[],'No page errors during exports');
}catch(error){console.error('FAIL text-export-visual-parity:',error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
