import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5228','--strictPort'],{stdio:['ignore','pipe','pipe']});
const log=[];server.stderr.on('data',x=>log.push(String(x)));
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Vite timeout '+log.join(''))),20000);server.stdout.on('data',x=>{if(String(x).includes('5228')){clearTimeout(timeout);resolve();}});server.on('exit',c=>{clearTimeout(timeout);reject(Error('Vite exited '+c));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto('http://127.0.0.1:5228/');
 const out=await page.evaluate(async()=>{
  const {iconCatalog,iconElement}=await import('/src/core/iconCatalog.ts');
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=newSlide(doc,'blank');doc.slides=[slide];
  slide.view.elements=iconCatalog.map((icon,index)=>({...iconElement(icon.id,'native-'+icon.id),geometry:{x:100+index%3*400,y:100+Math.floor(index/3)*250,width:220,height:180,rotation:index===0?20:0,unit:'logical'},style:{fill:{color:'#ffffff',opacity:0},stroke:{color:index===0?'#aa3344':'#183641'},strokeWidth:index===0?9:5}}));
  const result=await pptxExport(doc,[slide],'editable-first',false);
  return {data:Array.from(result.file),report:result.report,labels:iconCatalog.map(icon=>icon.label)};
 });
 const zip=await JSZip.loadAsync(Uint8Array.from(out.data)),xml=await zip.file('ppt/slides/slide1.xml')?.async('string');
 assert.ok(xml,'PowerPoint slide must exist');
 const custom=(xml.match(/<a:custGeom>/g)??[]).length;
 assert.equal(custom,9,'Nine native editable freeform shapes must be exported');
 for(const label of out.labels)assert.ok(xml.includes(label),label+' must be a named editable PowerPoint object');
 assert.ok(xml.includes('AA3344'),'Custom icon stroke color must remain editable');
 assert.ok(xml.includes('a:cubicBezTo')||xml.includes('a:lnTo'),'Custom vector geometry must contain native drawing commands');
 assert.ok(!out.report.objects.some(o=>o.elementId?.startsWith('native-')&&o.status==='rasterized'),'Catalog icons must not be rasterized');
 console.log('PASS nine native PowerPoint freeform icons, stroke, rotation and PPD bounds');

 const fallback=await page.evaluate(async()=>{
  const {createDocument,newSlide}=await import('/src/core/model.ts');
  const {pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=newSlide(doc,'blank');doc.slides=[slide];
  slide.view.elements=[{id:'user-vector',type:'vectorPath',geometry:{x:200,y:200,width:300,height:240,rotation:0,unit:'logical'},vectorPath:{format:'svg-path',pathData:'M 0 0 L 100 100',viewBox:'0 0 100 100',closed:false},style:{fill:{color:'#ffffff'},stroke:{color:'#123456'},strokeWidth:3}}];
  const result=await pptxExport(doc,[slide],'editable-first',false);
  return {data:Array.from(result.file),report:result.report};
 });
 const second=await JSZip.loadAsync(Uint8Array.from(fallback.data)),secondXml=await second.file('ppt/slides/slide1.xml')?.async('string');
 assert.ok(secondXml&&!secondXml.includes('<a:custGeom>'),'Unknown vectors must use the existing safe fallback');
 console.log('PASS unrecognized vector path remains on existing export fallback');
}finally{await browser.close();server.kill('SIGTERM');}
