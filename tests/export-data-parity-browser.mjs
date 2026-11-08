/** SF-NEXT-04d: editable table/chart OOXML data and geometry, plus PDF visual presence. */
import {chromium} from 'playwright';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import sharp from 'sharp';
const execFileAsync=promisify(execFile);
const work=await mkdtemp(path.join(tmpdir(),'sf-export-data-'));
const port=5214;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
const table={id:'parity-table',type:'table',geometry:{x:100,y:170,width:610,height:350,rotation:0,unit:'logical'},style:{fontSize:25},tableLayout:{columnWidths:[300,310],rowHeights:[110,120,120],cellPadding:10},cells:[
 [{id:'col-a',text:'Region',header:true},{id:'col-b',text:'Antal',header:true}],
 [{id:'cell-north',text:'Norr'},{id:'cell-north-val',text:'42'}],
 [{id:'cell-south',text:'Söder'},{id:'cell-south-val',text:'73'}]
]};
const chart={id:'parity-chart',type:'chart',chartType:'bar',geometry:{x:860,y:160,width:600,height:510,rotation:0,unit:'logical'},dataset:{categories:['Norr','Söder'],series:[{id:'series-a',name:'Antal',values:[42,73]}]}};
const near=(a,b,t=100)=>Math.abs(a-b)<t;
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite startup timed out: '+log)),20000);server.stdout.on('data',b=>{log+=b.toString();if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite stopped '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 await page.goto(`http://127.0.0.1:${port}`);
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const artifact=await page.evaluate(async elements=>{
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=newSlide(doc,'blank');doc.slides=[slide];slide.view.elements=elements;
  editorStore.load(doc);
  const pptx=await pptxExport(doc,[slide],'editable-first',false);
  const pdf=await pdfExport(doc,[slide],'editable-first',false);
  return {pptx:Array.from(pptx.file),pdf:Array.from(pdf.file),geometry:slide.view.elements.map(e=>({id:e.id,geometry:e.geometry}))};
 },[table,chart]);
 assert.deepEqual(artifact.geometry,[table,chart].map(e=>({id:e.id,geometry:e.geometry})),'PPD geometry unchanged');
 const geometry=await page.evaluate(()=>{
  const s=document.querySelector('.stage .slide-render');if(!s)throw Error('Slide canvas unavailable');
  const base=s.getBoundingClientRect();return ['parity-table','parity-chart'].map(id=>{const e=s.querySelector(`[data-element-id="${id}"]`);if(!e)throw Error('Missing '+id);const r=e.getBoundingClientRect();return {id,x:(r.x-base.x)/base.width,y:(r.y-base.y)/base.height,w:r.width/base.width,h:r.height/base.height};});
 });
 for(const e of [table,chart]){const r=geometry.find(v=>v.id===e.id),g=e.geometry;assert.ok(Math.abs(r.x-g.x/1600)<.02&&Math.abs(r.y-g.y/900)<.02&&Math.abs(r.w-g.width/1600)<.02&&Math.abs(r.h-g.height/900)<.02,`${e.id}: editor position/size mismatch`);}
 console.log('PASS editor table/chart geometry');
 const zip=await JSZip.loadAsync(Uint8Array.from(artifact.pptx));
 const slideXml=await zip.file('ppt/slides/slide1.xml').async('string');
 const graphicFrames=[...slideXml.matchAll(/<p:graphicFrame>([\s\S]*?)<\/p:graphicFrame>/g)].map(m=>m[1]);
 assert.ok(graphicFrames.length>=2,'Native PPTX table and chart frames are required');
 const emu=914400/(1600/13.3333333333);
 for(const e of [table,chart]){const g=e.geometry;assert.ok(graphicFrames.some(f=>{const off=f.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/),ext=f.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);return off&&ext&&near(+off[1],g.x*emu)&&near(+off[2],g.y*emu)&&near(+ext[1],g.width*emu)&&near(+ext[2],g.height*emu);}),`${e.id}: native OOXML graphic frame must retain bounds`);}
 console.log('PASS PPTX native table/chart geometry');
 const tables=graphicFrames.filter(f=>f.includes('<a:tbl>'));
 assert.equal(tables.length,1,'One native editable PowerPoint table must exist');
 const tableXml=tables[0];
 for(const term of ['Region','Antal','Norr','Söder','42','73'])assert.ok(tableXml.includes(term),`PPTX table cell missing: ${term}`);
 assert.equal((tableXml.match(/<a:tr\b/g)||[]).length,3,'PPTX table must have three rows');
 console.log('PASS PPTX editable table content and rows');
 const chartFrame=graphicFrames.find(f=>f.includes('chart')&&f.includes('r:id'));
 assert.ok(chartFrame,'Native chart reference missing');
 const relId=chartFrame.match(/<c:chart[^>]*r:id="([^"]+)"/)?.[1];
 assert.ok(relId,'Native chart relation id missing');
 const rels=await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
 const rel=rels.match(new RegExp('<Relationship\\b(?=[^>]*\\bId="'+relId+'")[^>]*Target="([^"]+)"'));
 assert.ok(rel,'Chart relationship must exist');
 const target=rel[1].replace(/^\//,'');
 const chartPath=target.startsWith('ppt/')?target:path.posix.normalize(path.posix.join('ppt/slides',target));
 const chartXml=await zip.file(chartPath)?.async('string');
 assert.ok(chartXml,'Referenced native chart part missing: '+chartPath);
 assert.ok(chartXml.includes('<c:barChart>')||chartXml.includes('<c:barChart '),'Native bar chart expected');
 for(const term of ['Norr','Söder','Antal','42','73'])assert.ok(chartXml.includes(term),`Native chart series/category value missing: ${term}`);
 console.log('PASS PPTX native chart data and editable series');
 const pdfPath=path.join(work,'data.pdf'),rasterBase=path.join(work,'page');await writeFile(pdfPath,Uint8Array.from(artifact.pdf));
 await execFileAsync('pdftoppm',['-f','1','-l','1','-singlefile','-png','-scale-to-x','1600','-scale-to-y','900',pdfPath,rasterBase]);
 const img=await sharp(rasterBase+'.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=img.info;
 const changedPixels=(rect)=>{let count=0;for(let y=Math.floor(rect.y*height/900);y<Math.floor((rect.y+rect.height)*height/900);y+=4){for(let x=Math.floor(rect.x*width/1600);x<Math.floor((rect.x+rect.width)*width/1600);x+=4){const i=(y*width+x)*channels;const [r,g,b]=img.data.subarray(i,i+3);if(Math.max(r,g,b)-Math.min(r,g,b)>22||Math.min(r,g,b)<180)count++;}}return count;};
 assert.ok(changedPixels(table.geometry)>60,'PDF table should contain visible grid/text');
 assert.ok(changedPixels(chart.geometry)>80,'PDF chart should contain visible bars/labels');
 console.log('PASS PDF table/chart visible at reference positions ('+width+'x'+height+')');
}finally{await browser?.close();server.kill('SIGTERM');await rm(work,{recursive:true,force:true});}
