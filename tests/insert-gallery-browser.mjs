import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5191','--strictPort'],{stdio:['ignore','pipe','pipe']});
const stderr=[];server.stderr.on('data',d=>stderr.push(String(d)));
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite startup timeout '+stderr.join(''))),15000);server.stdout.on('data',d=>{if(String(d).includes('5191')){clearTimeout(timer);resolve();}});server.on('exit',c=>{clearTimeout(timer);reject(new Error('Vite exited '+c+stderr.join('')));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'ipad',width:820,height:1180},{name:'phone',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5191/');
  await page.getByRole('tab',{name:'Infoga'}).click();const panel=page.getByRole('tabpanel',{name:'Infoga'});
  for(const name of ['Text och bild','Former och linjer','Tabeller och diagram','Fler objekt']) assert.equal(await panel.getByRole('group',{name}).count(),1,v.name+': group '+name);
  const count=()=>page.evaluate(async()=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.length});
  const old=await count();await panel.getByRole('button',{name:'Textfält'}).click();assert.equal(await count(),old+1,v.name+': text');
  await panel.getByRole('button',{name:'Tabell',exact:true}).click();assert.equal(await count(),old+2,v.name+': table');
  await panel.getByRole('button',{name:'Diagram',exact:true}).click();assert.equal(await count(),old+3,v.name+': chart');
  await panel.getByText('Former ▾').click();await panel.getByRole('button',{name:'Rektangel',exact:true}).click();assert.equal(await count(),old+4,v.name+': shape');
  await panel.getByText('Fler objekt ▾').click();await panel.getByRole('button',{name:'Process'}).click();assert.equal(await count(),old+5,v.name+': process');
  assert.deepEqual(errors,[],v.name+': console errors');console.log('PASS insert gallery '+v.name);await context.close();
 }
}finally{await browser.close();server.kill('SIGTERM');}
