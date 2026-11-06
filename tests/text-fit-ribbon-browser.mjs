import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5215;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite startup: '+log)),20000);server.stdout.on('data',data=>{log+=data;if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exited '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const ctx=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/?test=text-fit-${viewport.name}`);
  const startTab=page.getByRole('tab',{name:'Start',exact:true});
  try{await startTab.waitFor({timeout:12000});}catch{await page.reload();await startTab.waitFor({timeout:12000});}
  const id=await page.evaluate(async()=>{const {editorStore:store}=await import('/src/core/editor.ts');const id=store.add('text');store.setElementGeometry(id,{x:40,y:40,width:320,height:65});store.editText(id,{paragraphs:[{id:'first',runs:[{text:'Svensk lång rubrik ÅÄÖ med många ord som inte ryms på en enda rad.'}]},{id:'second',runs:[{text:'Andra stycket med kursiv text och mer information för att tvinga fram överflöde.',marks:{italic:true}}]}]});store.select([id]);return id;});
  const snapshot=()=>page.evaluate(async id=>{const {editorStore:store}=await import('/src/core/editor.ts');const element=store.slide.view.elements.find(item=>item.id===id);return {overflow:element.text.overflow??'clip',height:element.geometry.height,text:element.text,slideCount:store.getSnapshot().doc.slides.length};},id);
  const start=page.getByRole('tab',{name:'Start',exact:true});await start.click();
  const quick=page.getByRole('tabpanel',{name:'Start'}).getByRole('combobox',{name:'Textpassning på verktygsfältet'});
  await quick.waitFor();assert.equal(await quick.inputValue(),'clip');
  const base=await snapshot();
  await quick.selectOption('warn');assert.equal((await snapshot()).overflow,'warn');
  const element=page.locator(`.stage .render-element[data-element-id="${id}"]`);
  await element.locator('.text-overflow-warning').waitFor();
  await quick.selectOption('shrink-to-fit');
  await element.locator('.text-overflow-warning').waitFor({state:'detached'});
  assert.equal((await snapshot()).height,base.height);
  await page.getByRole('tab',{name:'Formatera',exact:true}).click();
  const formatControl=page.getByRole('tabpanel',{name:'Formatera'}).getByRole('combobox',{name:'Textpassning på verktygsfältet'});
  assert.equal(await formatControl.inputValue(),'shrink-to-fit');
  await formatControl.selectOption('expand-height');
  await page.waitForFunction(async id=>{const {editorStore:store}=await import('/src/core/editor.ts');return store.slide.view.elements.find(e=>e.id===id).geometry.height>65;},id);
  const expanded=await snapshot();assert.ok(expanded.height>65,'expand-height updates persisted geometry');
  assert.equal(expanded.text.paragraphs[1].runs[0].marks.italic,true,'rich text preserved');
  await page.evaluate(async()=>{const {editorStore:store}=await import('/src/core/editor.ts');store.undo();store.undo();});
  assert.equal((await snapshot()).overflow,'shrink-to-fit','Undo text policy and geometry independently');
  await page.evaluate(async()=>{const {editorStore:store}=await import('/src/core/editor.ts');store.redo();store.redo();});
  assert.equal((await snapshot()).overflow,'expand-height');
  await page.evaluate(async()=>{const {validateCore}=await import('/src/core/contract.ts');const {editorStore:store}=await import('/src/core/editor.ts');validateCore(store.getSnapshot().doc);});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'No horizontal page overflow');
  assert.deepEqual(errors,[]);console.log('PASS text-fit-ribbon '+viewport.name);
  await ctx.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
