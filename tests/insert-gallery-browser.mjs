import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5191','--strictPort'],{stdio:['ignore','pipe','pipe']});
const stderr=[];server.stderr.on('data',d=>stderr.push(String(d)));
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite startup timeout '+stderr.join(''))),15000);server.stdout.on('data',d=>{if(String(d).includes('5191')){clearTimeout(timer);resolve();}});server.on('exit',c=>{clearTimeout(timer);reject(new Error('Vite exited '+c+stderr.join('')));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'ipad',width:820,height:1180},{name:'phone',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5191/');
  await page.getByRole('tab',{name:'Infoga'}).click();const panel=page.getByRole('tabpanel',{name:'Infoga'});
  for(const name of ['Text och bild','Former och linjer','Tabeller och diagram','Ikoner','Fler objekt']) assert.equal(await panel.getByRole('group',{name}).count(),1,v.name+': group '+name);
  const count=()=>page.evaluate(async()=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.length});
  const old=await count();await panel.getByRole('button',{name:'Textfält'}).click();assert.equal(await count(),old+1,v.name+': text');
  await panel.getByRole('button',{name:'Tabell',exact:true}).click();assert.equal(await count(),old+2,v.name+': table');
  await panel.getByRole('button',{name:'Diagram',exact:true}).click();assert.equal(await count(),old+3,v.name+': chart');
  await panel.getByText('Former ▾').click();await panel.getByRole('button',{name:'Rektangel',exact:true}).click();assert.equal(await count(),old+4,v.name+': shape');
  for(const [label,kind] of [['Romb (beslut)','diamond'],['Sexhörning','hexagon'],['Femhörning','pentagon'],['Chevron (flödessteg)','chevron']]){
   await panel.getByText('Former ▾').click();
   await panel.getByRole('button',{name:label,exact:true}).click();
   const shape=await page.evaluate(async()=>{const {editorStore}=await import('/src/core/editor.ts');return editorStore.slide.view.elements.at(-1);});
   assert.equal(shape.type,'shape',v.name+': '+kind+' element type');
   assert.equal(shape.shapeType,kind,v.name+': '+kind+' PPD subtype');
   const polygon=page.locator(`[data-element-id="${shape.id}"] svg polygon`).first();
   await polygon.waitFor({state:'attached'});
   assert.ok((await polygon.getAttribute('points'))?.split(' ').length>=4,v.name+': '+kind+' polygon');
  }
  const pptx=await page.evaluate(async()=>{
   const {editorStore}=await import('/src/core/editor.ts');
   const {pptxExport}=await import('/src/export/office.ts');
   const state=editorStore.getSnapshot();return Array.from((await pptxExport(state.doc,[editorStore.slide],'editable-first',false)).file);
  });
  const zip=await JSZip.loadAsync(Uint8Array.from(pptx)),slideXml=await zip.file('ppt/slides/slide1.xml')?.async('string');
  assert.ok(slideXml,v.name+': PPTX slide must exist');
  for(const name of ['diamond','hexagon','pentagon','chevron'])assert.ok(slideXml.includes(`prst="${name}"`),v.name+': native PPTX shape '+name);
  console.log('PASS native flowchart shapes and editable PowerPoint '+v.name);

  await panel.getByText('Ikoner ▾').click();
  const picker=panel.locator('.icon-picker');
  const search=picker.getByRole('searchbox',{name:'Sök ikoner'});
  await search.fill('sakerhet');
  assert.equal(await picker.getByRole('button',{name:'Säkerhet',exact:true}).count(),1,v.name+': accent-insensitive search');
  assert.equal(await picker.getByRole('button',{name:'Databas',exact:true}).count(),0,v.name+': filtered catalogue');
  await search.fill('databas');
  await picker.getByRole('button',{name:'Verksamhet',exact:true}).click();
  assert.equal(await picker.getByText('Inga ikoner matchar sökningen.').count(),1,v.name+': empty results');
  await picker.getByRole('button',{name:'IT',exact:true}).click();
  assert.equal(await picker.getByRole('button',{name:'Databas',exact:true}).count(),1,v.name+': category selection');
  assert.equal(await picker.getByRole('button',{name:'IT',exact:true}).getAttribute('aria-pressed'),'true');
  await picker.getByRole('button',{name:'Databas',exact:true}).click();
  const icon=await page.evaluate(async()=>{const {editorStore}=await import('/src/core/editor.ts');return editorStore.slide.view.elements.at(-1);});
  assert.equal(icon.type,'vectorPath',v.name+': icon must be editable vector path');
  assert.equal(icon.vectorPath.closed,false);
  assert.equal(icon.vectorPath.format,'svg-path');
  assert.equal(icon.accessibility.altText,'Databas');
  const vector=page.locator(`[data-element-id="${icon.id}"] svg path`).first();
  await vector.waitFor({state:'attached'});
  assert.equal(await vector.getAttribute('fill'),'none',v.name+': no accidental fill');
  const validated=await page.evaluate(async()=>{const {validateFull}=await import('/src/core/contract.ts');const {editorStore}=await import('/src/core/editor.ts');await validateFull(editorStore.getSnapshot().doc);return true;});
  assert.ok(validated,v.name+': icon PPD must be valid');
  console.log('PASS local icon gallery '+v.name);
  await panel.getByText('Fler objekt ▾').click();await panel.getByRole('button',{name:'Process'}).click();assert.equal(await count(),old+10,v.name+': process');
  assert.deepEqual(errors,[],v.name+': console errors');console.log('PASS insert gallery '+v.name);await context.close();
 }
}finally{await browser.close();server.kill('SIGTERM');}
