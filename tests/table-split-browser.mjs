/** SF-NEXT-07a responsive UI, history, reopen and native PPTX table regression. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
const port=5222;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try {
 await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Vite startup: '+log)),20000);server.stdout.on('data',chunk=>{log+=chunk;if(log.includes(String(port))){clearTimeout(timeout);resolve();}});server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exit '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
  const page=await context.newPage();const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.add('table');});
  await page.getByRole('tab',{name:'Start',exact:true}).click();
  const tools=page.getByRole('tabpanel',{name:'Start'}).getByRole('group',{name:'Tabellverktyg'});
  await tools.getByRole('button',{name:'Fler egenskaper'}).click();
  const read=()=>page.evaluate(async()=>{const s=(await import('/src/core/editor.ts')).editorStore.getSnapshot();return structuredClone(s.doc.slides[0].view.elements.find(e=>e.type==='table').cells);});
  const start=await read();
  await page.getByRole('button',{name:'Sammanfoga →'}).first().click();
  const merged=await read();assert.equal(merged[0][0].colSpan,2);
  const split=page.getByRole('button',{name:'Dela cell 1 1'});await split.click();
  const cells=await read();assert.equal(cells[0].length,start[0].length);assert.equal(cells[0][0].id,start[0][0].id);assert.equal(cells[0][0].text,String(start[0][0].text)+' '+String(start[0][1].text));assert.equal(cells[0][1].text,'');
  assert.equal(new Set(cells.flat().map(c=>c.id)).size,cells.flat().length);
  assert.equal(await split.isDisabled(),true);
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.undo();});
  assert.deepEqual(await read(),merged);
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.redo();});
  assert.deepEqual(await read(),cells);
  const exported=await page.evaluate(async()=>{const {editorStore}=await import('/src/core/editor.ts');const doc=structuredClone(editorStore.getSnapshot().doc);editorStore.load(doc);const {pptxExport}=await import('/src/export/pptxWriter.ts');const result=await pptxExport(doc,doc.slides,'editable-first',false);return Array.from(result.file);});
  assert.deepEqual(await read(),cells);
  const zip=await JSZip.loadAsync(Uint8Array.from(exported));const xml=await zip.file('ppt/slides/slide1.xml').async('string');
  assert.match(xml,/<a:tbl>/);assert.ok((xml.match(/<a:tc[ >]/g)??[]).length>=cells.flat().length);
  assert.deepEqual(errors,[]);
  console.log('PASS table split '+viewport.name);
  await context.close();
 }
} finally {await browser?.close();server.kill('SIGTERM');}
