import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5211;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite startup: '+log)),20000);server.stdout.on('data',d=>{log+=d;if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exited '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const doc=()=>page.evaluate(async()=>structuredClone((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
  await page.getByRole('tab',{name:'Start',exact:true}).click();
  const start=page.getByRole('tabpanel',{name:'Start'});
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.add('table');});
  const tableTools=start.getByRole('group',{name:'Tabellverktyg'});
  await tableTools.waitFor();
  await tableTools.locator('summary',{hasText:'Redigera tabell'}).click();
  const tablePanel=tableTools.getByRole('region',{name:'Redigera tabellinnehåll'});
  await tablePanel.waitFor();
  const original=(await doc()).slides[0].view.elements.find(e=>e.type==='table').cells[0][0].text;
  await tablePanel.getByRole('textbox',{name:'Cell 1 1'}).fill('Kvartal 1');
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='table').cells[0][0].text,'Kvartal 1');
  await page.getByRole('tab',{name:'Formatera',exact:true}).click();
  const format=page.getByRole('tabpanel',{name:'Formatera'});
  await format.getByRole('group',{name:'Tabellverktyg'}).waitFor();
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.add('chart');});
  const chartTools=format.getByRole('group',{name:'Diagramverktyg'});
  await chartTools.waitFor();
  await chartTools.getByRole('combobox',{name:'Diagramtyp på verktygsfältet'}).selectOption('line');
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').chartType,'line');
  await chartTools.locator('summary',{hasText:'Redigera diagramdata'}).click();
  const chartPanel=chartTools.getByRole('region',{name:'Redigera diagraminnehåll'});
  await chartPanel.waitFor();
  await chartPanel.getByRole('textbox',{name:'Kategori 1'}).fill('Försäljning');
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.categories[0],'Försäljning');
  await chartTools.getByRole('button',{name:'Fler egenskaper'}).click();
  assert.equal(await page.getByRole('heading',{name:'Objektegenskaper'}).isVisible(),true);
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.undo();});
  assert.notEqual((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.categories[0],'Försäljning');
  assert.deepEqual(errors,[]);
  assert.notEqual(original,'Kvartal 1');
  console.log('PASS data-ribbon '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
