/** IP-001 regression characterisation. Run with npm run test:lifecycle after npm ci + Playwright Chromium install. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5189','--strictPort'],{stdio:['ignore','pipe','pipe']});
const waitForServer=()=>new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Vite startup timed out: '+output)),15000);server.stdout.on('data',d=>{output+=String(d);if(output.includes('5189')){clearTimeout(timeout);resolve();}});server.on('exit',code=>{clearTimeout(timeout);reject(Error('Vite exited '+code+': '+output));});});
let browser;
try{
 await waitForServer();
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const context=await browser.newContext({acceptDownloads:true});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:5189/');
 await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();
 const read=()=>page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;const drafts=await (await import('/src/core/persistence.ts')).listDrafts();const doc=store.getSnapshot().doc;return {id:doc.document.id,revision:doc.document.revision,dirty:store.getSnapshot().dirty,draft:drafts.find(d=>d.id===doc.document.id)};});
 const edit=()=>page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore;store.updateDocument({title:'Livscykel '+Date.now()});return store.getSnapshot().doc.document.revision;});
 const exportHtml=async()=>{await page.locator('.editor-header .editor-menu-disclosure > summary').click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Spara HTML'}).click();const saved=await download;await saved.path();return saved.suggestedFilename();};
 const delay=ms=>page.waitForTimeout(ms);
 // Control: ordinary changes are persisted after debounce.
 const rev1=await edit();await delay(1000);let state=await read();assert.equal(state.draft?.model.document.revision,rev1,'Baseline autosave must persist revision');
 console.log('PASS ordinary autosave');
 // Export before debounce: file is written, but export must not cancel draft persistence.
 const rev2=await edit();await exportHtml();await delay(1000);state=await read();
 const missingAfterExport=state.draft?.model.document.revision!==rev2;
 if(missingAfterExport) console.error('KNOWN FAILURE IP-002: immediate export suppressed pending autosave, expected revision '+rev2+', found '+state.draft?.model.document.revision);
 else console.log('PASS export during debounce retains local revision');
 // A subsequent change must still be persisted.
 const rev3=await edit();await delay(1000);state=await read();assert.equal(state.draft?.model.document.revision,rev3,'Post-export edit must persist');
 console.log('PASS post-export autosave');
 // Restored copy should be the last persisted revision after a reload.
 await page.reload();await page.getByRole('button',{name:'Lägg till bild',exact:true}).waitFor();const recovery=page.getByRole('button',{name:/Livscykel/}).first();await recovery.click();state=await read();assert.equal(state.revision,rev3,'Reload must restore last saved revision');
 console.log('PASS reload and restore');
 // Compare-and-swap: stale writer cannot overwrite the saved revision.
 const conflict=await page.evaluate(async()=>{const store=(await import('/src/core/editor.ts')).editorStore,p=await import('/src/core/persistence.ts');try{await p.saveDraft(store.getSnapshot().doc,null,'second-tab');return false;}catch(e){return String(e).includes('CONFLICT');}});assert.ok(conflict,'Stale tab CAS must reject');
 console.log('PASS stale writer conflict');
 // IndexedDB QuotaExceededError must reject, not return successful version.
 const quota=await page.evaluate(async()=>{const p=await import('/src/core/persistence.ts');const {createDocument}=await import('/src/core/model.ts');const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('injected quota','QuotaExceededError');};try{await p.saveDraft(createDocument(),null,'quota-test');return false;}catch(e){return String(e).includes('QuotaExceeded');}finally{IDBObjectStore.prototype.put=original;}});assert.ok(quota,'Quota failures must propagate');
 console.log('PASS quota error');
 await context.close();
 if(missingAfterExport) throw Error('IP-001 regression detected: export canceled pending autosave; fix in IP-002');
}catch(error){console.error('FAIL lifecycle regression:',error);process.exitCode=1;}finally{await browser?.close();server.kill('SIGTERM');}
