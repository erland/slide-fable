import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const port=5236;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Vite startup: '+log)),20000);server.stdout.on('data',chunk=>{log+=chunk;if(log.includes(String(port))){clearTimeout(timeout);resolve();}});server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exit '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const view of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/');
  const id=await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.add('semanticDiagram'));
  const read=()=>page.evaluate(async id=>{
   const store=(await import('/src/core/editor.ts')).editorStore;
   return structuredClone(store.slide.view.elements.find(el=>el.id===id).semanticDiagram);
  },id);
  const pane=page.getByRole('complementary',{name:'Egenskaper'});
  if(view.name!=='desktop')await page.getByRole('navigation',{name:'Arbetsytans paneler'}).getByRole('button',{name:'Egenskaper'}).click();
  const editor=pane.getByRole('region',{name:'Redigera diagramstruktur'});
  await editor.waitFor({state:'visible'});
  const original=await read();
  await editor.getByRole('button',{name:'Flytta nod 1 ned'}).click();
  let state=await read();
  assert.deepEqual(state.nodes.map(n=>n.id),[original.nodes[1].id,original.nodes[0].id,original.nodes[2].id],view.name+': reorder nodes');
  assert.deepEqual(state.edges,original.edges,view.name+': reorder keeps edges');
  await editor.getByRole('button',{name:'Ta bort nod 2'}).click();
  state=await read();
  assert.equal(state.nodes.length,2,view.name+': remove node');
  assert.equal(state.edges.every(e=>state.nodes.some(n=>n.id===e.from)&&state.nodes.some(n=>n.id===e.to)),true,view.name+': no dangling edges');
  await editor.getByRole('button',{name:'Lägg till koppling'}).click();
  state=await read();
  assert.equal(state.edges.length,1,view.name+': add edge');
  await editor.getByRole('button',{name:'Ta bort koppling 1'}).click();
  assert.equal((await read()).edges.length,0,view.name+': remove edge');
  await editor.getByRole('button',{name:'Lägg till nod'}).click();
  assert.equal((await read()).nodes.length,3,view.name+': add node');
  await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.undo());
  assert.equal((await read()).nodes.length,2,view.name+': undo node insertion');
  await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.redo());
  assert.equal((await read()).nodes.length,3,view.name+': redo node insertion');
  assert.deepEqual(errors,[],view.name+': no runtime errors');
  console.log('PASS diagram editor '+view.name);
  await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
