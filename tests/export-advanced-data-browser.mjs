/** SF-NEXT-04e: merged/styled table and editable native line/pie chart export. */
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
const work=await mkdtemp(path.join(tmpdir(),'sf-advanced-export-'));
const port=5215;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
const table={id:'advanced-table',type:'table',geometry:{x:80,y:140,width:460,height:400,rotation:0,unit:'logical'},style:{fontSize:26},tableLayout:{columnWidths:[230,230],rowHeights:[140,130,130],cellPadding:12},cells:[
 [{id:'head',text:'Försäljning',header:true,colSpan:2,style:{fill:{color:'#DCE9E3'},color:'#183641'}}],
 [{id:'label-1',text:'Norr',style:{fill:{color:'#E7EEE9'}}},{id:'value-1',text:'42'}],
 [{id:'label-2',text:'Söder'},{id:'value-2',text:'73'}]
]};
const line={id:'advanced-line',type:'chart',chartType:'line',geometry:{x:575,y:130,width:460,height:490,rotation:0,unit:'logical'},dataset:{categories:['Jan','Feb','Mar'],series:[{id:'series-line',name:'Utfall',values:[12,24,36]}]}};
const pie={id:'advanced-pie',type:'chart',chartType:'pie',geometry:{x:1080,y:130,width:440,height:490,rotation:0,unit:'logical'},dataset:{categories:['Nord','Syd'],series:[{id:'series-pie',name:'Andelar',values:[40,60]}]}};
const elements=[table,line,pie];
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite startup timed out: '+log)),20000);server.stdout.on('data',b=>{log+=b.toString();if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite stopped '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 await page.goto(`http://127.0.0.1:${port}`);
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const artifact=await page.evaluate(async es=>{
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=newSlide(doc,'blank');doc.slides=[slide];slide.view.elements=es;
  editorStore.load(doc);
  const pptx=await pptxExport(doc,[slide],'editable-first',false);
  const pdf=await pdfExport(doc,[slide],'editable-first',false);
  return {pptx:Array.from(pptx.file),pdf:Array.from(pdf.file),geometry:slide.view.elements.map(e=>({id:e.id,geometry:e.geometry}))};
 },elements);
 assert.deepEqual(artifact.geometry,elements.map(e=>({id:e.id,geometry:e.geometry})));
 const rendered=await page.evaluate(()=>{
  const slide=document.querySelector('.stage .slide-render');if(!slide)throw Error('Missing stage');
  const b=slide.getBoundingClientRect();return ['advanced-table','advanced-line','advanced-pie'].map(id=>{const el=slide.querySelector(`[data-element-id="${id}"]`);if(!el)throw Error('Missing '+id);const r=el.getBoundingClientRect();return {id,x:(r.x-b.x)/b.width,y:(r.y-b.y)/b.height,w:r.width/b.width,h:r.height/b.height};});
 });
 for(const e of elements){const g=e.geometry,r=rendered.find(x=>x.id===e.id);assert.ok(Math.abs(r.x-g.x/1600)<.025&&Math.abs(r.y-g.y/900)<.025&&Math.abs(r.w-g.width/1600)<.025&&Math.abs(r.h-g.height/900)<.025,'Editor bounds '+e.id);}
 console.log('PASS editor bounds for merged table, line and pie charts');
 const zip=await JSZip.loadAsync(Uint8Array.from(artifact.pptx));
 const xml=await zip.file('ppt/slides/slide1.xml').async('string');
 const frames=[...xml.matchAll(/<p:graphicFrame>([\s\S]*?)<\/p:graphicFrame>/g)].map(m=>m[1]);
 assert.equal(frames.length,3,'All three objects must be native, editable graphic frames');
 const emu=914400/(1600/13.3333333333);
 for(const e of elements){const g=e.geometry;assert.ok(frames.some(f=>{const o=f.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/),x=f.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);return o&&x&&Math.abs(+o[1]-g.x*emu)<150&&Math.abs(+o[2]-g.y*emu)<150&&Math.abs(+x[1]-g.width*emu)<150&&Math.abs(+x[2]-g.height*emu)<150;}),'Native position '+e.id);}
 console.log('PASS native PPTX geometry for all advanced objects');
 const tableXml=frames.find(f=>f.includes('<a:tbl>'));
 assert.ok(tableXml,'Native table missing');
 assert.ok(tableXml.includes('Försäljning')&&tableXml.includes('Norr')&&tableXml.includes('Söder'));
 assert.ok(/<a:tc\b[^>]*\bgridSpan="2"/.test(tableXml),'Merged header must use native OOXML gridSpan');
 assert.ok(/DCE9E3/i.test(tableXml),'Header fill must be retained in native PPTX table');
 assert.equal((tableXml.match(/<a:tr\b/g)||[]).length,3);
 console.log('PASS editable table merged-cell structure, content and fill');
 const rels=await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
 const chartIds=frames.filter(f=>f.includes('<c:chart')).map(f=>f.match(/<c:chart[^>]*r:id="([^"]+)"/)?.[1]);
 assert.equal(chartIds.length,2,'Two native chart references required');
 const chartXmls=[];
 for(const id of chartIds){assert.ok(id,'Missing chart reference id');const rel=rels.match(new RegExp('<Relationship\\b(?=[^>]*\\bId="'+id+'")[^>]*Target="([^"]+)"'));assert.ok(rel,'Missing chart relationship');const target=rel[1].replace(/^\//,'');const part=target.startsWith('ppt/')?target:path.posix.normalize(path.posix.join('ppt/slides',target));const contents=await zip.file(part)?.async('string');assert.ok(contents,'Missing native chart XML '+part);chartXmls.push(contents);}
 const lineXml=chartXmls.find(x=>x.includes('<c:lineChart')),pieXml=chartXmls.find(x=>x.includes('<c:pieChart'));
 assert.ok(lineXml,'Native editable line chart missing');assert.ok(pieXml,'Native editable pie chart missing');
 for(const v of ['Jan','Feb','Mar','Utfall','12','24','36'])assert.ok(lineXml.includes(v),'Line chart value '+v);
 for(const v of ['Nord','Syd','Andelar','40','60'])assert.ok(pieXml.includes(v),'Pie chart value '+v);
 console.log('PASS editable line and pie chart OOXML data');
 const pdfPath=path.join(work,'advanced.pdf'),rasterBase=path.join(work,'advanced');
 await writeFile(pdfPath,Uint8Array.from(artifact.pdf));
 await execFileAsync('pdftoppm',['-f','1','-l','1','-singlefile','-png','-scale-to-x','1600','-scale-to-y','900',pdfPath,rasterBase]);
 const image=await sharp(rasterBase+'.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=image.info;
 const pixels=(g)=>{let n=0;for(let y=Math.floor(g.y*height/900);y<Math.floor((g.y+g.height)*height/900);y+=4)for(let x=Math.floor(g.x*width/1600);x<Math.floor((g.x+g.width)*width/1600);x+=4){const i=(y*width+x)*channels;const [r,gg,b]=image.data.subarray(i,i+3);if(Math.min(r,gg,b)<180||Math.max(r,gg,b)-Math.min(r,gg,b)>25)n++;}return n;};
 for(const e of elements)assert.ok(pixels(e.geometry)>55,'PDF object visible: '+e.id);
 console.log('PASS visible merged table, line and pie chart in rasterized PDF ('+width+'x'+height+')');
}finally{await browser?.close();server.kill('SIGTERM');await rm(work,{recursive:true,force:true});}
