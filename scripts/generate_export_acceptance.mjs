/**
 * SF-QUAL-07: generate a repeatable acceptance package from the real export
 * engines. Structural checks are not Office/Preview acceptance.
 *
 * Usage: npm run acceptance:export
 * Output: EDITOR_OUTPUT/export-acceptance/ or ./export-acceptance/
 */
import {chromium} from 'playwright';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {PDFDocument} from 'pdf-lib';
import sharp from 'sharp';

const execFileAsync=promisify(execFile);
const port=5237;
const output=path.resolve(process.env.EDITOR_OUTPUT??'.','export-acceptance');
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const slidePart=name=>/^ppt\/slides\/slide[0-9]+[.]xml$/.test(name);
try{
 await new Promise((resolve,reject)=>{
  let log='';
  const timeout=setTimeout(()=>reject(Error('Vite startup timeout: '+log)),20000);
  server.stdout.on('data',data=>{log+=String(data);if(log.includes(String(port))){clearTimeout(timeout);resolve();}});
  server.stderr.on('data',data=>{log+=String(data);});
  server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exited: '+code+' '+log));});
 });
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1});
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto('http://127.0.0.1:'+port+'/');
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const result=await page.evaluate(async()=>{
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {normalizePpd040Styles}=await import('/src/core/ppd040Staging.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const {validateFull}=await import('/src/core/contract.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createDocument();
  doc.document.id='sf-acceptance-07';
  doc.document.title='Slide Fable – exportacceptans';
  doc.document.revision=0;
  const makeSlide=(id,title)=>{
   const s=newSlide(doc,'blank');
   s.id=id;s.title=title;s.view.elements=[];
   s.view.background={type:'color',color:'#FFFFFF'};
   return s;
  };
  const text=(id,x,y,w,h,content,size=36)=>({
   id,type:'text',geometry:{x,y,width:w,height:h,rotation:0,unit:'logical'},
   style:{fontSize:size,color:'#183641',fontFamily:'Fable'},
   text:{overflow:'shrink-to-fit',paragraphs:[{id:id+'-paragraph',runs:[{text:content}]}]}
  });
  const shape=(id,x,y,w,h,fill)=>({
   id,type:'shape',shapeType:'rect',
   geometry:{x,y,width:w,height:h,rotation:0,unit:'logical'},
   style:{fill:{color:fill},stroke:{color:'#183641'},strokeWidth:3}
  });
  const intro=makeSlide('accept-01','Text och former');
  intro.view.elements=[
   shape('accept-shape-background',90,90,1420,720,'#E7EEE9'),
   text('accept-title',135,125,1280,100,'Exportacceptans ÅÄÖ',64),
   text('accept-wrapped',145,300,1250,180,'Lång svensk text med radbrytning – kontrollera typsnitt, placering och redigerbarhet.',43),
   shape('accept-color-block',1040,585,250,130,'#CF694C')
  ];
  const imageSlide=makeSlide('accept-02','Inbäddad bild och grafik');
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=200;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#387F89';ctx.fillRect(0,0,320,200);
  ctx.fillStyle='#D5AF60';ctx.fillRect(35,40,120,120);
  ctx.fillStyle='#F8F8F8';ctx.fillRect(195,55,90,90);
  doc.assets['accept-image']={kind:'image',storage:'embedded',mimeType:'image/png',uri:canvas.toDataURL('image/png'),altText:'Testbild med tre färgade ytor'};
  imageSlide.view.elements=[
   text('accept-image-title',110,80,1350,105,'Bild och objektposition',55),
   {id:'accept-image-element',type:'image',assetRef:'accept-image',geometry:{x:150,y:265,width:770,height:480,rotation:0,unit:'logical'}},
   shape('accept-side-shape',1030,300,330,260,'#DCE9E3')
  ];
  const dataSlide=makeSlide('accept-03','Tabell och diagram');
  dataSlide.view.elements=[
   text('accept-data-title',90,50,1410,90,'Tabeller och diagram',55),
   {id:'accept-table',type:'table',geometry:{x:80,y:190,width:600,height:435,rotation:0,unit:'logical'},
    style:{fontSize:26},
    tableLayout:{columnWidths:[300,300],rowHeights:[135,150,150],cellPadding:12},
    cells:[
     [{id:'accept-head',text:'Regioner',header:true,colSpan:2,style:{fill:{color:'#DCE9E3'},color:'#183641'}}],
     [{id:'accept-north',text:'Norr'},{id:'accept-north-value',text:'42'}],
     [{id:'accept-south',text:'Söder'},{id:'accept-south-value',text:'73'}]
    ]},
   {id:'accept-chart',type:'chart',chartType:'bar',
    geometry:{x:820,y:185,width:620,height:490,rotation:0,unit:'logical'},
    dataset:{categories:['Norr','Söder'],series:[{id:'accept-series',name:'Antal',values:[42,73]}]}}
  ];
  doc.slides=[intro,imageSlide,dataSlide];
  normalizePpd040Styles(doc);
  await validateFull(doc);
  const pdf=await pdfExport(doc,doc.slides,'editable-first',false);
  const pptx=await pptxExport(doc,doc.slides,'editable-first',false);
  // Load the same PPD into the real editor after both exports complete.
  // Screenshots below are taken from the actual presentation canvas, not PDF.
  editorStore.load(doc);
  return {doc,pdf:Array.from(pdf.file),pptx:Array.from(pptx.file)};
 });
 const source=Buffer.from(JSON.stringify(result.doc,null,2)+'\n');
 const pdf=Buffer.from(result.pdf),pptx=Buffer.from(result.pptx);
 const pdfDoc=await PDFDocument.load(pdf);
 const zipped=await JSZip.loadAsync(pptx);
 const slides=Object.keys(zipped.files).filter(slidePart).sort();
 assert.equal(result.doc.slides.length,3);
 assert.equal(pdfDoc.getPageCount(),3,'Exported PDF must have three pages');
 assert.equal(slides.length,3,'Exported PPTX must have three slides');
 const slideContents=await Promise.all(slides.map(name=>zipped.file(name).async('string')));
 assert.ok(slideContents.some(xml=>xml.includes('ÅÄÖ')),'Swedish text should be editable in PPTX');
 assert.ok(slideContents.some(xml=>xml.includes('<a:tbl>')),'Editable table should exist in PPTX');
 assert.ok(slideContents.some(xml=>xml.includes('<c:chart')),'Editable chart should exist in PPTX');
 assert.ok(slideContents.some(xml=>xml.includes('<p:pic>')),'Embedded image should exist in PPTX');
 await mkdir(output,{recursive:true});
 const files={'acceptance.ppd.json':source,'acceptance.pdf':pdf,'acceptance.pptx':pptx};
 for(const [name,bytes] of Object.entries(files))await writeFile(path.join(output,name),bytes);
 // Derive fixed-size reference images from the exact PDF included in this pack.
 // These aid manual comparison; they are not a second, independent renderer.
 const rasterPrefix=path.join(output,'pdf-reference');
 await execFileAsync('pdftoppm',['-f','1','-l','3','-png','-scale-to-x','1280','-scale-to-y','720',path.join(output,'acceptance.pdf'),rasterPrefix]);
 const previews=[];
 for(let number=1;number<=3;number++){
  const name='pdf-reference-'+number+'.png';
  const bytes=await readFile(path.join(output,name));
  const raster=sharp(bytes),metadata=await raster.metadata();
  assert.equal(metadata.width,1280,name+': width must match the reference canvas');
  assert.equal(metadata.height,720,name+': height must match the reference canvas');
  const stats=await raster.stats();
  assert.ok(stats.channels.some(channel=>channel.stdev>3),name+': PDF page must contain visible content');
  files[name]=bytes;
  previews.push({slideId:result.doc.slides[number-1].id,file:name,derivedFrom:'acceptance.pdf'});
 }
 // Capture independent editor renders of the exact source document in the package.
 // No PDF image is reused here; only the live SlideView in Chromium is captured.
 const editorPreviews=[];
 for(let number=1;number<=result.doc.slides.length;number++){
  const slide=result.doc.slides[number-1];
  await page.evaluate(id=>window.__acceptanceEditorSelect=import('/src/core/editor.ts').then(({editorStore})=>editorStore.selectSlide(id)),slide.id);
  await page.waitForFunction(async id=>{
   const {editorStore}=await import('/src/core/editor.ts');
   const stage=document.querySelector('.stage .slide-render');
   return editorStore.getSnapshot().slideId===id&&stage&&
    [...(editorStore.slide.view.elements??[])].every(el=>stage.querySelector('[data-element-id="'+el.id+'"]'));
  },slide.id);
  await page.evaluate(async()=>{
   await document.fonts.ready;
   const stage=document.querySelector('.stage .slide-render');
   await Promise.all([...stage.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  const stage=page.locator('.stage .slide-render').first();
  const screenshot=await stage.screenshot({animations:'disabled',caret:'hide'});
  const name='editor-reference-'+number+'.png';
  const bytes=await sharp(screenshot).resize(1280,720,{fit:'fill'}).png().toBuffer();
  const metadata=await sharp(bytes).metadata();
  assert.equal(metadata.width,1280,name+': width');
  assert.equal(metadata.height,720,name+': height');
  const stats=await sharp(bytes).stats();
  assert.ok(stats.channels.some(channel=>channel.stdev>3),name+': must show visible slide content');
  await writeFile(path.join(output,name),bytes);
  files[name]=bytes;
  editorPreviews.push({slideId:slide.id,file:name,derivedFrom:'live Slide Fable editor canvas',size:{width:1280,height:720}});
 }
 assert.deepEqual(pageErrors,[],'No browser errors while capturing editor references');
 const template=await readFile(new URL('../docs/sf-qual-07-office-review-protocol.md',import.meta.url));
 await writeFile(path.join(output,'REVIEW-PROTOCOL.md'),template);
 const manifest={
  schemaVersion:1,scenario:'SF-QUAL-07',releaseAcceptance:'NOT_TESTED',
  sourceCommit:process.env.GITHUB_SHA??null,
  generatedFrom:'Slide Fable native PDF/PPTX engines, editable-first',
  expectedSlides:3,
  previewType:'PDF raster plus independent Chromium editor canvas captures; neither is PowerPoint',
  previews,
  editorPreviews,
  structuralChecks:{pdfPageCount:3,pptxSlideParts:3,nativeText:true,nativeTable:true,nativeChart:true,embeddedImage:true},
  files:Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,{sha256:sha256(bytes),size:bytes.length}])),
  manualChecks:['RG-006','RG-008']
 };
 await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('PASS acceptance package: '+output+' ('+Object.keys(files).join(', ')+')');
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
