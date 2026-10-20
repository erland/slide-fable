import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
const output=path.resolve(process.env.EDITOR_OUTPUT??'../editor-evidence');await mkdir(output,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort'],{stdio:'pipe'});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('5178'))resolve();});server.on('exit',reject);});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const checks=[],pass=n=>{checks.push({name:n,result:'PASS'});console.log('PASS',n);};
const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
async function model(){return page.evaluate(async()=>(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc);}
async function api(fn,arg){return page.evaluate(async({source,arg})=>{const store=(await import('/src/core/editor.ts')).editorStore;return new Function('store','arg',source)(store,arg);},{source:fn,arg});}
try{
 await page.goto('http://127.0.0.1:5178/');await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
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
 await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Dölj egenskaper',exact:true}).click();
 assert.equal(await page.locator('.properties').isVisible(),false);
 assert.ok((await paneWidth())>baseWidth+300,'Canvas must grow when both panels are hidden');
 await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa bilder',exact:true}).click();
 await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa egenskaper',exact:true}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),true);
 assert.equal(await page.locator('.properties').isVisible(),true);
 await page.getByRole('tab',{name:'Visa'}).click();
 await page.locator('.workspace-controls-disclosure > summary').click();
 await page.getByRole('tab',{name:'Infoga'}).click();
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
 await page.getByRole('button',{name:'Bilder',exact:true}).click();
 assert.equal(await page.locator('#slide-filmstrip').isVisible(),true);
 await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();
 assert.equal(await pane.isVisible(),true);
 await page.setViewportSize({width:1440,height:1000});
 pass('SF-UX-01:tablet-panel-navigation');
 await page.setViewportSize({width:768,height:1024});
 const portraitLayout=await page.evaluate(()=>{const canvas=document.querySelector('.editor-canvas-pane')?.getBoundingClientRect(),slides=document.querySelector('#slide-filmstrip')?.getBoundingClientRect();return {canvasVisible:!!canvas&&canvas.height>0,slidesVisible:!!slides&&slides.height>0,below:!!canvas&&!!slides&&slides.top>=canvas.bottom-2};});
 assert.ok(portraitLayout.canvasVisible&&portraitLayout.slidesVisible&&portraitLayout.below,'Portrait must show canvas above slide strip');
 await page.setViewportSize({width:1180,height:820});
 const landscapeLayout=await page.evaluate(()=>{const canvas=document.querySelector('.editor-canvas-pane')?.getBoundingClientRect(),slides=document.querySelector('#slide-filmstrip')?.getBoundingClientRect();return {beside:!!canvas&&!!slides&&slides.right<=canvas.left+2};});
 assert.ok(landscapeLayout.beside,'Landscape must show slide strip beside canvas');
 await page.setViewportSize({width:1440,height:1000});
 pass('SF-UX-07:portrait-bottom-strip-landscape-sidebar');
 await page.setViewportSize({width:768,height:1024});
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
 assert.equal(await toolbar.getByRole('button',{name:'Text',exact:true}).isVisible(),true);
 assert.equal(await toolbar.locator('.shape-picker > summary').isVisible(),true);
 assert.equal(await toolbar.getByRole('button',{name:'Bildfil',exact:true}).isVisible(),true);
 assert.equal(await toolbar.getByRole('button',{name:'Diagram',exact:true}).isVisible(),false);
 await toolbar.locator('summary',{hasText:'Fler objekt'}).click();
 assert.equal(await toolbar.getByRole('button',{name:'Diagram',exact:true}).isVisible(),true);
 await toolbar.locator('summary',{hasText:'Fler objekt'}).click();
 pass('SF-UX-03:compact-insert-toolbar');
 const ribbon=page.getByRole('tablist',{name:'Menyflikar'});
 assert.equal(await ribbon.getByRole('tab',{name:'Infoga'}).getAttribute('aria-selected'),'true');
 await ribbon.getByRole('tab',{name:'Start'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Ny bild'}).isVisible(),true);
 assert.deepEqual(await page.getByRole('tabpanel',{name:'Start'}).locator('.ribbon-actions > button').allTextContents(),['Ångra','Gör om','Ny bild','Kopiera','Klistra in'],'Start command order must follow the tab configuration');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Ny bild'}).isEnabled(),true,'Shared New slide command is enabled in editable mode');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Kopiera',exact:true}).count(),1,'Shared Copy command stays available in Start');
 assert.equal(await page.getByRole('tabpanel',{name:'Start'}).getByRole('button',{name:'Klistra in',exact:true}).count(),1,'Shared Paste command stays available in Start');
 assert.equal(await page.locator('.editor-canvas-pane').isVisible(),true);
 await ribbon.getByRole('tab',{name:'Rita'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Rita'}).getByRole('button',{name:'Linje'}).isVisible(),true);
 assert.deepEqual(await page.getByRole('tabpanel',{name:'Rita'}).locator('.ribbon-actions > button').allTextContents(),['Linje','Pil','Form'],'Rita command order must follow the tab configuration');
 assert.equal(await page.getByRole('tabpanel',{name:'Rita'}).getByRole('button',{name:'Pil'}).isVisible(),true);
 assert.equal(await page.getByRole('tabpanel',{name:'Rita'}).getByRole('button',{name:'Form'}).isVisible(),true);
 await ribbon.getByRole('tab',{name:'Design'}).click();
 assert.equal(await page.getByRole('tabpanel',{name:'Design'}).getByRole('button',{name:'Öppna designegenskaper'}).isVisible(),true);
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
 assert.equal(await toolbar.getByRole('button',{name:'Text',exact:true}).isVisible(),true);
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
 assert.equal(await ribbon.getByRole('tab',{name:'Objekt'}).count(),0,'Contextual tab must be absent without selection');
 await page.locator('.editor-canvas-pane .stage .render-element.type-text').first().click();
 assert.equal(await ribbon.getByRole('tab',{name:'Objekt'}).count(),1,'Selecting an object must show contextual tab');
 await ribbon.getByRole('tab',{name:'Objekt'}).click();
 const contextPanel=page.getByRole('tabpanel',{name:'Objekt'});
 assert.equal(await contextPanel.getByRole('button',{name:'Objektegenskaper'}).isVisible(),true);
 await contextPanel.locator('summary',{hasText:'Fler objektval'}).click();
 assert.equal(await contextPanel.getByRole('button',{name:'Ta bort markerat'}).isVisible(),true);
 await ribbon.getByRole('tab',{name:'Infoga'}).click();
 pass('SF-UX-09:contextual-object-menu');


 await page.getByRole('button',{name:'Lägg till bild',exact:true}).click();await page.getByRole('button',{name:'Lägg till bild',exact:true}).click();assert.equal((await model()).slides.length,3);pass('DEV005:create-three-slides');
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

 await page.getByRole('button',{name:'Text',exact:true}).click();
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



 await page.getByRole('button',{name:'Text',exact:true}).click();const edit=page.getByRole('textbox',{name:'Redigera objektets text'});await edit.fill('Svensk berättelse ÅÄÖ');await page.getByRole('button',{name:'Fetstil',exact:true}).click();await edit.press('End');await edit.type(' med rik text');await page.getByRole('button',{name:'Bild',exact:true}).click();await page.getByRole('tab',{name:'Visa'}).click();await page.locator('.workspace-controls-disclosure > summary').click();await page.getByRole('group',{name:'Visa eller dölj paneler'}).getByRole('button',{name:'Visa anteckningar',exact:true}).click();await page.getByRole('tab',{name:'Infoga'}).click();await page.getByLabel('Talaranteckningar',{exact:true}).fill('HEMLIG ANTECKNING');await page.getByLabel('Talaranteckningar',{exact:true}).press('Tab');assert.ok(JSON.stringify(await model()).includes('Svensk berättelse'));pass('DEV008:rich-text-edit-and-save');
 await page.getByRole('status').filter({hasText:'Arbetskopia sparad'}).waitFor();const before=await model();await page.reload();await page.getByRole('button',{name:/Min presentation ·/}).click();assert.deepEqual(await model(),before);pass('DEV006:reload-explicit-recovery');
 const cas=await page.evaluate(async()=>{const p=await import('/src/core/persistence.ts'),doc=(await import('/src/core/editor.ts')).editorStore.getSnapshot().doc;let conflict=false;try{await p.saveDraft(doc,null,'other-tab');}catch(e){conflict=String(e).includes('CONFLICT');}return conflict;});assert.equal(cas,true);pass('DEV006:atomic-stale-tab-conflict');
 const quota=await page.evaluate(async()=>{const proto=IDBObjectStore.prototype,old=proto.put;proto.put=function(){throw new DOMException('test quota','QuotaExceededError');};try{const p=await import('/src/core/persistence.ts'),d=(await import('/src/core/model.ts')).createDocument();await p.saveDraft(d,null,'test');return false;}catch(e){return String(e).includes('Quota');}finally{proto.put=old;}});assert.equal(quota,true);pass('DEV006:quota-error-does-not-report-success');
 await api("for(const type of ['table','chart','semanticDiagram','equation','vectorPath'])store.add(type);return true;");
 await api("store.transaction((d,s)=>{s.view.elements.find(e=>e.type==='chart').dataset.series[0].values=[2,7,4];s.view.elements.find(e=>e.type==='equation').equation.source='x^2 + y^2 = z^2';});return true;");
 await api("store.select([store.slide.view.elements.find(e=>e.type==='table').id]);return true;");await page.getByLabel('Cell 1 1',{exact:true}).fill('Samlad rubrik');await page.getByRole('button',{name:'Sammanfoga →',exact:true}).first().click();assert.equal((await model()).slides[0].view.elements.find(e=>e.type==='table').cells[0][0].colSpan,2);pass('DEV010:table-edit-and-cell-merge');
 await api("store.select([store.slide.view.elements.find(e=>e.type==='chart').id]);return true;");await page.getByLabel('Serie 1 värde 1',{exact:true}).fill('12');assert.equal((await model()).slides[0].view.elements.find(e=>e.type==='chart').dataset.series[0].values[0],12);pass('DEV010:chart-data-input-updates-model');
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
 await page.mouse.down();await page.mouse.move(eb.x+eb.width/2-100,eb.y+eb.height/2+120,{steps:6});await page.mouse.up();
 const endpointDoc=await model(),arrow=endpointDoc.slides.find(s=>s.id===endpointDoc.slides[endpointDoc.slides.length-1]?.id)?.view.elements.find(e=>e.id===endpointId)??endpointDoc.slides.flatMap(s=>s.view.elements).find(e=>e.id===endpointId);
 assert.ok(arrow?.extensions?.slideFableLinePoints,'Endpoint edit must persist in PPD extension');
 assert.notEqual(arrow.extensions.slideFableLinePoints.start.y,arrow.extensions.slideFableLinePoints.end.y,'Arrow must become diagonal');
 assert.equal(await page.locator('.stage [data-element-id="'+endpointId+'"] svg polygon').count(),1,'Arrowhead still rendered');
 pass('SF-SH-03:movable-line-endpoint-and-arrowhead');
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
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['phone',390,844]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(width<=800){await page.getByRole('button',{name:'Egenskaper',exact:true}).click();await page.getByRole('button',{name:'Objekt',exact:true}).waitFor();await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();}await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});pass('responsive:'+name);}
 assert.deepEqual(errors,[]);pass('browser:no-unhandled-errors');
}finally{await writeFile(path.join(output,'editor-results.json'),JSON.stringify({checks,engine:browser.version()},null,2));await context.close();await browser.close();server.kill();}
