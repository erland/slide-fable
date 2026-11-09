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
  await tablePanel.getByRole('button',{name:'Stäng redigering'}).click();
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
  // SF-GAP-02: authoring controls persist as PPD properties and change the chart preview.
  const chartId=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').id;
  await chartPanel.getByRole('checkbox',{name:'Visa teckenförklaring'}).uncheck();
  await chartPanel.getByRole('checkbox',{name:'Visa värdeetiketter'}).uncheck();
  await chartPanel.getByRole('spinbutton',{name:'Y-axel minimum'}).fill('-5');
  await chartPanel.getByRole('spinbutton',{name:'Y-axel maximum'}).fill('120');
  let formatted=(await doc()).slides[0].view.elements.find(e=>e.id===chartId);
  assert.deepEqual(formatted.legend,{visible:false,showValues:false});
  assert.equal(formatted.yAxis.min,-5);
  assert.equal(formatted.yAxis.max,120);
  const geometry=await page.evaluate(async id=>{
    const {chartGeometry}=await import('/src/editor/Renderer.tsx');
    const {editorStore}=await import('/src/core/editor.ts');
    return chartGeometry(editorStore.getSnapshot().doc.slides[0].view.elements.find(e=>e.id===id));
  },chartId);
  assert.equal(geometry.min,-5);assert.equal(geometry.max,120);
  await chartPanel.getByRole('checkbox',{name:'Visa teckenförklaring'}).check();
  await chartPanel.getByRole('checkbox',{name:'Visa värdeetiketter'}).check();
  await chartPanel.getByRole('spinbutton',{name:'Y-axel minimum'}).fill('');
  await chartPanel.getByRole('spinbutton',{name:'Y-axel maximum'}).fill('');
  formatted=(await doc()).slides[0].view.elements.find(e=>e.id===chartId);
  assert.deepEqual(formatted.legend,{visible:true,showValues:true});
  assert.equal(formatted.yAxis.min,undefined);
  assert.equal(formatted.yAxis.max,undefined);
  console.log('PASS chart formatting authoring and PPD persistence '+viewport.name);

  // SF-GAP-02B: series colors use stable IDs and Y-axis title is part of the PPD.
  const firstSeries=(await doc()).slides[0].view.elements.find(e=>e.id===chartId).dataset.series[0];
  await chartPanel.getByRole('textbox',{name:'Y-axelns rubrik'}).fill('Timmar');
  await chartPanel.getByLabel('Serie 1 färg').fill('#1256ab');
  const colored=(await doc()).slides[0].view.elements.find(e=>e.id===chartId);
  assert.equal(colored.yAxis.title,'Timmar');
  assert.equal(colored.legend.seriesColors[firstSeries.id],'#1256ab');
  const preview=page.locator('[data-element-id="'+chartId+'"] svg[aria-label="Linjediagram"]');
  assert.equal(await preview.locator('polyline').first().getAttribute('stroke'),'#1256ab');
  assert.ok(await preview.getByText('Timmar').count()>=1,'Y-axis title must be present in the rendered SVG preview');
  console.log('PASS stable series color and axis title '+viewport.name);


  const originalCategory=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.categories[0];
  const oldSeriesName=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.series[0].name;
  await chartPanel.getByRole('textbox',{name:'Kategori 1'}).fill('Försäljning');
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.categories[0],'Försäljning');
  await chartPanel.getByRole('textbox',{name:'Serie 1 namn'}).fill('Intäkter');
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.series[0].name,'Intäkter');
  // Remove one series and one category without leaving misaligned values; both operations are undoable.
  const originalData=structuredClone((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset);
  assert.equal(await chartPanel.getByRole('button',{name:'Ta bort serie 1'}).isDisabled(),true);
  await chartPanel.getByRole('button',{name:'Ny serie'}).click();
  await chartPanel.getByRole('button',{name:'Ny kategori'}).click();
  let ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.equal(ds.series.length,2);
  assert.equal(ds.categories.length,4);
  assert.equal(ds.series[1].values.length,4);
  // Move a category and verify that values of every series follow the category.
  const beforeMoves=structuredClone(ds);
  assert.equal(await chartPanel.getByRole('button',{name:'Flytta kategori 1 uppåt'}).isDisabled(),true);
  assert.equal(await chartPanel.getByRole('button',{name:'Flytta kategori 4 nedåt'}).isDisabled(),true);
  assert.equal(await chartPanel.getByRole('button',{name:'Flytta serie 1 uppåt'}).isDisabled(),true);
  assert.equal(await chartPanel.getByRole('button',{name:'Flytta serie 2 nedåt'}).isDisabled(),true);
  await chartPanel.getByRole('button',{name:'Flytta kategori 1 nedåt'}).click();
  ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.deepEqual(ds.categories,[beforeMoves.categories[1],beforeMoves.categories[0],...beforeMoves.categories.slice(2)]);
  for(let j=0;j<ds.series.length;j++)assert.deepEqual(ds.series[j].values,[beforeMoves.series[j].values[1],beforeMoves.series[j].values[0],...beforeMoves.series[j].values.slice(2)]);
  await chartPanel.getByRole('button',{name:'Flytta serie 2 uppåt'}).click();
  ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.deepEqual(ds.series.map(s=>s.id),[beforeMoves.series[1].id,beforeMoves.series[0].id]);
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.id===chartId).legend.seriesColors[firstSeries.id],'#1256ab','Series color must survive reordering');
  assert.deepEqual(ds.series.map(s=>s.values),[beforeMoves.series[1].values.map((v,i,a)=>i===0?a[1]:i===1?a[0]:v),beforeMoves.series[0].values.map((v,i,a)=>i===0?a[1]:i===1?a[0]:v)]);
  // Moving back via the UI preserves the original data and series identities.
  await chartPanel.getByRole('button',{name:'Flytta serie 1 nedåt'}).click();
  await chartPanel.getByRole('button',{name:'Flytta kategori 2 uppåt'}).click();
  ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.deepEqual(ds,beforeMoves);
  await chartPanel.getByRole('button',{name:'Ta bort serie 2'}).click();
  await chartPanel.getByRole('button',{name:'Ta bort kategori 2'}).click();
  ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.equal(ds.series.length,1);
  assert.deepEqual(ds.categories,[originalData.categories[0],originalData.categories[2],'Ny kategori']);
  assert.deepEqual(ds.series[0].values,[originalData.series[0].values[0],originalData.series[0].values[2],0]);
  await chartPanel.getByRole('button',{name:'Stäng redigering'}).click();
  await chartTools.getByRole('button',{name:'Fler egenskaper'}).click();
  assert.equal(await page.getByRole('heading',{name:'Objektegenskaper'}).isVisible(),true);
  for(let i=0;i<8;i++)await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.undo();});
  ds=(await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset;
  assert.deepEqual(ds,originalData);
  // Undo may clear the selection; the document history, not panel persistence, is under test.

  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.undo();});
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.series[0].name,oldSeriesName);
  await page.evaluate(async()=>{(await import('/src/core/editor.ts')).editorStore.undo();});
  assert.equal((await doc()).slides[0].view.elements.find(e=>e.type==='chart').dataset.categories[0],originalCategory);
  assert.deepEqual(errors,[]);
  assert.notEqual(original,'Kvartal 1');
  console.log('PASS data-ribbon '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
