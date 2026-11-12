import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import sharp from 'sharp';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execFileAsync=promisify(execFile);
const output=path.resolve(process.env.EDITOR_OUTPUT??'../editor-evidence');await mkdir(output,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort'],{stdio:'pipe'});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('5178'))resolve();});server.on('exit',reject);});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const checks=[],pass=n=>{checks.push({name:n,result:'PASS'});console.log('PASS',n);};
const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
async function model(){return page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc);}
async function api(fn,arg){return page.evaluate(async({source,arg})=>{const store=(await import('/src/core/editor.ts')).editorStore;return new Function('store','arg',source)(store,arg);},{source:fn,arg});}
try{
 await page.goto('http://127.0.0.1:5178/');await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 assert.equal(await page.getByRole('tab',{name:'Start'}).getAttribute('aria-selected'),'true','Start should be the default PowerPoint-like ribbon');
 assert.equal(await page.locator('.editor-header .editor-menu-disclosure > summary').innerText(),'Arkiv');

 const exportFixture=JSON.parse(await readFile(path.resolve('fixtures/export-regression-v1.json'),'utf8'));
 const fixtureReports=await page.evaluate(async fixture=>{
  const {createDocument,box}=await import('/src/core/model.ts');
  const {preflight}=await import('/src/export/office.ts');
  const {preflight:planned}=await import('/src/export/plan.ts');
  const doc=createDocument(),slide=doc.slides[0];slide.view.elements=[];
  for(const item of fixture.objects){
   const e={id:item.id,type:item.type,geometry:box(0,0,200,100),style:{}};
   if(item.type==='text')e.text='Fixture title';
   if(item.type==='chart'){e.chartType='bar';e.dataset={categories:['A'],series:[{id:'one',name:'One',values:[1]}]};}
   if(item.type==='equation')e.equation={sourceFormat:'latex',source:'x^2',altText:'x squared'};
   if(item.type==='group')e.children=[];
   if(item.effects)e.effects=item.effects;
   slide.view.elements.push(e);
  }
  return {pptx:preflight(doc,'pptx'),pdf:preflight(doc,'pdf'),flattened:preflight(doc,'pptx','flattened'),samePlan:JSON.stringify(planned(doc,'pptx'))===JSON.stringify(preflight(doc,'pptx'))&&JSON.stringify(planned(doc,'pdf'))===JSON.stringify(preflight(doc,'pdf'))};
 },exportFixture);
 assert.equal(fixtureReports.samePlan,true,'IP-009 planner must preserve previous format reports');
 for(const format of ['pptx','pdf']){
  const report=fixtureReports[format],byId=new Map(report.objects.map(o=>[o.elementId,o]));
  for(const item of exportFixture.objects){
   assert.equal(byId.get(item.id)?.status,item.expect[format],format+' '+item.id);
   assert.ok(byId.get(item.id)?.reason,format+' '+item.id+' reason');
  }
  assert.ok(report.warnings.some(w=>w.toLowerCase().includes(exportFixture.expectedWarningFragment)),format+' backdrop warning');
  assert.equal(new Set(report.objects.map(o=>o.elementId)).size,exportFixture.objects.length);
 }
 for(const item of exportFixture.objects)assert.equal(fixtureReports.flattened.objects.find(o=>o.elementId===item.id)?.status,'rasterized','flattened '+item.id);
 pass('IP-008:PDF-and-PPTX-native-hybrid-fallback-and-warning-fixtures');
 const starterTexts=page.locator('.editor-canvas-pane .stage .render-element.type-text');
 assert.ok(await starterTexts.count()>=2,'New presentation must have title and body text');
 for(const expectedSize of ['72px','36px']){
  const sizes=await starterTexts.evaluateAll(els=>els.map(el=>getComputedStyle(el).fontSize));
  const index=sizes.indexOf(expectedSize);
  assert.ok(index>=0,'Could not locate template text at '+expectedSize);
  const text=starterTexts.nth(index);
  const before=await text.evaluate(el=>({size:getComputedStyle(el).fontSize,family:getComputedStyle(el).fontFamily}));
  assert.equal(before.size,expectedSize,'Template must expose expected typography');
  await text.dblclick();
  const during=await page.locator('.canvas-inline-editor .ProseMirror').evaluate(el=>({size:getComputedStyle(el).fontSize,family:getComputedStyle(el).fontFamily}));
  assert.deepEqual(during,before,'Inline editor must use effective template typography');
  await page.getByRole('button',{name:'Klar',exact:true}).click();
 }
 pass('SF-UX-04:initial-title-and-body-preserve-font-size');
 // SF-PPT-04: slide context menu targets the clicked thumbnail, not the previously active slide.
 await page.getByRole('button',{name:'Lägg till bild'}).click();
 let slideCards=page.locator('#slide-filmstrip .slide-card');
 assert.equal(await slideCards.count(),2);
 await page.getByRole('button',{name:'Fler alternativ för bild 1'}).click();
 await page.getByRole('menuitem',{name:'Duplicera bild'}).click();
 assert.equal(await slideCards.count(),3);
 assert.equal((await model()).slides.length,3);
 await page.getByRole('button',{name:'Fler alternativ för bild 1'}).click();
 await page.getByRole('menuitem',{name:'Dölj bild'}).click();
 assert.equal((await model()).slides[0].hidden,true);
 await page.getByRole('button',{name:'Fler alternativ för bild 1'}).click();
 await page.getByRole('menuitem',{name:'Visa bild'}).click();
 assert.equal((await model()).slides[0].hidden,false);
 pass('SF-PPT-04:thumbnail-menu-duplicate-and-visibility');
 assert.equal(await page.locator('.editor-header > .editor-menu-disclosure').count(),1,'Document menu belongs in header');
 assert.equal(await page.locator('main ~ .workspace-controls-disclosure').count(),0,'Panel controls should not use an extra toolbar row');
 await page.getByRole('tab',{name:'Visa'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Visa'}).locator('.workspace-controls-disclosure').count(),1,'Panel settings belong to Visa');
 await page.getByRole('tab',{name:'Infoga'}).click();
 pass('SF-UX-14:unified-navigation-hierarchy');
 const pane=page.locator('.editor-canvas-pane');const paneWidth=()=>pane.evaluate(el=>el.getBoundingClientRect().width);
 const baseWidth=await paneWidth();
 await page.getByRole('tab',{name:'Visa'}).click();
 assert.equal(await page.locator('.workspace-controls-disclosure').evaluate(el=>el.hasAttribute('open')),false,'Secondary panel controls must be collapsed initially');
 await page.locator('.workspace-controls-disclosure > summary').click();
 await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Dölj bilder',exact:true}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),false);
 assert.ok((await paneWidth())>baseWidth+100,'Canvas must grow when slides are hidden');
 await page.getByRole('button',{name:'Dölj egenskaper',exact:true}).click();
 assert.equal(await page.locator('.properties').isVisible(),false);
 assert.ok((await paneWidth())>baseWidth+300,'Canvas must grow when both panels are hidden');
 await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa bilder',exact:true}).click();
 await page.getByRole('button',{name:'Visa egenskapspanel',exact:true}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),true);
 assert.equal(await page.locator('.properties').isVisible(),true);
 await page.getByRole('tab',{name:'Visa'}).click();
 await page.locator('.workspace-controls-disclosure > summary').click();
 await page.getByRole('tab',{name:'Infoga'}).click();
 assert.equal(await page.getByRole('button',{name:'Dölj egenskaper',exact:true}).count(),1,'Single inspector toggle');
  pass('SF-UX-01:desktop-panel-toggle-and-canvas-growth');
 const fitMeasurements=await page.evaluate(()=>{const viewport=document.querySelector('.canvas-scroll'),space=document.querySelector('.stage-space');if(!viewport||!space)throw Error('Canvas elements missing');return {vw:viewport.clientWidth,vh:viewport.clientHeight,sw:space.getBoundingClientRect().width,sh:space.getBoundingClientRect().height};});
 assert.ok(fitMeasurements.sw<=fitMeasurements.vw+1,'Fit must respect viewport width');
 assert.ok(fitMeasurements.sh<=fitMeasurements.vh+1,'Fit must respect viewport height');
 pass('SF-UX-02:fit-both-dimensions');
 const fitAt=async(w,h)=>{await page.setViewportSize({width:w,height:h});await page.waitForTimeout(180);return page.evaluate(()=>{const viewport=document.querySelector('.canvas-scroll'),space=document.querySelector('.stage-space');return {vw:viewport.clientWidth,vh:viewport.clientHeight,sw:space.getBoundingClientRect().width,sh:space.getBoundingClientRect().height};});};
 for(const [w,h] of [[820,1180],[1180,820],[820,1180]]){const m=await fitAt(w,h);assert.ok(m.sw<=m.vw+2&&m.sh<=m.vh+2,'Canvas must refit on viewport rotation');}
 await page.setViewportSize({width:1440,height:1000});
 pass('SF-UX-10:rotation-refits-canvas');


 await page.setViewportSize({width:768,height:1024});
 await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();
 assert.equal(await pane.isVisible(),true);
 await page.getByRole('navigation',{name:'Arbetsytans paneler'}).getByRole('button',{name:'Bilder',exact:true}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),true);
 await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();
 assert.equal(await pane.isVisible(),true);
 await page.setViewportSize({width:1440,height:1000});
 pass('SF-UX-01:tablet-panel-navigation');
  await page.setViewportSize({width:768,height:1024});
  const portraitNav=page.getByRole('navigation',{name:'Arbetsytans paneler'});
  await portraitNav.getByRole('button',{name:'Arbetsyta',exact:true}).click();
  assert.equal(await pane.isVisible(),true,'Portrait canvas tab must show canvas');
  assert.equal(await page.locator('#slide-filmstrip').isVisible(),false,'Portrait slide strip must not stack below canvas');
  await portraitNav.getByRole('button',{name:'Bilder',exact:true}).click();
  assert.equal(await page.locator('#slide-filmstrip').isVisible(),true,'Portrait slides tab must show slide picker');
  await page.setViewportSize({width:1180,height:820});
  const landscapeLayout=await page.evaluate(()=>{const canvas=document.querySelector('.editor-canvas-pane')?.getBoundingClientRect(),slides=document.querySelector('#slide-filmstrip')?.getBoundingClientRect();return {beside:!!canvas&&!!slides&&slides.right<=canvas.left+2};});
  assert.ok(landscapeLayout.beside,'Landscape must show slide strip beside canvas');
  await page.setViewportSize({width:1440,height:1000});
  pass('SF-UX-07:portrait-panel-tabs-landscape-sidebar');
  await page.setViewportSize({width:768,height:1024});
  await portraitNav.getByRole('button',{name:'Bilder',exact:true}).click();
  const portraitReach=await page.evaluate(()=>{const strip=document.querySelector('#slide-filmstrip')?.getBoundingClientRect();return {bottom:strip?.bottom??Infinity,height:window.innerHeight};});
  assert.ok(portraitReach.bottom<=portraitReach.height+2,'Portrait slide picker must stay within viewport');
  await page.setViewportSize({width:1440,height:1000});
  assert.equal(await page.locator('.editor-menu-disclosure').evaluate(el=>el.hasAttribute('open')),false,'Secondary command menu is collapsed by default');
 await page.getByRole('tab',{name:'Visa'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Visa'}).getByLabel('Zoom').isVisible(),true,'Zoom is available within Visa');
 await page.getByRole('tab',{name:'Infoga'}).click();
 assert.equal(await page.locator('.canvas-controls').isVisible(),false,'Zoom row is hidden outside Visa');
 pass('SF-UX-12:collapsed-tools-and-portrait-filmstrip');


 await page.setViewportSize({width:390,height:844});
 const mobileNav=page.getByRole('navigation',{name:'Arbetsytans paneler'});
 await mobileNav.getByRole('button',{name:'Arbetsyta'}).click();
 assert.equal(await pane.isVisible(),true);
 const mobileLayout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
 assert.ok(mobileLayout.width<=mobileLayout.innerWidth+2,'Mobile layout should not overflow horizontally');
 await mobileNav.getByRole('button',{name:'Bilder'}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),true);
 await mobileNav.getByRole('button',{name:'Egenskaper'}).click();
 assert.equal(await page.locator('#slide-properties').isVisible(),true);
 await mobileNav.getByRole('button',{name:'Arbetsyta'}).click();
 assert.equal(await pane.isVisible(),true);
 await page.setViewportSize({width:1440,height:1000});
 pass('SF-UX-06:mobile-panel-navigation-and-no-overflow');

 const toolbar=page.locator('.insert-tools');
 assert.equal(await toolbar.getByRole('button',{name:'Textfält',exact:true}).isVisible(),true);
 assert.equal(await toolbar.locator('.shape-picker > summary').isVisible(),true);
 assert.equal(await toolbar.getByRole('button',{name:'Bilder',exact:true}).isVisible(),true);
 assert.equal(await toolbar.getByRole('button',{name:'Diagram',exact:true}).isVisible(),true);
 assert.equal(await toolbar.getByRole('button',{name:'Tabell',exact:true}).isVisible(),true);
 await toolbar.locator('summary',{hasText:'Fler objekt'}).click();
 assert.equal(await toolbar.getByRole('button',{name:'Formel',exact:true}).isVisible(),true);
 await toolbar.locator('summary',{hasText:'Fler objekt'}).click();
 pass('SF-UX-03:grouped-insert-toolbar');
 const ribbon=page.getByRole('tablist',{name:'Menyflikar'});
 assert.equal(await ribbon.getByRole('tab',{name:'Infoga'}).getAttribute('aria-selected'),'true');
 await ribbon.getByRole('tab',{name:'Start'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Ny bild'}).isVisible(),true);
 assert.deepEqual(await page.getByRole('tabpanel',{name:'Start'}).locator('.ribbon-actions > button').allTextContents(),['Ny bild','Kopiera','Klistra in','Ångra','Gör om','Layout'],'Start command order must follow the tab configuration');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Ny bild'}).isEnabled(),true,'Shared New slide command is enabled in editable mode');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Kopiera',exact:true}).count(),1,'Shared Copy command stays available in Start');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Klistra in',exact:true}).count(),1,'Shared Paste command stays available in Start');
 assert.equal(await page.locator('.editor-canvas-pane').isVisible(),true);
 await ribbon.getByRole('tab',{name:'Rita'}).click();
 const drawPanel=page.getByRole('tabpanel',{name:'Rita'});
 assert.equal(await drawPanel.getByRole('button',{name:'Linje'}).count(),0,'Rita must not insert shapes');
 for(const name of ['Rita fyllning','Rita linjefärg','Rita linjetjocklek','Rita opacitet'])assert.equal(await drawPanel.getByLabel(name).count(),1);
 assert.equal(await drawPanel.getByLabel('Rita fyllning').isDisabled(),true,'Formatting requires a selected shape');
 pass('SF-SH-05:draw-formatting-controls');
 await ribbon.getByRole('tab',{name:'Design'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Design'}).getByRole('button',{name:'Öppna designegenskaper'}).count(),0);
 await ribbon.getByRole('tab',{name:'Visa'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Visa'}).getByRole('button',{name:'Presentera'}).isVisible(),true);
 assert.equal(await page.getByRole('tabpanel',{name:'Visa'}).getByRole('button',{name:'Presentera',exact:true}).count(),1,'Visa has one declarative presentation command');
 const visaPanel=page.getByRole('tabpanel',{name:'Visa'});
 assert.equal(await visaPanel.getByRole('button',{name:'Dölj bilder',exact:true}).count(),0,'Slide visibility commands must not be duplicated directly in Visa');
 assert.equal(await visaPanel.getByRole('button',{name:'Dölj anteckningar',exact:true}).count(),0,'Notes visibility commands must not be duplicated directly in Visa');
 await visaPanel.locator('.workspace-controls-disclosure > summary').click();
 assert.equal(await visaPanel.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Dölj bilder',exact:true}).count(),1);
 assert.equal(await visaPanel.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa anteckningar',exact:true}).count(),1);
 await visaPanel.locator('.workspace-controls-disclosure > summary').click();
 pass('SF-UX-20:single-panel-command-location');

 await ribbon.getByRole('tab',{name:'Infoga'}).click();
 assert.equal(await toolbar.getByRole('button',{name:'Textfält',exact:true}).isVisible(),true);
 pass('SF-UX-08:ribbon-tabs');
 const toggleRibbon=page.getByRole('button',{name:'Dölj verktyg'});
 await toggleRibbon.click();
 assert.equal(await page.getByRole('button',{name:'Visa verktyg'}).getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#slide-ribbon-panel').isVisible(),false,'Ribbon command strip should be hidden');
 assert.equal(await ribbon.getByRole('tab',{name:'Start'}).isVisible(),true,'Tabs must remain accessible');
 await ribbon.getByRole('tab',{name:'Rita'}).click();
 assert.equal(await page.locator('#slide-ribbon-panel').isVisible(),true,'Choosing a tab restores its tools');
 await page.getByRole('button',{name:'Dölj verktyg'}).click();
 await page.getByRole('button',{name:'Visa verktyg'}).click();
 await ribbon.getByRole('tab',{name:'Infoga'}).click();
 pass('SF-UX-15:collapsible-ribbon');

 await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.select([]));
 await ribbon.getByRole('tab',{name:'Infoga'}).focus();
 await page.keyboard.press('ArrowRight');
 assert.equal(await ribbon.getByRole('tab',{name:'Rita'}).getAttribute('aria-selected'),'true','Right arrow selects the next ribbon tab');
 assert.equal(await ribbon.getByRole('tab',{name:'Rita'}).evaluate(el=>el===document.activeElement),true,'Focus follows selected ribbon tab');
 await page.keyboard.press('End');
 assert.equal(await ribbon.getByRole('tab').last().getAttribute('aria-selected'),'true','End selects last visible tab');
 await page.keyboard.press('Home');
 assert.equal(await ribbon.getByRole('tab',{name:'Start'}).getAttribute('aria-selected'),'true','Home selects first tab');
 await page.keyboard.press('ArrowLeft');
 assert.equal(await ribbon.getByRole('tab').last().getAttribute('aria-selected'),'true','Left arrow wraps to last tab');
 await ribbon.getByRole('tab',{name:'Infoga'}).click();
 pass('SF-UX-11:ribbon-keyboard-navigation');

 await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.select([]));
 assert.equal(await ribbon.getByRole('tab',{name:'Formatera'}).count(),0,'Contextual tab must be absent without selection');
 await page.locator('.editor-canvas-pane .stage .render-element.type-text').first().click();
 assert.equal(await ribbon.getByRole('tab',{name:'Formatera'}).count(),1,'Selecting an object must show contextual tab');
 await ribbon.getByRole('tab',{name:'Formatera'}).click();
 const contextPanel=page.getByRole('tabpanel',{name:'Formatera'});
 assert.equal(await contextPanel.getByRole('button',{name:'Kopiera objekt'}).count(),1);
  assert.equal(await page.locator('#slide-properties .properties-heading').getByRole('button',{name:'Stäng egenskapspanel'}).isVisible(),true);
 await contextPanel.locator('summary',{hasText:'Fler objektval'}).click();
 assert.equal(await contextPanel.getByRole('button',{name:'Ta bort markerat'}).isVisible(),true);
 await ribbon.getByRole('tab',{name:'Infoga'}).click();
 pass('SF-UX-09:contextual-object-menu');

 await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;store.select(store.slide.view.elements.slice(0,2).map(e=>e.id));});
 await page.locator('#slide-properties .multi-selection-properties').waitFor();
 assert.match(await page.locator('#slide-properties .multi-selection-properties h2').innerText(),/2 markerade objekt/);
 assert.equal(await page.locator('#slide-properties .multi-selection-properties').getByRole('button',{name:'Gruppera'}).count(),1);
 assert.equal(await page.locator('#slide-properties .geometry-fields').count(),0,'Multiple selection must not edit the first object implicitly');
 await page.evaluate(async()=> (await import('/src/core/editor.ts')).editorStore.select([]));
 await page.locator('#slide-properties .multi-selection-properties').waitFor({state:'detached'});
 pass('UX-003:contextual-multi-selection');

 // Common formatting must update multiple objects through the visible inspector.
 const multiFormatBefore=await model();
 const multiIds=await api("const a=store.add('shape'),b=store.add('shape'),locked=store.add('shape');store.updateElement(locked,{locked:true});store.updateElement(b,{style:{...store.slide.view.elements.find(e=>e.id===b).style,fill:{color:'#ffcc00'}}});store.select([a,b,locked]);return {a,b,locked};");
 const multiPanel=page.locator('.multi-selection-formatting');
 await multiPanel.waitFor();
 assert.match(await multiPanel.innerText(),/Blandade värden/);
 await multiPanel.getByLabel('Gemensam fyllning',{exact:true}).fill('#112233');
 let multiDoc=await model(),multiElements=multiDoc.slides[0].view.elements;
 for(const id of [multiIds.a,multiIds.b])assert.equal(multiElements.find(e=>e.id===id).style.fill.color,'#112233');
 assert.notEqual(multiElements.find(e=>e.id===multiIds.locked).style.fill.color,'#112233');
 await multiPanel.getByLabel('Gemensam textstorlek',{exact:true}).fill('48');
 await multiPanel.getByLabel('Gemensam textstorlek',{exact:true}).press('Enter');
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id===multiIds.a).style.fontSize,48);
 await api("store.undo();return true;");
 assert.notEqual((await model()).slides[0].view.elements.find(e=>e.id===multiIds.a).style.fontSize,48);
 const outlineLine=await api("const id=store.add('line');store.select([id]);store.formatSelected({key:'outlineColor',value:'#aabbcc'});store.formatSelected({key:'outlineWidth',value:7});return id;");
 const actualOutline=await page.locator('.stage [data-element-id="'+outlineLine+'"] svg line').evaluate(el=>({color:el.getAttribute('stroke'),width:el.getAttribute('stroke-width')}));
 assert.deepEqual(actualOutline,{color:'#aabbcc',width:'7'});
 await page.evaluate(async doc=>(await import('/src/core/editor.ts')).editorStore.load(doc),multiFormatBefore);
 pass('SF-COMMON-01:multi-format-inspector-mixed-locked-and-undo');

 // Text tools operate on the selected paragraphs and preserve run formatting.
 const commonToolsBefore=await model();
 const commonTextId=await api("const id=store.add('text');store.editText(id,{paragraphs:[{id:'common-p1',runs:[{text:'Första stycket',marks:{bold:true}}]},{id:'common-p2',runs:[{text:'Andra stycket'}]}]});return id;");
 const textEditor=page.locator('#slide-properties .rich-editor');
 const commonEditable=textEditor.locator('.ProseMirror');
 await commonEditable.click();await page.keyboard.press('ControlOrMeta+A');
 await textEditor.getByLabel('Typsnitt för markering',{exact:true}).selectOption('Georgia');
 // Each paragraph operation must explicitly target all paragraphs; toolbar focus can change the selection.
 await commonEditable.click();await page.keyboard.press('ControlOrMeta+A');
 await textEditor.getByLabel('Radavstånd',{exact:true}).fill('1.8');
 await textEditor.getByLabel('Radavstånd',{exact:true}).press('Enter');
 await page.waitForFunction(async id=>{
  const {editorStore}=await import('/src/core/editor.ts');
  return editorStore.slide.view.elements.find(e=>e.id===id)?.text?.paragraphs?.every(p=>p.paragraphStyle?.lineSpacing===1.8);
 },commonTextId);
 await commonEditable.click();await page.keyboard.press('ControlOrMeta+A');
 await textEditor.getByLabel('Avstånd efter stycke',{exact:true}).fill('12');
 await textEditor.getByLabel('Avstånd efter stycke',{exact:true}).press('Enter');
 await page.waitForFunction(async id=>{
  const {editorStore}=await import('/src/core/editor.ts');
  return editorStore.slide.view.elements.find(e=>e.id===id)?.text?.paragraphs?.every(p=>p.paragraphStyle?.lineSpacing===1.8&&p.paragraphStyle?.marginAfter===12);
 },commonTextId);
 const commonText=await api("return store.slide.view.elements.find(e=>e.id===arg).text;",commonTextId);
 assert.ok(commonText.paragraphs.every(p=>p.paragraphStyle.lineSpacing===1.8&&p.paragraphStyle.marginAfter===12));
 assert.ok(commonText.paragraphs.every(p=>p.runs.every(r=>r.fontFamily==='Georgia')));
 assert.equal(commonText.paragraphs[0].runs[0].marks.bold,true);
 const renderedText=page.locator('.stage [data-text-id="'+commonTextId+'"] [data-paragraph]').first();
 assert.equal(await renderedText.evaluate(el=>el.style.lineHeight),'1.8');
 assert.equal(await renderedText.evaluate(el=>el.style.marginBottom),'12px');
 const commonRoundtrip=await page.evaluate(async value=>{const {toEditor,fromEditor}=await import('/src/editor/RichEditor.tsx');return fromEditor(toEditor(value),value);},commonText);
 assert.deepEqual(commonRoundtrip,commonText);
 pass('SF-COMMON-02:text-font-paragraph-controls-render-and-roundtrip');

 // Crop editing is a local preview; commit is a single undoable document update.
 const cropImageUri=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const context=canvas.getContext('2d');context.fillStyle='#ff0000';context.fillRect(0,0,400,400);context.fillStyle='#0000ff';context.fillRect(400,0,400,400);return canvas.toDataURL();
 });
 await page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp,image/svg+xml"]').setInputFiles({name:'common-crop.png',mimeType:'image/png',buffer:Buffer.from(cropImageUri.split(',')[1],'base64')});
 await page.locator('.editor-canvas-pane .stage .type-image').last().waitFor({state:'visible'});
 const cropId=await api("const id=store.getSnapshot().selected[0];store.updateElement(id,{geometry:{x:100,y:200,width:400,height:400}});return id;");
 await page.getByRole('button',{name:'Beskär bild visuellt',exact:true}).click();
 const cropZoom=page.getByLabel('Zooma bildbeskärning',{exact:true});
 await cropZoom.focus();await cropZoom.press('Home');for(let i=0;i<20;i++)await cropZoom.press('ArrowRight');
 const cropPreview=page.getByRole('group',{name:'Flytta motivet i beskärningen'});
 await cropPreview.focus();await page.keyboard.press('ArrowLeft');
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id===cropId).crop,undefined,'Preview must not change document');
 await page.getByRole('button',{name:'Avbryt beskärning',exact:true}).click();
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id===cropId).crop,undefined);
 await page.getByRole('button',{name:'Beskär bild visuellt',exact:true}).click();
 await cropZoom.focus();await cropZoom.press('Home');for(let i=0;i<20;i++)await cropZoom.press('ArrowRight');
 await cropPreview.scrollIntoViewIfNeeded();
 const cropBounds=await cropPreview.boundingBox();
 await page.mouse.move(cropBounds.x+cropBounds.width/2,cropBounds.y+cropBounds.height/2);
 await page.mouse.down();await page.mouse.move(cropBounds.x+cropBounds.width/2+15,cropBounds.y+cropBounds.height/2+10);await page.mouse.up();
 const cropUndoBefore=await api("return store.getSnapshot().undo;");
 await page.getByRole('region',{name:'Visuell bildbeskärning',exact:true}).getByRole('button',{name:'Tillämpa beskärning',exact:true}).click();
 const savedCrop=await api("return store.slide.view.elements.find(e=>e.id===arg).crop;",cropId);
 assert.ok(savedCrop.width<.5&&savedCrop.height<1);
 assert.ok(savedCrop.x>=0&&savedCrop.y>=0&&savedCrop.x+savedCrop.width<=1&&savedCrop.y+savedCrop.height<=1);
 assert.equal(await api("return store.getSnapshot().undo;"),cropUndoBefore+1);
 const imageStyle=await page.locator('.stage [data-element-id="'+cropId+'"] .image-mask img').evaluate(el=>({width:el.style.width,left:el.style.left}));
 assert.equal(imageStyle.width,100/savedCrop.width+'%');
 const cropPersisted=await model();
 await api("store.undo();return true;");
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id===cropId).crop,undefined);
 await api("store.redo();return true;");
 assert.deepEqual((await model()).slides[0].view.elements.find(e=>e.id===cropId).crop,savedCrop);
 await page.evaluate(async doc=>(await import('/src/core/editor.ts')).editorStore.load(JSON.parse(JSON.stringify(doc))),cropPersisted);
 assert.deepEqual((await model()).slides[0].view.elements.find(e=>e.id===cropId).crop,savedCrop);
 await page.evaluate(async doc=>(await import('/src/core/editor.ts')).editorStore.load(doc),commonToolsBefore);
 pass('SF-COMMON-02:visual-crop-cancel-pan-commit-undo-and-persistence');





 await page.evaluate(async()=>{const {editorStore:store}=await import('/src/core/editor.ts');const {createDocument}=await import('/src/core/model.ts');store.load(createDocument());});await page.getByRole('button',{name:'Lägg till bild',exact:true}).click();await page.getByRole('button',{name:'Lägg till bild',exact:true}).click();assert.equal((await model()).slides.length,3);pass('DEV005:create-three-slides');
 await toolbar.locator('.shape-picker').evaluate(el=>{el.open=false;});await toolbar.locator('.shape-picker > summary').click();assert.equal(await toolbar.locator('.shape-picker').evaluate(el=>el.open),true,'Shape picker must remain open after click');await toolbar.locator('.shape-picker-items button',{hasText:'Rektangel'}).first().click();await page.getByLabel('Bredd',{exact:true}).fill('470');await page.getByLabel('Bredd',{exact:true}).press('Enter');assert.equal((await model()).slides[2].view.elements.at(-1).geometry.width,470);await page.getByRole('button',{name:'Ångra',exact:true}).click();assert.equal((await model()).slides[2].view.elements.at(-1).geometry.width,600);await page.getByRole('button',{name:'Gör om',exact:true}).click();pass('DEV005:geometry-and-undo');
 await toolbar.locator('.shape-picker > summary').click();
 await toolbar.locator('.shape-picker-items button',{hasText:'Triangel'}).click();
 assert.equal((await model()).slides[2].view.elements.at(-1).shapeType,'triangle');
 await toolbar.locator('.shape-picker > summary').click();
 await toolbar.locator('.shape-picker-items button',{hasText:'Rundad rektangel'}).click();
 const rounded=(await model()).slides[2].view.elements.at(-1);
 assert.equal(rounded.shapeType,'rect');
 assert.equal(rounded.style.cornerRadius,30);
 await toolbar.locator('.shape-picker > summary').click();
 await toolbar.locator('.shape-picker-items button',{hasText:'Ellips'}).click();
 assert.equal((await model()).slides[2].view.elements.at(-1).shapeType,'ellipse');
 pass('SF-SH-04:visual-shape-picker');

 await page.getByRole('button',{name:'Textfält',exact:true}).click();
 const newTextId=(await model()).slides[2].view.elements.at(-1).id;
 await page.locator('.editor-canvas-pane .stage [data-element-id="'+newTextId+'"]').dblclick();
 const inline=page.locator('.canvas-inline-editor');
 const originalText=page.locator('.editor-canvas-pane .stage [data-element-id="'+newTextId+'"]');
 const typographyBefore=await originalText.evaluate(el=>({size:getComputedStyle(el).fontSize,font:getComputedStyle(el).fontFamily}));
 const typographyDuring=await inline.locator('.ProseMirror').evaluate(el=>({size:getComputedStyle(el).fontSize,font:getComputedStyle(el).fontFamily}));
 assert.equal(typographyDuring.size,typographyBefore.size,'Inline editor must preserve text font size');
 assert.equal(typographyDuring.font,typographyBefore.font,'Inline editor must preserve font family');
 await inline.getByRole('textbox',{name:'Redigera objektets text'}).fill('Redigerad direkt på canvas');
 await inline.getByRole('button',{name:'Klar'}).click();
 assert.ok(JSON.stringify(await model()).includes('Redigerad direkt på canvas'));
 pass('SF-UX-04:inline-rich-text-edit');
 await page.locator('.editor-canvas-pane .stage [data-element-id="'+newTextId+'"]').dblclick();
 assert.equal(await page.getByRole('group',{name:'Redigera text på bilden'}).isVisible(),true);
 await page.getByRole('group',{name:'Redigera text på bilden'}).getByRole('textbox',{name:'Redigera objektets text'}).press('Escape');
 assert.equal(await page.locator('.canvas-inline-editor').count(),0);
 pass('SF-UX-06:escape-closes-inline-edit');

 const dragEl=page.locator('.editor-canvas-pane .stage [data-element-id="'+newTextId+'"]');
 const startGeometry=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 const dragBounds=await dragEl.boundingBox();assert.ok(dragBounds,'Text object must be visible');
 await page.mouse.move(dragBounds.x+dragBounds.width/2,dragBounds.y+dragBounds.height/2);
 await page.mouse.down();await page.mouse.move(dragBounds.x+dragBounds.width/2+35,dragBounds.y+dragBounds.height/2+25,{steps:5});await page.mouse.up();
 const movedGeometry=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 assert.ok(movedGeometry.x!==startGeometry.x||movedGeometry.y!==startGeometry.y,'Drag must update element geometry');
 pass('SF-UX-05:drag-selected-object');
 const resizeHandle=page.getByRole('button',{name:'Ändra objektstorlek'});
 const beforeResize=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 const handleBounds=await resizeHandle.boundingBox();assert.ok(handleBounds,'Resize handle must be visible');
 await page.mouse.move(handleBounds.x+handleBounds.width/2,handleBounds.y+handleBounds.height/2);
 await page.mouse.down();await page.mouse.move(handleBounds.x+handleBounds.width/2+48,handleBounds.y+handleBounds.height/2+32,{steps:5});await page.mouse.up();
 const afterResize=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 assert.ok(afterResize.width>beforeResize.width&&afterResize.height>beforeResize.height,'Resize must increase width and height');
 pass('SF-UX-05:resize-handle-updates-geometry');
 assert.equal(await page.locator('.resize-handle').count(),8,'Selected object must expose eight resize handles');
 const west=page.locator('.resize-handle[data-direction="w"]');
 const beforeWest=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 const westBox=await west.boundingBox();assert.ok(westBox);
 await page.mouse.move(westBox.x+westBox.width/2,westBox.y+westBox.height/2);
 await page.mouse.down();await page.mouse.move(westBox.x+westBox.width/2-40,westBox.y+westBox.height/2,{steps:5});await page.mouse.up();
 const afterWest=(await model()).slides[2].view.elements.find(e=>e.id===newTextId).geometry;
 assert.ok(afterWest.x<beforeWest.x&&afterWest.width>beforeWest.width,'West resize must move left edge while growing width');
 assert.equal(afterWest.x+afterWest.width,beforeWest.x+beforeWest.width,'West resize must preserve right edge');
 pass('SF-SH-02:eight-handles-and-west-resize');

 const firstId=(await model()).slides[2].view.elements[0].id;
 await page.locator('.editor-canvas-pane .stage [data-element-id="'+newTextId+'"]').click();
 await page.locator('.editor-canvas-pane .stage [data-element-id="'+firstId+'"]').click({modifiers:['Shift']});
 assert.equal(await page.locator('.editor-canvas-pane .stage [data-selected="true"]').count(),2,'Shift-click must retain both selected elements');
 pass('SF-UX-05:shift-multiselect');



 await page.getByRole('button',{name:'Textfält',exact:true}).click();const edit=page.getByRole('textbox',{name:'Redigera objektets text'});await edit.fill('Svensk berättelse ÅÄÖ');await page.getByRole('button',{name:'Fetstil',exact:true}).click();await edit.press('End');await edit.type(' med rik text');await page.getByRole('button',{name:'Bild',exact:true}).click();await page.getByRole('tab',{name:'Visa'}).click();await page.locator('.workspace-controls-disclosure > summary').click();await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa anteckningar',exact:true}).click();await page.getByRole('tab',{name:'Infoga'}).click();await page.getByLabel('Talaranteckningar',{exact:true}).fill('HEMLIG ANTECKNING');await page.getByLabel('Talaranteckningar',{exact:true}).press('Tab');assert.ok(JSON.stringify(await model()).includes('Svensk berättelse'));pass('DEV008:rich-text-edit-and-save');
 await page.getByRole('status').filter({hasText:'Arbetskopia sparad'}).waitFor();
  const before=await model();
  await page.reload();
  await page.locator('.editor-header .editor-menu-disclosure > summary').click();
  await page.getByRole('navigation',{name:'Arkiv och redigering'}).getByRole('button',{name:'Arbetskopior…'}).click();
  const recovery=page.getByRole('dialog');
  await recovery.getByRole('heading',{name:'Lokala arbetskopior'}).waitFor();
  const savedCopy=recovery.locator('.draft-recovery-entry[data-draft-id="'+before.document.id+'"]');
  assert.equal(await savedCopy.count(),1,'Recover the exact saved document even when titles are duplicated');
  await savedCopy.getByRole('button',{name:'Öppna'}).click();
  assert.notDeepEqual(await model(),before,'Selecting an entry must not restore before confirmation');
  await recovery.getByRole('button',{name:'Bekräfta öppning'}).click();
  assert.deepEqual(await model(),before);
  pass('DEV006:reload-explicit-recovery');
 const cas=await page.evaluate(async()=>{const p=await import('/src/core/persistence.ts'),doc=(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc;let conflict=false;try{await p.saveDraft(doc,null,'other-tab');}catch(e){conflict=String(e).includes('CONFLICT');}return conflict;});assert.equal(cas,true);pass('DEV006:atomic-stale-tab-conflict');
 const quota=await page.evaluate(async()=>{const proto=IDBObjectStore.prototype,old=proto.put;proto.put=function(){throw new DOMException('test quota','QuotaExceededError');};try{const p=await import('/src/core/persistence.ts'),d=(await import('/src/core/model.ts')).createDocument();await p.saveDraft(d,null,'test');return false;}catch(e){return String(e).includes('Quota');}finally{proto.put=old;}});assert.equal(quota,true);pass('DEV006:quota-error-does-not-report-success');
 await api("for(const type of ['table','chart','semanticDiagram','equation','vectorPath'])store.add(type);return true;");
 await api("store.transaction((d,s)=>{s.view.elements.find(e=>e.type==='chart').dataset.series[0].values=[2,7,4];s.view.elements.find(e=>e.type==='equation').equation.source='x^2 + y^2 = z^2';});return true;");
 await api("store.select([store.slide.view.elements.find(e=>e.type==='table').id]);return true;");await page.locator('.properties').getByLabel('Cell 1 1',{exact:true}).fill('Samlad rubrik');await page.getByRole('button',{name:'Sammanfoga →',exact:true}).first().click();assert.equal((await model()).slides[0].view.elements.find(e=>e.type==='table').cells[0][0].colSpan,2);pass('DEV010:table-edit-and-cell-merge');
 await api("store.select([store.slide.view.elements.find(e=>e.type==='chart').id]);return true;");await page.locator('.properties').getByLabel('Serie 1 värde 1',{exact:true}).fill('12');assert.equal((await model()).slides[0].view.elements.find(e=>e.type==='chart').dataset.series[0].values[0],12);pass('DEV010:chart-data-input-updates-model');
 await api("store.select([store.slide.view.elements.find(e=>e.type==='semanticDiagram').id]);return true;");await page.getByLabel('Nod 1',{exact:true}).fill('Kontrollera');await page.getByLabel('Riktning',{exact:true}).selectOption('tb');pass('DEV011:diagram-label-and-layout-edit');
 const source=await model();const html=await page.evaluate(async()=>{const {standaloneHtml}=await import('/src/export/html.tsx');const store=(await import('/src/core/editor.ts')).editorStore;return standaloneHtml(store.getSnapshot().doc,true);});await writeFile(path.join(output,'roundtrip.html'),html);
 const roundtrip=await page.evaluate(async(html)=>{const c=await import('/src/core/contract.ts');return (await c.importDocument(html)).doc;},html);delete roundtrip.build;assert.deepEqual(roundtrip,source);pass('DEV007:HTML-roundtrip-retains-model-IDs-data-sources');
 const player=await context.newPage();const requests=[];player.on('request',r=>requests.push(r.url()));await player.route('**/*',r=>r.abort());await player.setContent(html);await player.getByRole('button',{name:'Nästa bild'}).click();assert.equal(await player.locator('.portable:visible').count(),1);assert.deepEqual(requests,[]);await player.close();pass('DEV007:standalone-player-zero-network');
 const invalid=await page.evaluate(async()=>{const {importDocument}=await import('/src/core/contract.ts');try{await importDocument('<script id="ppd-data" type="application/json">{"bad":true}</script><script>window.pwned=1</script>');return false;}catch{return window.pwned!==1;}});assert.equal(invalid,true);assert.deepEqual(await model(),source);pass('DEV004:failed-untrusted-import-preserves-current-document');
 const layout=await api("const s=store.slide;const old=s.view.elements.find(e=>e.contentRef);store.select([old.id]);store.updateElement(old.id,{geometry:{...old.geometry,x:333}});store.resetLayout();store.makeComponent();return store.getSnapshot().doc.components.length;");assert.equal(layout,1);pass('DEV009:layout-reset-component-library');
 const actionTest=await page.evaluate(async()=>{const c=await import('/src/core/contract.ts');for(const svg of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://bad.invalid/x"/></svg>']){try{c.inspectSvg(svg);return false;}catch{/* expected */}}return true;});assert.equal(actionTest,true);pass('DEV011:script-and-remote-SVG-rejected');
 const result=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;const {pdfExport,pptxExport}=await import('/src/export/office.ts');const {imageExport}=await import('/src/export/html.tsx');const d=store.getSnapshot().doc,slides=d.slides;const pdf=await pdfExport(d,slides),pptx=await pptxExport(d,slides),images=await imageExport(d,slides,800,'png');return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file),images:Array.from(new Uint8Array(await images.arrayBuffer())),pdfReport:pdf.report,pptxReport:pptx.report};});
 await writeFile(path.join(output,'presentation.pdf'),new Uint8Array(result.pdf));await writeFile(path.join(output,'presentation.pptx'),new Uint8Array(result.pptx));await writeFile(path.join(output,'images.zip'),new Uint8Array(result.images));await writeFile(path.join(output,'export-reports.json'),JSON.stringify({pdf:result.pdfReport,pptx:result.pptxReport},null,2));
 const zip=await JSZip.loadAsync(new Uint8Array(result.pptx));assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+.xml$/.test(n)).length,3);const xml=(await Promise.all([1,2,3].map(i=>zip.file('ppt/slides/slide'+i+'.xml').async('string')))).join('');assert.ok(xml.includes('graphicFrame'));assert.ok(xml.includes('ÅÄÖ'));assert.ok(zip.file('customXml/item1.xml'));const iz=await JSZip.loadAsync(new Uint8Array(result.images));assert.equal(Object.keys(iz.files).length,3);pass('DEV013-014:PDF-PPTX-PNG-files-and-native-OOXML');
 await page.getByRole('button',{name:'Presentera',exact:true}).click();await page.getByRole('button',{name:'Svart skärm',exact:true}).click();assert.equal(await page.locator('.black-screen').count(),1);await page.getByRole('button',{name:'Visa bild',exact:true}).click();const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Publikfönster',exact:true}).click();const audience=await popupPromise;await audience.locator('.audience').waitFor();assert.equal(await audience.getByText('HEMLIG ANTECKNING',{exact:true}).count(),0);const audienceSource=await audience.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc);assert.ok(!JSON.stringify(audienceSource).includes('HEMLIG ANTECKNING'));await audience.close();await page.getByRole('button',{name:'Avsluta',exact:true}).click();pass('DEV012:presenter-blackout-and-private-notes-omitted-from-audience');
 // SF-UX-21: verify that the compact ribbon remains navigable at all target sizes.
 const endpointId=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;const id=store.add('arrow');store.select([id]);return id;});
 const endpointHandles=page.locator('.line-endpoint-handle');
 assert.equal(await endpointHandles.count(),2,'Line and arrow selection exposes two endpoint handles');
 const endHandle=page.locator('.line-endpoint-handle[data-endpoint="end"]');
 const eb=await endHandle.boundingBox();assert.ok(eb);
 await page.mouse.move(eb.x+eb.width/2,eb.y+eb.height/2);
 const beforeLive=await page.locator('.stage [data-element-id="'+endpointId+'"] svg line').getAttribute('x2');
 await page.mouse.down();await page.mouse.move(eb.x+eb.width/2-100,eb.y+eb.height/2+120,{steps:6});
 const duringLive=await page.locator('.stage [data-element-id="'+endpointId+'"] svg line').getAttribute('x2');
 assert.notEqual(duringLive,beforeLive,'Arrow line endpoint must visually update while dragging before pointerup');
 assert.equal((await model()).slides.flatMap(s=>s.view.elements).find(e=>e.id===endpointId)?.extensions?.slideFableLinePoints,undefined,'Drag preview must not commit document before pointerup');
 await page.mouse.up();
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"]').evaluate(el=>getComputedStyle(el).outlineStyle),'none','Selected arrow has handles without bounding selection outline');
 const endpointDoc=await model(),arrow=endpointDoc.slides.find(s=>s.id===endpointDoc.slides[endpointDoc.slides.length-1]?.id)?.view.elements.find(e=>e.id===endpointId)??endpointDoc.slides.flatMap(s=>s.view.elements).find(e=>e.id===endpointId);
 assert.ok(arrow?.extensions?.slideFableLinePoints,'Endpoint edit must persist in PPD extension');
 assert.notEqual(arrow.extensions.slideFableLinePoints.start.y,arrow.extensions.slideFableLinePoints.end.y,'Arrow must become diagonal');
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"] svg polygon').count(),1,'Arrowhead still rendered');
 pass('SF-SH-03:movable-line-endpoint-and-arrowhead');
 // SF-SH-11: independent editable endpoint symbols; old arrows retain filled tips.
 await page.getByRole('tab',{name:'Rita'}).click();
 const markerPanel=page.getByRole('tabpanel',{name:'Rita'});
 assert.equal(await markerPanel.getByLabel('Rita startsymbol').inputValue(),'none');
 assert.equal(await markerPanel.getByLabel('Rita slutsymbol').inputValue(),'filledArrow');
 await markerPanel.getByLabel('Rita startsymbol').selectOption('circle');
 await markerPanel.getByLabel('Rita slutsymbol').selectOption('openArrow');
 const customMarkers=(await model()).slides.flatMap(s=>s.view.elements).find(e=>e.id===endpointId);
 assert.equal(customMarkers.style.outline.startMarker,'oval');
  assert.equal(customMarkers.style.outline.endMarker,'open-arrow');
  assert.equal(customMarkers.extensions?.slideFableEndMarkers,undefined);
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"] svg circle.line-end-marker').count(),1);
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"] svg polyline.line-end-marker').count(),1);
 await markerPanel.getByLabel('Rita slutsymbol').selectOption('diamond');
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"] svg polygon.line-end-marker').count(),1);
 const lineId=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;return store.add('line');});
 assert.equal(await markerPanel.getByLabel('Rita slutsymbol').inputValue(),'none','Line defaults to no endpoint markers');
 await markerPanel.getByLabel('Rita startsymbol').selectOption('bar');
 assert.equal(await page.locator('.stage [data-element-id="'+lineId+'"] svg polyline.line-end-marker').count(),1);
 pass('SF-SH-11:independent-endpoint-markers');
 await page.evaluate(async id=>(await import('/src/core/editor.ts')).editorStore.select([id]),endpointId);

 // Background clicks should clear selection, including the slide surface itself.
 const selection=()=>page.evaluate(async()=>[...(await import('/src/core/editor.ts')).editorStore.getSnapshot().selected]);
 assert.deepEqual(await selection(),[endpointId],'Arrow selected before canvas deselection');
 await page.locator('.stage .slide-render').click({position:{x:8,y:8}});
 assert.deepEqual(await selection(),[],'Clicking blank slide background clears selection');
 assert.equal(await page.locator('.line-endpoint-handle').count(),0,'Deselect hides endpoint handles');
 await page.evaluate(async id=>(await import('/src/core/editor.ts')).editorStore.select([id]),endpointId);
 await page.locator('.canvas-scroll').click({position:{x:3,y:3}});
 assert.deepEqual(await selection(),[],'Clicking surrounding canvas clears selection');
 await page.evaluate(async id=>(await import('/src/core/editor.ts')).editorStore.select([id]),endpointId);
 await page.locator('.line-endpoint-handle').first().click();
 assert.deepEqual(await selection(),[endpointId],'Clicking an endpoint handle must preserve selection');
 pass('SF-SH-08:canvas-background-deselect');
 // SF-SH-09: shape borders and line strokes share editable color/width/pattern controls.
 await page.getByRole('tab',{name:'Rita'}).click();
 const strokePanel=page.getByRole('tabpanel',{name:'Rita'});
 await strokePanel.getByLabel('Rita linjestil').selectOption('dashed');
 await strokePanel.getByLabel('Rita linjetjocklek').fill('8');
 await strokePanel.getByLabel('Rita linjetjocklek').press('Tab');
 await strokePanel.getByLabel('Rita linjefärg').fill('#0066cc');
 const styledArrow=(await model()).slides.flatMap(slide=>slide.view.elements).find(e=>e.id===endpointId);
 assert.equal(styledArrow.style.outline.dash,'dash');
 assert.equal(styledArrow.style.outline.width,8);
 assert.equal(styledArrow.style.outline.paint.color,'#0066cc');
 assert.ok((await page.locator('.stage [data-element-id="'+endpointId+'"] svg line').getAttribute('stroke-dasharray'))?.length,'SVG line renders dash pattern');
 const shapeId=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;return store.add('shape','ellipse');});
 await strokePanel.getByLabel('Rita linjestil').selectOption('dotted');
 await strokePanel.getByLabel('Rita linjetjocklek').fill('6');
 await strokePanel.getByLabel('Rita linjetjocklek').press('Tab');
 const styledShape=(await model()).slides.flatMap(slide=>slide.view.elements).find(e=>e.id===shapeId);
 assert.equal(styledShape.style.outline.dash,'dot');
 assert.equal(styledShape.style.outline.width,6);
 assert.ok((await page.locator('.stage [data-element-id="'+shapeId+'"] svg ellipse').getAttribute('stroke-dasharray'))?.length,'Ellipse renders dotted border');
 pass('SF-SH-09:stroke-style-and-width-for-lines-and-shapes');
 // SF-SH-10: text is stored on a shape, rendered inside it and editable in-place.
 const textShapeId=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;const id=store.add('shape','rect');store.updateElement(id,{geometry:{x:35,y:35,width:340,height:140,rotation:0,unit:'logical'}});return id;});
 const shapeNode=page.locator('.stage [data-element-id="'+textShapeId+'"]');
 await shapeNode.dblclick();
 const shapeEditor=page.getByRole('group',{name:'Redigera text på bilden'});
 assert.equal(await shapeEditor.isVisible(),true,'Double-clicking shape opens text editor');
 await shapeEditor.getByRole('textbox',{name:'Redigera objektets text'}).fill('Beslut fattat');
 await shapeEditor.getByRole('button',{name:'Klar'}).click();
 const afterShapeText=(await model()).slides.flatMap(slide=>slide.view.elements).find(e=>e.id===textShapeId);
 assert.ok(JSON.stringify(afterShapeText.text).includes('Beslut fattat'),'Shape stores rich text on same object');
 assert.equal(await shapeNode.locator('.shape-text').innerText(),'Beslut fattat');
 await page.evaluate(async id=>{const store=(await import('/src/core/editor.ts')).editorStore;store.updateElement(id,{geometry:{x:70,y:50,width:400,height:180,rotation:0,unit:'logical'}});},textShapeId);
 assert.equal(await shapeNode.locator('.shape-text').innerText(),'Beslut fattat','Shape text follows geometry changes');
 pass('SF-SH-10:editable-shape-text');
 // SF-SH-12: bound endpoints track named shape ports, including during pointer moves.
 const connection=await page.evaluate(async()=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  const first=store.add('shape','rect');store.updateElement(first,{geometry:{x:120,y:120,width:150,height:90,rotation:0,unit:'logical'}});
  const second=store.add('shape','rect');store.updateElement(second,{geometry:{x:520,y:120,width:150,height:90,rotation:0,unit:'logical'}});
  const line=store.add('arrow');store.updateElement(line,{startAnchor:{elementId:first,port:'right'},endAnchor:{elementId:second,port:'left'}});
  return {first,second,line};
 });
 const connectionNode=page.locator('.stage [data-element-id="'+connection.line+'"] svg line');
 const lineStart=()=>connectionNode.getAttribute('x1');
 const originalX=await lineStart();
 const firstNode=page.locator('.stage [data-element-id="'+connection.first+'"]');
 const firstBox=await firstNode.boundingBox();assert.ok(firstBox);
 await page.mouse.move(firstBox.x+30,firstBox.y+30);
 await page.mouse.down();
 await page.mouse.move(firstBox.x+70,firstBox.y+60,{steps:5});
 assert.notEqual(await lineStart(),originalX,'Connected line follows shape during drag, before mouseup');
 await page.mouse.up();
 assert.notEqual(await lineStart(),originalX,'Connected line remains attached after drop');
 const afterConnect=(await model()).slides.flatMap(s=>s.view.elements).find(e=>e.id===connection.line);
 assert.equal(afterConnect.startAnchor.elementId,connection.first);
 assert.equal(afterConnect.startAnchor.port,'right');
 assert.equal(afterConnect.endAnchor.port,'left');
 pass('SF-SH-12:attached-line-follows-shape-live');
 // SF-SH-13: assembled visual acceptance fixture, PPD validation, and editable PPTX.
 await page.evaluate(async({first,second,line})=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  store.updateElement(first,{text:{paragraphs:[{id:'acceptance-p',runs:[{text:'Beslut'}]}]}});
  store.updateElement(line,{style:{stroke:{color:'#0066cc'},strokeWidth:7},
   extensions:{slideFableStrokeStyle:'dashed',slideFableEndMarkers:{start:'circle',end:'filledArrow'}}});
  store.select([line]);
 },connection);
 const configuredLine=page.locator('.stage [data-element-id="'+connection.line+'"]');
 assert.equal(await configuredLine.locator('svg circle.line-end-marker').count(),1);
 assert.equal(await configuredLine.locator('svg polygon.line-end-marker').count(),1);
 assert.ok((await configuredLine.locator('svg line').getAttribute('stroke-dasharray'))?.length);
 assert.equal(await page.locator('.stage [data-element-id="'+connection.first+'"] .shape-text').innerText(),'Beslut');
 const accepted=await page.evaluate(async({first,second,line})=>{
  const store=(await import('/src/core/editor.ts')).editorStore;
  const source=store.getSnapshot().doc;
  const {copy}=await import('/src/core/model.ts');
  const {validateFull}=await import('/src/core/contract.ts');
  const {pptxExport,preflight}=await import('/src/export/office.ts');
  const doc=copy(source);
  await validateFull(doc);
  const exported=await pptxExport(doc,doc.slides);
  return {pptx:Array.from(exported.file),report:preflight(doc,'pptx')};
 },connection);
 const acceptanceZip=await JSZip.loadAsync(new Uint8Array(accepted.pptx));
 const acceptanceXml=(await Promise.all(Object.keys(acceptanceZip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).map(n=>acceptanceZip.file(n).async('string')))).join('');
 assert.ok(acceptanceXml.includes('Beslut'),'Shape text should survive editable PowerPoint export');
 assert.ok(acceptanceXml.includes('0066CC'),'Connection stroke color should survive PowerPoint export');
 assert.ok(acceptanceXml.includes('dash'),'Connection dash pattern should survive PowerPoint export');
 assert.equal(accepted.report.objects.filter(o=>[connection.first,connection.second,connection.line].includes(o.elementId)&&o.status==='native').length,3,'Forms and line remain native editable PPTX objects');
 await writeFile(path.join(output,'sf-sh-13-acceptance.pptx'),new Uint8Array(accepted.pptx));
 await page.screenshot({path:path.join(output,'sf-sh-13-shapes-and-connectors.png'),fullPage:true});
 pass('SF-SH-13:combined-shape-text-connector-symbol-pattern-and-editable-PPTX');





 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['phone',390,844]]){
  await page.setViewportSize({width,height});
  await page.getByRole('tab',{name:'Visa'}).click();
  await page.getByRole('button',{name:'Dölj verktyg'}).click();
  assert.equal(await page.locator('#slide-ribbon-panel').isVisible(),false,name+': ribbon panel must be hidden');
  assert.equal(await page.getByRole('tab',{name:'Visa'}).isVisible(),true,name+': primary tabs must remain visible');
  assert.equal(await page.locator('.editor-canvas-pane .stage').isVisible(),true,name+': stage must remain visible');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),name+': no horizontal page overflow');
  await page.screenshot({path:path.join(output,name+'-compact-ribbon.png'),fullPage:true});
  await page.getByRole('tab',{name:'Infoga'}).click();
  assert.equal(await page.locator('#slide-ribbon-panel').isVisible(),true,name+': selecting a tab must restore tools');
  
  if(name!=='desktop'){
   const fit=await page.evaluate(()=>{const viewport=document.querySelector('.canvas-scroll')?.getBoundingClientRect(),slide=document.querySelector('.stage-space')?.getBoundingClientRect();return {viewportWidth:viewport?.width??0,viewportHeight:viewport?.height??0,slideWidth:slide?.width??0,slideHeight:slide?.height??0};});
   assert.ok(fit.slideWidth>=fit.viewportWidth*0.42,name+': fitted slide should occupy meaningful canvas width: '+JSON.stringify(fit));
   assert.ok(fit.slideHeight>=130,name+': fitted slide should be usable in portrait: '+JSON.stringify(fit));
   assert.ok(fit.slideWidth<=fit.viewportWidth+2,name+': slide width should fit the viewport');
   pass('SF-UX-22:usable-portrait-slide-'+name);
  }
 if(name==='phone'){
  const header=await page.locator('.editor-header').boundingBox();
  assert.ok(header&&header.height<=115,'Mobile header must stay compact: '+JSON.stringify(header));
  assert.equal(await page.locator('.editor-header .editor-menu-disclosure > summary').isVisible(),true,'Document commands stay reachable on phone');
  pass('SF-UX-23:compact-mobile-header');
 }
 pass('SF-UX-21:compact-ribbon-'+name);
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['phone',390,844]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(width<=800){await page.getByRole('button',{name:'Egenskaper',exact:true}).click();await page.getByRole('button',{name:'Objekt',exact:true}).waitFor();if(width<=800){const sheet=page.locator('#slide-properties');assert.equal(await sheet.isVisible(),true,name+': inspector opens');const metrics=await page.evaluate(()=>{const sheet=document.querySelector('#slide-properties'),canvas=document.querySelector('.editor-canvas-pane');const a=sheet.getBoundingClientRect(),b=canvas.getBoundingClientRect();return {sheetBottom:a.bottom,canvasBottom:b.bottom,position:getComputedStyle(sheet).position,screenWidth:document.documentElement.scrollWidth};});assert.equal(metrics.position,'relative',name+': sheet must not float above canvas');
 assert.ok(metrics.sheetBottom>metrics.canvasBottom-1,name+': portrait sheet follows the workspace canvas');assert.ok(metrics.sheetBottom>=metrics.canvasBottom-1,name+': sheet must follow canvas');assert.ok(metrics.screenWidth<=width,name+': sheet must not cause horizontal overflow');await sheet.getByRole('button',{name:'Stäng egenskapspanel'}).click();assert.equal(await sheet.isVisible(),false,name+': close hides inspector');}await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();}await page.getByRole('tab',{name:'Infoga'}).click();const picker=page.locator('.shape-picker');assert.equal(await picker.locator('summary').isVisible(),true,name+': shape picker reachable');await picker.evaluate(el=>{el.open=false;});await picker.locator('summary').click();assert.equal(await picker.evaluate(el=>el.open),true,name+': shape gallery opens');assert.equal(await picker.locator('button',{hasText:'Triangel'}).isVisible(),true,name+': gallery choices visible');await picker.locator('button',{hasText:'Triangel'}).click();assert.equal(await picker.evaluate(el=>el.open),false,name+': gallery closes after insertion');await page.getByRole('tab',{name:'Rita'}).click();assert.equal(await page.getByRole('tabpanel',{name:'Rita'}).getByLabel('Rita linjefärg').count(),1,name+': draw formatting available');pass('SF-SH-06:shape-gallery-and-draw-'+name);await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});pass('responsive:'+name);}
 await page.setViewportSize({width:1024,height:1366});
 await page.getByRole('navigation',{name:'Arbetsytans paneler'}).getByRole('button',{name:'Egenskaper',exact:true}).click();
 await page.locator('#slide-properties').waitFor({state:'visible'});
 const ipadPortrait=await page.evaluate(()=>{
  const inspector=document.querySelector('#slide-properties').getBoundingClientRect();
  const canvas=document.querySelector('.editor-canvas-pane').getBoundingClientRect();
  return {inspectorTop:inspector.top,canvasBottom:canvas.bottom,inspectorRight:inspector.right,
   viewportWidth:innerWidth,position:getComputedStyle(document.querySelector('#slide-properties')).position};
 });
 assert.equal(ipadPortrait.position,'relative','1024px portrait inspector must be docked');
 assert.ok(ipadPortrait.inspectorTop>=ipadPortrait.canvasBottom-1,'1024px portrait inspector must follow canvas');
 assert.ok(ipadPortrait.inspectorRight<=ipadPortrait.viewportWidth+2,'1024px portrait inspector must fit width');
 pass('UX-004:ipad-1024px-portrait-inspector');
 await page.setViewportSize({width:1440,height:1000});
 for(const [width,height] of [[820,1180],[900,1200],[1024,1366]]){
  await page.setViewportSize({width,height});
  const toggle=page.locator('.properties-toggle');
  if(await page.getByRole('navigation',{name:'Arbetsytans paneler'}).isVisible())await page.getByRole('navigation',{name:'Arbetsytans paneler'}).getByRole('button',{name:'Egenskaper',exact:true}).click();else if((await toggle.getAttribute('aria-expanded'))!=='true')await toggle.click();
  await page.locator('#slide-properties').waitFor({state:'visible'});
  const p=await page.evaluate(()=>{
   const pane=document.querySelector('#slide-properties');
   const rect=pane.getBoundingClientRect();
   return {display:getComputedStyle(pane).display,left:rect.left,right:rect.right,width:innerWidth};
  });
  assert.notEqual(p.display,'none',width+': inspector visible when toggled open');
  assert.ok(p.right<=p.width+2,width+': inspector within viewport');
  const responsiveNav=page.getByRole('navigation',{name:'Arbetsytans paneler'});if(await responsiveNav.isVisible())await responsiveNav.getByRole('button',{name:'Arbetsyta',exact:true}).click();else await toggle.click();
  assert.equal(await page.locator('#slide-properties').isVisible(),false,width+': toggle closes inspector');
  if(await responsiveNav.isVisible())await responsiveNav.getByRole('button',{name:'Egenskaper',exact:true}).click();else await toggle.click();
  assert.equal(await page.locator('#slide-properties').isVisible(),true,width+': toggle reopens inspector');
  pass('UX-portrait:inspector-visibility-'+width);
 }
 await page.setViewportSize({width:1440,height:1000});
 const surfaceSupport=await page.evaluate(async()=>{
  const {elementStyle}=await import('/src/editor/Renderer.tsx');
  const doc=(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc;
  const style={fill:{color:'#ABCDEF'},stroke:{color:'#123456'},strokeWidth:4};
  const geometry={x:0,y:0,width:100,height:50,rotation:0};
  const text=elementStyle(doc,{type:'text',geometry,style});
  const shape=elementStyle(doc,{type:'shape',geometry,style});
  return {textBackground:text.background??null,textBorder:text.border??null,
   shapeBackground:shape.background??null,shapeBorder:shape.border??null};
 });
 assert.ok(surfaceSupport.shapeBackground,'Shape surface is rendered');
 assert.ok(surfaceSupport.shapeBorder.includes('4px'),'Shape stroke is rendered');
 // Record the current text rendering gap explicitly until UX-005 implements it.
 assert.ok(surfaceSupport.textBackground,'Text fill is rendered');
 assert.ok(surfaceSupport.textBorder?.includes('4px'),'Text stroke is rendered');
 pass('PPD-040:text-surface-rendered');
 const ppd040Exports=await page.evaluate(async()=>{
  const {createPpd040}=await import('/src/core/ppd040Document.ts');
  const {EditorStore}=await import('/src/core/editor.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createPpd040();doc.slides[0].view.elements=[];
  const editor=new EditorStore(doc);
  const id=editor.add('shape');
  editor.updateElement(id,{style:{fill:{color:'#FFEECC'},outline:{paint:{color:'#123456'},width:3,dash:'dash'}}});
  const textId=editor.add('text');
  editor.updateElement(textId,{style:{fill:{color:'#FFFFFF'},outline:{paint:{color:'#445566'},width:2}}});
  const current=editor.getSnapshot().doc;
  const pdf=await pdfExport(current,current.slides);
  const pptx=await pptxExport(current,current.slides);
  return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file),pdfReport:pdf.report,pptxReport:pptx.report,ids:[id,textId]};
 });
 const {PDFDocument}=await import('pdf-lib');
 const outputPdf=await PDFDocument.load(Uint8Array.from(ppd040Exports.pdf));
 assert.equal(outputPdf.getPageCount(),1,'PPD 0.4 actual PDF can be opened');
 assert.ok(ppd040Exports.pdf.length>500,'nonempty PDF');
 const pptxArchive=await JSZip.loadAsync(Uint8Array.from(ppd040Exports.pptx));
 assert.ok(pptxArchive.file('ppt/slides/slide1.xml'),'PPD 0.4 PPTX has first slide');
 const pptxXml=await pptxArchive.file('ppt/slides/slide1.xml').async('string');
 assert.ok(pptxXml.includes('123456'),'PPTX preserves canonical outline color');
 assert.ok(pptxXml.includes('FFEECC'),'PPTX preserves fill color');
 for(const report of [ppd040Exports.pdfReport,ppd040Exports.pptxReport])
  for(const id of ppd040Exports.ids)assert.ok(report.objects.some(item=>item.elementId===id),'export report includes object '+id);
 pass('PPD-040:real-pdf-pptx-artifacts');
 // Render a dedicated PPD 0.4 slide and verify measured styles and visible object geometry.
 await page.evaluate(async()=>{
  const {createPpd040}=await import('/src/core/ppd040Document.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createPpd040(),slide=doc.slides[0];
  slide.view.elements=[
   {id:'visual-text',type:'text',geometry:{x:50,y:40,width:360,height:120},text:'PPD text',style:{fill:{color:'#FFEECC'},outline:{paint:{color:'#123456'},width:4},fontSize:32}},
   {id:'visual-shape',type:'shape',shapeType:'rect',geometry:{x:460,y:40,width:260,height:120},style:{fill:{color:'#CCDDFF'},outline:{paint:{color:'#445566'},width:3}}},
   {id:'visual-line',type:'line',geometry:{x:60,y:250,width:510,height:10},style:{outline:{paint:{color:'#EE5500'},width:5,dash:'dash'}}},
   {id:'visual-table',type:'table',geometry:{x:60,y:340,width:520,height:190},cells:[[{id:'cell-v1',text:'Kolumn A'},{id:'cell-v2',text:'Kolumn B'}]]}
  ];
  editorStore.load(doc);
 });
 for(const id of ['visual-text','visual-shape','visual-line','visual-table'])
  await page.locator('[data-element-id="'+id+'"]').first().waitFor({state:'visible'});
 const visual040=await page.evaluate(()=>{
  const sample=id=>{const el=document.querySelector('[data-element-id="'+id+'"]');const css=getComputedStyle(el);const rect=el.getBoundingClientRect();return {background:css.backgroundColor,border:css.border,width:rect.width,height:rect.height};};
  return {text:sample('visual-text'),shape:sample('visual-shape'),line:sample('visual-line'),tableVisible:!!document.querySelector('[data-element-id="visual-table"] table')};
 });
 assert.match(visual040.text.background,/255, 238, 204/,'PPD 0.4 text background');
 assert.match(visual040.text.border,/4px/,'PPD 0.4 text outline');
 assert.match(visual040.shape.background,/204, 221, 255/,'PPD 0.4 shape fill');
 assert.match(visual040.shape.border,/3px/,'PPD 0.4 shape outline');
 assert.ok(visual040.line.width>0,'PPD 0.4 line has visual width');
 assert.ok(visual040.tableVisible,'PPD 0.4 table renders');
 await page.screenshot({path:path.join(output,'ppd040-visual-regression.png')});
 pass('PPD-040:browser-visual-regression-screenshot');
 const richVisual=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createDocument(),slide=doc.slides[0];
  slide.view.elements=[{id:'run-format-check',type:'text',geometry:{x:40,y:50,width:700,height:150},text:{paragraphs:[{id:'run-p',runs:[{text:'Highlighted',highlight:'#FFFF00',baseline:'superscript',letterSpacing:2}]}]}}];
  editorStore.load(doc);
  return doc.schemaVersion;
 });
 assert.equal(richVisual,'0.4.0');
 const run=page.locator('[data-element-id="run-format-check"] [data-run]').first();
 await run.waitFor({state:'visible'});
 const richStyle=await run.evaluate(el=>{const cs=getComputedStyle(el);return {background:cs.backgroundColor,baseline:cs.verticalAlign,spacing:cs.letterSpacing};});
 assert.match(richStyle.background,/255, 255, 0/,'PPD 0.4 run highlight is rendered');
 assert.equal(richStyle.baseline,'super','PPD 0.4 superscript is rendered');
 assert.equal(richStyle.spacing,'2px','PPD 0.4 character spacing is rendered');
 pass('PPD-040:rich-run-visual-formatting');
 const editorRunConversion=await page.evaluate(async()=>{
  const {toEditor,fromEditor}=await import('/src/editor/RichEditor.tsx');
  const original={paragraphs:[{id:'rich-paragraph',runs:[
   {text:'Highlight',highlight:'#FFEE00',baseline:'superscript',letterSpacing:1.5,marks:{bold:true}},
   {text:'Sub',baseline:'subscript',letterSpacing:0},
   {text:'Normal',baseline:'normal'},
   {text:'Hej',color:'#123456',size:28,fontFamily:'Arial',highlight:'#AABBCC',letterSpacing:2}
  ]}]};
  return fromEditor(toEditor(original),original);
 });
 const convertedRuns=editorRunConversion.paragraphs[0].runs;
 assert.equal(convertedRuns[0].highlight,'#FFEE00');
 assert.equal(convertedRuns[0].baseline,'superscript');
 assert.equal(convertedRuns[0].letterSpacing,1.5);
 assert.deepEqual(convertedRuns[0].marks,{bold:true});
 assert.equal(convertedRuns[1].baseline,'subscript');
 assert.equal(convertedRuns[1].letterSpacing,0);
 assert.equal(convertedRuns[2].baseline,undefined);
 assert.equal(convertedRuns[3].color,'#123456');
 assert.equal(convertedRuns[3].size,28);
 assert.equal(convertedRuns[3].fontFamily,'Arial');
 assert.equal(convertedRuns[3].highlight,'#AABBCC');
 pass('PPD-040:rich-editor-run-attribute-roundtrip');
 const richExports=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument(),slide=doc.slides[0];
  slide.view.elements=[{id:'rich-export',type:'text',geometry:{x:80,y:100,width:900,height:220},style:{fontSize:48},text:{paragraphs:[{id:'rich-export-p',runs:[
   {text:'HIGHLIGHT',highlight:'#FFFF00',letterSpacing:2},
   {text:'UP',baseline:'superscript'},
   {text:'DOWN',baseline:'subscript'}
  ]}]}}];
  const pdf=await pdfExport(doc,doc.slides);
  const pptx=await pptxExport(doc,doc.slides);
  return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file)};
 });
 const richPdf=await PDFDocument.load(Uint8Array.from(richExports.pdf));
 assert.equal(richPdf.getPageCount(),1,'rich PDF can be opened');
 const richZip=await JSZip.loadAsync(Uint8Array.from(richExports.pptx));
 const richXml=await richZip.file('ppt/slides/slide1.xml').async('string');
 assert.ok(richXml.includes('HIGHLIGHT'),'editable highlighted text remains in PPTX');
 assert.ok(richXml.includes('UP')&&richXml.includes('DOWN'),'superscript and subscript text remains in PPTX');
 assert.ok(richXml.includes('FFFF00'),'PPTX carries highlight color');
 assert.ok(/spc=/.test(richXml),'PPTX carries character spacing');
 pass('PPD-040:rich-run-real-pdf-pptx-export');
 await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createDocument();
  doc.slides[0].view.elements=[{id:'table-layout-040',type:'table',geometry:{x:60,y:80,width:700,height:300},tableLayout:{columnWidths:[250,450],rowHeights:[130],cellPadding:[4,8,12,16],collapseBorders:false},cells:[[{id:'column-a',text:'A'},{id:'column-b',text:'B'}]]}];
  editorStore.load(doc);
 });
 await page.locator('.stage [data-element-id="table-layout-040"] table').first().waitFor({state:'visible'});
 const layout040=await page.evaluate(()=>{
  const table=document.querySelector('.stage [data-element-id="table-layout-040"] table');
  const cells=table.querySelectorAll('td');
  const columns=table.querySelectorAll('col');
  return {collapse:getComputedStyle(table).borderCollapse,padding:getComputedStyle(cells[0]).padding,
   widths:[...columns].map(c=>c.style.width),height:getComputedStyle(table.querySelector('tr')).height};
 });
 assert.equal(layout040.collapse,'separate');
 assert.equal(layout040.padding,'4px 8px 12px 16px');
 assert.deepEqual(layout040.widths,['250px','450px']);
 assert.ok(parseFloat(layout040.height)>=130);
 pass('PPD-040:table-layout-rendering');
 await page.locator('.stage [data-element-id="table-layout-040"]').first().click();
 const tableControls=page.getByLabel('Kolumn 1 bredd');
 await tableControls.waitFor({state:'visible'});
 await tableControls.fill('300');
 await tableControls.press('Tab');
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id==='table-layout-040').tableLayout.columnWidths[0],300);
 await page.getByLabel('Överkant cellmarginal').fill('9');
 await page.getByLabel('Överkant cellmarginal').press('Tab');
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id==='table-layout-040').tableLayout.cellPadding[0],9);
 pass('PPD-040:table-layout-inspector-controls');
 await page.locator('.stage [data-element-id="table-layout-040"]').first().click();
 const borderDetails=page.getByText('Kantlinjer',{exact:true}).first();
 await borderDetails.click();
 await page.getByLabel('Cell 1 1 top bredd').fill('5');
 await page.getByLabel('Cell 1 1 top bredd').press('Tab');
 const savedBorder=(await model()).slides[0].view.elements.find(e=>e.id==='table-layout-040').cells[0][0].borders.top;
 assert.equal(savedBorder.width,5,'border is stored in canonical PPD 0.4 cell model');
 const borderWidth=await page.locator('.stage [data-element-id="table-layout-040"] td').first().evaluate(el=>getComputedStyle(el).borderTopWidth);
 assert.equal(borderWidth,'5px','top edge renders its own width');
 pass('PPD-040:individual-table-cell-edge-borders');
 const edgeExport=await page.evaluate(async()=>{
  const {pptxExport}=await import('/src/export/office.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=structuredClone(editorStore.getSnapshot().doc);
  const cell=doc.slides[0].view.elements.find(e=>e.id==='table-layout-040').cells[0][0];
  cell.borders={top:{width:5,paint:{color:'#FF0000'}},right:{width:3,paint:{color:'#00FF00'}},bottom:{width:4,paint:{color:'#0000FF'}},left:{width:2,paint:{color:'#AA00AA'}}};
  return Array.from((await pptxExport(doc,doc.slides)).file);
 });
 const edgeZip=await JSZip.loadAsync(Uint8Array.from(edgeExport));
 const edgeXml=await edgeZip.file('ppt/slides/slide1.xml').async('string');
 for(const color of ['FF0000','00FF00','0000FF','AA00AA'])assert.ok(edgeXml.includes(color),'PPTX preserves cell edge '+color);
 for(const edge of ['lnT','lnR','lnB','lnL'])assert.ok(edgeXml.includes('<a:'+edge),'PPTX has native editable border '+edge);
 pass('PPD-040:pptx-individual-cell-edge-export');


 const tableExportCheck=await page.evaluate(async()=>{
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=editorStore.getSnapshot().doc;
  const pdf=await pdfExport(doc,doc.slides),pptx=await pptxExport(doc,doc.slides);
  return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file)};
 });
 const tablePdf=await PDFDocument.load(Uint8Array.from(tableExportCheck.pdf));
 assert.ok(tablePdf.getPageCount()>0,'exported table PDF opens');
 const tablePptx=await JSZip.loadAsync(Uint8Array.from(tableExportCheck.pptx));
 const tableXml=await tablePptx.file('ppt/slides/slide1.xml').async('string');
 assert.ok(tableXml.includes('column-a')||tableXml.includes('A'),'table content survives PPTX');
 assert.match(tableXml,/<a:tblGrid>/,'table grid remains native PowerPoint table');
 pass('PPD-040:table-real-pdf-pptx-export');

 // Regression: edits -> strict PPD 0.4 JSON -> IndexedDB draft -> reopen -> render -> native exports.
 const tableRoundTrip=await page.evaluate(async()=>{
  const {editorStore}=await import('/src/core/editor.ts');
  const {writePpd040Json,readPpd040Json}=await import('/src/core/ppd040Document.ts');
  const {saveDraft,listDrafts,deleteDraft}=await import('/src/core/persistence.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const before=structuredClone(editorStore.getSnapshot().doc);
  const table=before.slides[0].view.elements.find(e=>e.id==='table-layout-040');
  const snapshot={widths:table.tableLayout.columnWidths,padding:table.tableLayout.cellPadding,border:table.cells[0][0].borders.top};
  const opened=readPpd040Json(writePpd040Json(before));
  opened.document.id=crypto.randomUUID(); const draftId=opened.document.id;
  let saved;
  try{
   const version=await saveDraft(opened,null,'table-regression');
   const draft=(await listDrafts()).find(d=>d.id===draftId);
   if(!draft||draft.version!==version)throw Error('TABLE_DRAFT_NOT_SAVED');
   saved=readPpd040Json(writePpd040Json(draft.model));
  }finally{
   await deleteDraft(draftId);
  }
  editorStore.load(saved);
  const reopened=saved.slides[0].view.elements.find(e=>e.id==='table-layout-040');
  const outputs=await Promise.all([pdfExport(saved,saved.slides),pptxExport(saved,saved.slides)]);
  return {version:saved.schemaVersion,expected:snapshot,actual:{
   widths:reopened.tableLayout.columnWidths,
   padding:reopened.tableLayout.cellPadding,
   border:reopened.cells[0][0].borders.top
  },pdf:Array.from(outputs[0].file),pptx:Array.from(outputs[1].file)};
 });
 assert.equal(tableRoundTrip.version,'0.4.0');
 assert.deepEqual(tableRoundTrip.actual,tableRoundTrip.expected,'table formatting survives JSON and IndexedDB');
 const reopenedCell=page.locator('.stage [data-element-id="table-layout-040"] td').first();
 await reopenedCell.waitFor({state:'visible'});
 assert.equal(await reopenedCell.evaluate(el=>getComputedStyle(el).borderTopWidth),'5px','reopened table has native top border');
 assert.equal(await reopenedCell.evaluate(el=>getComputedStyle(el).paddingTop),'9px','reopened table retains cell padding');
 const reopenedPdf=await PDFDocument.load(Uint8Array.from(tableRoundTrip.pdf));
 assert.ok(reopenedPdf.getPageCount()>0,'reopened table exports a valid PDF');
 const reopenedZip=await JSZip.loadAsync(Uint8Array.from(tableRoundTrip.pptx));
 const reopenedXml=await reopenedZip.file('ppt/slides/slide1.xml').async('string');
 assert.match(reopenedXml,/<a:tblGrid>/,'reopened table exports as editable PPTX table');
 assert.match(reopenedXml,/<a:lnT\b/,'edited top border survives PPTX export');
 assert.match(reopenedXml,/<a:gridCol\b/,'column widths survive as native PPTX grid');
 pass('PPD-040:table-edit-save-reopen-render-pdf-pptx');


 // PPD 0.4 object flip: inspector edits, presentation rendering and strict JSON roundtrip.
 await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createDocument();
  doc.slides[0].view.elements=[{id:'flip-shape-040',type:'shape',shapeType:'rect',geometry:{x:100,y:100,width:200,height:120,rotation:30},style:{fill:{color:'#387F89'}}}];
  editorStore.load(doc);
 });
 await page.locator('.stage [data-element-id="flip-shape-040"]').first().click();
 await page.getByLabel('Spegla horisontellt').check();
 await page.getByLabel('Spegla vertikalt').check();
 const flippedModel=(await model()).slides[0].view.elements.find(e=>e.id==='flip-shape-040');
 assert.equal(flippedModel.flipX,true);
 assert.equal(flippedModel.flipY,true);
 const flipTransform=await page.locator('.stage [data-element-id="flip-shape-040"]').first().evaluate(el=>el.style.transform);
 assert.match(flipTransform,/rotate\(30deg\)/,'rotation is retained while flipping');
 assert.match(flipTransform,/scale\(-1, -1\)/,'both flips render around the object center');
 const flipRoundtrip=await page.evaluate(async()=>{
  const {writePpd040Json,readPpd040Json}=await import('/src/core/ppd040Document.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const reopened=readPpd040Json(writePpd040Json(editorStore.getSnapshot().doc));
  return reopened.slides[0].view.elements.find(e=>e.id==='flip-shape-040');
 });
 assert.equal(flipRoundtrip.flipX,true);
 assert.equal(flipRoundtrip.flipY,true);
 await page.getByLabel('Spegla horisontellt').uncheck();
 assert.equal((await model()).slides[0].view.elements.find(e=>e.id==='flip-shape-040').flipX,false);
 pass('PPD-040:object-flip-inspector-render-and-json-roundtrip');

 const flipArtifacts=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument();
  doc.slides[0].view.elements=[
   {id:'flipped-shape-export',type:'shape',shapeType:'triangle',geometry:{x:80,y:110,width:300,height:180},style:{fill:{color:'#387F89'}},flipX:true,flipY:true},
   {id:'flipped-text-export',type:'text',geometry:{x:420,y:120,width:360,height:100},text:'Mirrored',flipX:true}
  ];
  const [pdf,pptx]=await Promise.all([pdfExport(doc,doc.slides),pptxExport(doc,doc.slides)]);
  return {pdf:Array.from(pdf.file),pptx:Array.from(pptx.file),pdfReport:pdf.report};
 });
 const flipPdf=await PDFDocument.load(Uint8Array.from(flipArtifacts.pdf));
 assert.equal(flipPdf.getPageCount(),1,'flipped objects are exportable to a valid PDF');
 assert.ok(flipArtifacts.pdfReport.objects.some(o=>o.elementId==='flipped-shape-export'&&o.status==='rasterized'),'PDF uses visual fallback for flipped shapes');
 const flipZip=await JSZip.loadAsync(Uint8Array.from(flipArtifacts.pptx));
 const flipXml=await flipZip.file('ppt/slides/slide1.xml').async('string');
 // Two perpendicular flips are equivalent to a 180-degree rotation.
 // The exporter canonicalizes this transform rather than emitting both flags.
 assert.match(flipXml,/<a:xfrm[^>]*rot="10800000"/,'PPTX preserves the equivalent 180-degree native shape orientation');
 assert.match(flipXml,/<p:sp>/,'PPTX shape remains editable');
 pass('PPD-040:object-flip-real-pdf-pptx-export');


 const groupExport=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {flatten}=await import('/src/export/officeShared.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument();
  const group={id:'group-flip',type:'group',geometry:{x:100,y:120,width:500,height:250,rotation:25},transform:{x:0,y:0,width:500,height:250},flipX:true,children:['group-shape-a','group-shape-b']};
  const shape=(id,x)=>({id,type:'shape',shapeType:'triangle',geometry:{x,y:30,width:120,height:90},style:{fill:{color:'#387F89'}}});
  doc.slides[0].view.elements=[group,shape('group-shape-a',25),shape('group-shape-b',215)];
  const objects=flatten(doc,doc.slides[0]).filter(e=>e.type==='shape').map(e=>({id:e.id,flipX:e.flipX,flipY:e.flipY,rotation:e.geometry.rotation,x:e.geometry.x}));
  const [pdf,pptx]=await Promise.all([pdfExport(doc,doc.slides),pptxExport(doc,doc.slides)]);
  return {objects,pdf:Array.from(pdf.file),pptx:Array.from(pptx.file)};
 });
 assert.equal(groupExport.objects.length,2,'group children remain exportable objects');
 assert.ok(groupExport.objects.every(e=>e.flipX===true),'group mirror propagates to children');
 assert.ok(groupExport.objects.every(e=>Math.abs(e.rotation-25)<.01),'group rotation remains on children');
 assert.ok(groupExport.objects[0].x>groupExport.objects[1].x,'group horizontal mirror reverses child positions');
 const groupPdf=await PDFDocument.load(Uint8Array.from(groupExport.pdf));
 assert.equal(groupPdf.getPageCount(),1,'mirrored group PDF opens');
 const groupPptx=await JSZip.loadAsync(Uint8Array.from(groupExport.pptx));
 const groupXml=await groupPptx.file('ppt/slides/slide1.xml').async('string');
 assert.ok((groupXml.match(/flipH="1"/g)??[]).length>=2,'native PPTX child shapes keep group mirroring');
 assert.ok((groupXml.match(/<p:sp>/g)??[]).length>=2,'group members remain editable PowerPoint shapes');
 pass('PPD-040:group-mirror-rotation-native-pptx-and-pdf');

 const nestedTransforms=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {flatten}=await import('/src/export/officeShared.ts');
  const {pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument();
  const frame=(id,x,flipX,flipY,children)=>({id,type:'group',geometry:{x,y:0,width:200,height:160,rotation:0},transform:{x:0,y:0,width:200,height:160},flipX,flipY,children});
  const shape=(id)=>({id,type:'shape',shapeType:'triangle',geometry:{x:30,y:20,width:80,height:60,rotation:0},style:{fill:{color:'#387F89'}}});
  doc.slides[0].view.elements=[
   frame('outer-double',30,true,false,['inner-double']),
   frame('inner-double',0,true,false,['shape-double']),shape('shape-double'),
   frame('outer-vertical',280,false,true,['inner-vertical']),
   frame('inner-vertical',0,false,false,['shape-vertical']),shape('shape-vertical'),
   frame('outer-mixed',530,false,true,['inner-mixed']),
   frame('inner-mixed',0,true,false,['shape-mixed']),shape('shape-mixed'),
   frame('outer-rotated',780,true,false,['inner-rotated']),
   {...frame('inner-rotated',0,false,true,['shape-rotated']),geometry:{x:0,y:0,width:200,height:160,rotation:30}},
   shape('shape-rotated')
  ];
  const elements=flatten(doc,doc.slides[0]).filter(e=>e.type==='shape').map(e=>({id:e.id,flipX:e.flipX,flipY:e.flipY,rotation:e.geometry.rotation}));
  const result=await pptxExport(doc,doc.slides);
  return {elements,pptx:Array.from(result.file)};
 });
 const nestedById=Object.fromEntries(nestedTransforms.elements.map(e=>[e.id,e]));
 assert.equal(nestedById['shape-double'].flipX,false,'two horizontal mirrors cancel');
 assert.equal(nestedById['shape-double'].flipY,false);
 assert.ok(Math.abs(nestedById['shape-double'].rotation)<.01,'canceled mirrors do not introduce rotation');
 assert.equal(nestedById['shape-vertical'].flipX,true,'vertical mirror decomposes to mirrored X and half-turn');
 assert.ok(Math.abs(Math.abs(nestedById['shape-vertical'].rotation)-180)<.01,'vertical mirror retains equivalent native orientation');
 assert.equal(nestedById['shape-mixed'].flipX,false,'opposite-axis mirrors compose to a half-turn');
 assert.ok(Math.abs(Math.abs(nestedById['shape-mixed'].rotation)-180)<.01);
 assert.equal(nestedById['shape-rotated'].flipX,false,'nested rotation with two mirrors remains orientation-preserving');
 const nestedPptx=await JSZip.loadAsync(Uint8Array.from(nestedTransforms.pptx));
 const nestedXml=await nestedPptx.file('ppt/slides/slide1.xml').async('string');
 assert.ok((nestedXml.match(/<p:sp>/g)??[]).length>=4,'nested group children export as editable native shapes');
 pass('PPD-040:nested-groups-flip-composition-and-native-pptx');


 // Transformation parity: visible editor evidence + exported native PPTX placement and PDF validity.
 const parityData=await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const {flatten}=await import('/src/export/officeShared.ts');
  const {pdfExport,pptxExport}=await import('/src/export/office.ts');
  const doc=createDocument();
  const shape=(id,x,y)=>({id,type:'shape',shapeType:'triangle',geometry:{x,y,width:110,height:75},style:{fill:{color:'#387F89'}}});
  doc.slides[0].view.elements=[
   {id:'parity-outer',type:'group',geometry:{x:80,y:100,width:420,height:300,rotation:25},transform:{x:0,y:0,width:420,height:300},flipX:true,children:['parity-inner','parity-direct']},
   {id:'parity-inner',type:'group',geometry:{x:15,y:20,width:210,height:150,rotation:-15},transform:{x:0,y:0,width:210,height:150},flipY:true,children:['parity-nested']},
   shape('parity-nested',30,25),
   shape('parity-direct',260,100),
   {id:'parity-single',type:'shape',shapeType:'triangle',geometry:{x:580,y:160,width:170,height:100,rotation:40},flipY:true,style:{fill:{color:'#CF694C'}}}
  ];
  editorStore.load(doc);
  const objects=flatten(doc,doc.slides[0]).filter(e=>e.type==='shape').map(e=>({id:e.id,geometry:e.geometry,flipX:e.flipX,flipY:e.flipY}));
  const [pdf,pptx]=await Promise.all([pdfExport(doc,doc.slides),pptxExport(doc,doc.slides)]);
  return {objects,pdf:Array.from(pdf.file),pptx:Array.from(pptx.file),canvasWidth:doc.document.canvas.width};
 });
 for(const id of ['parity-nested','parity-direct','parity-single'])await page.locator(`.stage [data-element-id="${id}"]`).first().waitFor({state:'visible'});
 await page.screenshot({path:path.join(output,'ppd040-nested-transforms-editor.png'),fullPage:true});
 const parityPdf=await PDFDocument.load(Uint8Array.from(parityData.pdf));
 assert.equal(parityPdf.getPageCount(),1,'complex transform PDF is readable');
 const parityZip=await JSZip.loadAsync(Uint8Array.from(parityData.pptx));
 const parityXml=await parityZip.file('ppt/slides/slide1.xml').async('string');
 const units=parityData.canvasWidth/13.3333333333;
 const nativeShapes=[...parityXml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].map(([,body])=>{
  const transform=body.match(/<a:xfrm\b[^>]*>([\s\S]*?)<\/a:xfrm>/);
  const offset=transform?.[1].match(/<a:off\b[^>]*\bx="(\d+)"[^>]*\by="(\d+)"/);
  const extent=transform?.[1].match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
  return offset&&extent?{x:+offset[1],y:+offset[2],w:+extent[1],h:+extent[2]}:null;
 }).filter(Boolean);
 assert.equal(nativeShapes.length,3,'all transformed shapes remain native and editable in PPTX (native <p:sp> count: '+[...parityXml.matchAll(/<p:sp>/g)].length+')');
 for(const element of parityData.objects){
  const {geometry:g}=element;
  const expected={x:g.x/units*914400,y:g.y/units*914400,w:g.width/units*914400,h:g.height/units*914400};
  assert.ok(nativeShapes.some(shape=>Object.keys(expected).every(key=>Math.abs(shape[key]-expected[key])<4)),
   'native PPTX geometry matches flattened editor transform for '+element.id);
 }
 const browserTransforms=await page.evaluate(()=>['parity-outer','parity-inner','parity-nested','parity-direct','parity-single'].map(id=>{
  const el=document.querySelector(`.stage [data-element-id="${id}"]`);
  return {id,transform:el?.style.transform,visible:!!el&&el.getBoundingClientRect().width>0};
 }));
 assert.ok(browserTransforms.every(e=>e.visible),'all nested objects are visible in the editor');
 assert.ok(browserTransforms.find(e=>e.id==='parity-outer').transform.includes('scale(-1, 1)'),'editor displays parent horizontal flip');
 assert.ok(browserTransforms.find(e=>e.id==='parity-inner').transform.includes('scale(1, -1)'),'editor displays nested vertical flip');
 pass('PPD-040:complex-transform-editor-evidence-pdf-pptx-geometry-parity');

 // Pixel regression on the same complex transform fixture, before/after strict JSON persistence.
 // Allow minor antialiasing noise, but fail on changed pixels or changed dimensions.
 const visualTarget=page.locator('.stage .slide-render').first();
 await visualTarget.waitFor({state:'visible'});
 const beforeVisual=await visualTarget.screenshot({animations:'disabled',caret:'hide'});
 await page.evaluate(async()=>{
  const {editorStore}=await import('/src/core/editor.ts');
  const {writePpd040Json,readPpd040Json}=await import('/src/core/ppd040Document.ts');
  editorStore.load(readPpd040Json(writePpd040Json(editorStore.getSnapshot().doc)));
 });
 await visualTarget.waitFor({state:'visible'});
 const afterVisual=await visualTarget.screenshot({animations:'disabled',caret:'hide'});
 const beforeRaster=await sharp(beforeVisual).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const afterRaster=await sharp(afterVisual).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(afterRaster.info.width,beforeRaster.info.width,'canvas width preserved after PPD JSON roundtrip');
 assert.equal(afterRaster.info.height,beforeRaster.info.height,'canvas height preserved after PPD JSON roundtrip');
 const channelTolerance=12,maxDifferentFraction=.002;
 let different=0,maxDelta=0;const diff=Buffer.alloc(beforeRaster.data.length);
 for(let i=0;i<beforeRaster.data.length;i+=4){
  const delta=Math.max(Math.abs(beforeRaster.data[i]-afterRaster.data[i]),Math.abs(beforeRaster.data[i+1]-afterRaster.data[i+1]),Math.abs(beforeRaster.data[i+2]-afterRaster.data[i+2]));
  maxDelta=Math.max(maxDelta,delta);
  if(delta>channelTolerance)different++;
  diff[i]=diff[i+1]=diff[i+2]=Math.min(255,delta*4);diff[i+3]=255;
 }
 const pixelCount=beforeRaster.info.width*beforeRaster.info.height;
 await sharp(diff,{raw:{width:beforeRaster.info.width,height:beforeRaster.info.height,channels:4}}).png().toFile(path.join(output,'ppd040-transforms-roundtrip-diff.png'));
 await writeFile(path.join(output,'ppd040-transforms-roundtrip-metrics.json'),JSON.stringify({width:beforeRaster.info.width,height:beforeRaster.info.height,pixelCount,differentPixels:different,differentFraction:different/pixelCount,maxDelta,channelTolerance,maxDifferentFraction},null,2));
 assert.ok(different/pixelCount<=maxDifferentFraction,'PPD JSON roundtrip changes too many rendered pixels: '+different+'/'+pixelCount);
 pass('PPD-040:complex-transform-pixel-roundtrip-tolerance');


 // Editor vs PDF visual export: rasterize PDF at 120 DPI (PDF page is 0.6x logical units).
 await page.evaluate(async()=>{
  const {createDocument}=await import('/src/core/model.ts');
  const {editorStore}=await import('/src/core/editor.ts');
  const doc=createDocument();
  doc.slides[0].view.elements=[
   {id:'pdf-visual-blue',type:'shape',shapeType:'triangle',geometry:{x:140,y:150,width:260,height:210,rotation:25},flipX:true,style:{fill:{color:'#387F89'}}},
   {id:'pdf-visual-red',type:'shape',shapeType:'triangle',geometry:{x:560,y:270,width:220,height:170,rotation:-30},flipY:true,style:{fill:{color:'#CF694C'}}}
  ];
  editorStore.load(doc);
 });
 const pdfEditorTarget=page.locator('.stage .slide-render').first();
 await pdfEditorTarget.locator('[data-element-id="pdf-visual-blue"]').waitFor({state:'visible'});
 const pdfEditorPng=await pdfEditorTarget.screenshot({animations:'disabled',caret:'hide'});
 await writeFile(path.join(output,'ppd040-pdf-visual-editor.png'),pdfEditorPng);
 const visualPdfBytes=await page.evaluate(async()=>{
  const {editorStore}=await import('/src/core/editor.ts');
  const {pdfExport}=await import('/src/export/office.ts');
  const doc=editorStore.getSnapshot().doc;
  return Array.from((await pdfExport(doc,doc.slides)).file);
 });
 const pdfVisualPath=path.join(output,'ppd040-pdf-visual-export.pdf');
 const pdfImagePrefix=path.join(output,'ppd040-pdf-visual-raster');
 await writeFile(pdfVisualPath,Uint8Array.from(visualPdfBytes));
 await execFileAsync('pdftoppm',['-f','1','-l','1','-singlefile','-png','-r','120',pdfVisualPath,pdfImagePrefix]);
 const editorVisual=await sharp(pdfEditorPng).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const pdfVisual=await sharp(pdfImagePrefix+'.png').resize(editorVisual.info.width,editorVisual.info.height,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const rgbColors=[[56,127,137],[207,105,76]];
 const width=editorVisual.info.width,height=editorVisual.info.height;
 const diffPixels=Buffer.alloc(width*height*4);
 const perColor=rgbColors.map(([r,g,b],index)=>{
  let editorCount=0,pdfCount=0,intersection=0,union=0,editorX=0,editorY=0,pdfX=0,pdfY=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*3;
   const isColor=data=>Math.abs(data[i]-r)+Math.abs(data[i+1]-g)+Math.abs(data[i+2]-b)<100;
   const a=isColor(editorVisual.data),z=isColor(pdfVisual.data);
   if(a){editorCount++;editorX+=x;editorY+=y;}
   if(z){pdfCount++;pdfX+=x;pdfY+=y;}
   if(a&&z)intersection++;
   if(a||z){union++;const k=(y*width+x)*4;diffPixels[k]=a&&!z?255:0;diffPixels[k+1]=z&&!a?255:0;diffPixels[k+2]=0;diffPixels[k+3]=255;}
  }
  const overlap=union?intersection/union:0;
  const centerError=editorCount&&pdfCount?Math.hypot(editorX/editorCount-pdfX/pdfCount,editorY/editorCount-pdfY/pdfCount):Infinity;
  return {color:index===0?'blue':'red',editorPixels:editorCount,pdfPixels:pdfCount,intersection,union,overlap,centerError};
 });
 await sharp(diffPixels,{raw:{width,height,channels:4}}).png().toFile(path.join(output,'ppd040-pdf-visual-diff.png'));
 await writeFile(path.join(output,'ppd040-pdf-visual-metrics.json'),JSON.stringify({width,height,perColor,minOverlap:.75,maxCenterError:12},null,2));
 for(const item of perColor){
  assert.ok(item.editorPixels>100&&item.pdfPixels>100,item.color+' shape visible in both outputs');
  assert.ok(item.overlap>=.75,item.color+' shape visual overlap: '+item.overlap.toFixed(3));
  assert.ok(item.centerError<=12,item.color+' shape position mismatch: '+item.centerError.toFixed(2)+' px');
 }
 pass('PPD-040:editor-vs-rasterized-pdf-visual-parity');

 assert.deepEqual(errors,[]);pass('browser:no-unhandled-errors');
}finally{await writeFile(path.join(output,'editor-results.json'),JSON.stringify({checks,engine:browser.version()},null,2));await context.close();await browser.close();server.kill();}
