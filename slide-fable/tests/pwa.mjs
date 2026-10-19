import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {cp,readFile,mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('..',import.meta.url));
process.chdir(root);
const productionVersion=JSON.parse(await readFile('package.json','utf8')).version;
const temporary=await mkdtemp(path.join(tmpdir(),'slide-fable-pwa-'));
const output=path.resolve(process.env.PWA_OUTPUT??path.join(temporary,'results'));
await mkdir(output,{recursive:true});
function build(id){const result=spawnSync('npm',['run','build'],{cwd:root,env:{...process.env,SF_BUILD_ID:id},encoding:'utf8'});assert.equal(result.status,0,result.stderr+result.stdout);}
build('test-A');await cp('dist',path.join(temporary,'A'),{recursive:true});
build('test-B');await cp('dist',path.join(temporary,'B'),{recursive:true});
let version='A',failAsset=false;
const mimes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),prefix=url.pathname.startsWith('/studio/')?'/studio/':'/';
 const file=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
 if(file.includes('..')){res.writeHead(400).end();return;}
 if(file==='silent.html'){res.writeHead(200,{'content-type':'text/html'}).end('<p>Client without update handler</p>');return;}
 if(failAsset&&file.endsWith('icon-192.png')){res.writeHead(503).end();return;}
 try{const body=await readFile(path.join(temporary,version,file));res.writeHead(200,{'content-type':mimes[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,origin=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const results={engine:browser.version(),checks:[],hardware:'Safari/iPad/iPhone installation still pending'};
const pass=name=>{results.checks.push({name,result:'PASS'});console.log('PASS',name);};
async function ready(page,url){await page.goto(url);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));try{await page.getByRole('status').filter({hasText:'redo att öppnas offline'}).waitFor({timeout:12000});}catch(error){console.error('PWA status:',await page.getByRole('status').allTextContents());throw error;}}
async function dirty(page,title,mobile=false){if(mobile)await page.getByRole('button',{name:'Egenskaper',exact:true}).click();await page.getByRole('button',{name:'Bild',exact:true}).click();await page.getByLabel('Dokumentnamn',{exact:true}).fill(title);await page.getByLabel('Dokumentnamn',{exact:true}).press('Tab');await page.getByText('Ändrad sedan HTML-export',{exact:true}).waitFor({state:mobile?'attached':'visible'});}
async function clean(page){const download=page.waitForEvent('download');await page.getByRole('button',{name:'Spara HTML',exact:true}).click();await download;await page.getByText('Oförändrad sedan öppning/export',{exact:true}).waitFor({state:'attached'});}
try{
 for(const [device,width,height,mobile] of [['desktop',1440,1000,false],['tablet',768,1024,true],['phone',390,844,true]]){
  version='A';const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page,origin+'/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass(device+':no-page-overflow');
  if(mobile)await page.getByRole('button',{name:'Bilder',exact:true}).click();await page.getByRole('button',{name:'Lägg till bild',exact:true}).click();if(mobile)await page.getByRole('button',{name:'Bilder',exact:true}).click();await page.locator('.slide-card').first().click();pass(device+':select-slide');
  await dirty(page,'Mitt prov',mobile);await clean(page);pass(device+':panel-and-dirty-guard');
  await page.getByRole('button',{name:'Installera appen',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Stäng dialog',exact:true}).click();pass(device+':installation-help');
  if(mobile)await page.getByRole('button',{name:'Arbetsyta',exact:true}).click();
  const fillBefore=await page.locator('.stage .slide-render').getAttribute('style');await page.getByRole('button',{name:'Mörkt gränssnitt'}).click();assert.equal(await page.locator('.stage .slide-render').getAttribute('style'),fillBefore);await page.getByRole('button',{name:'Mörkt gränssnitt'}).click();pass(device+':app-theme-preserves-slide-design');
  if(mobile){await page.setViewportSize({width:height,height:width});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width,height});pass(device+':rotation-no-overflow');}
  const session=await context.newCDPSession(page);const manifest=await session.send('Page.getAppManifest');assert.deepEqual(manifest.errors,[]);const app=JSON.parse(manifest.data);assert.equal(app.display,'standalone');assert.equal(app.icons.length,3);const installability=await session.send('Page.getInstallabilityErrors');assert.deepEqual(installability.installabilityErrors,[]);pass(device+':manifest-and-installability');
  if(device==='desktop')await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
  if(device==='phone')await page.screenshot({path:path.join(output,'phone.png'),fullPage:true});
  await context.setOffline(true);await page.close();const cold=await context.newPage();await ready(cold,origin+'/#workspace');assert.equal(await cold.locator('.editor-app').getAttribute('data-build'),'test-A');pass(device+':cold-tab-offline-start');
  const cacheKeys=await cold.evaluate(async()=>{let result=[];for(const name of await caches.keys()){for(const req of await (await caches.open(name)).keys())result.push(req.url);}return result;});assert.equal(cacheKeys.some(url=>url.includes('/api/')||url.includes('user-document')),false);pass(device+':app-assets-only-cache');await cold.getByRole('button',{name:'Exportera',exact:true}).click();await cold.getByRole('dialog').locator('select').first().selectOption('pdf');const offlineDownload=cold.waitForEvent('download');await cold.getByRole('button',{name:'Skapa export',exact:true}).click();const offlineFile=await offlineDownload;assert.ok(offlineFile.suggestedFilename().endsWith('.pdf'));await offlineFile.saveAs(path.join(output,device+'-offline.pdf'));assert.ok((await readFile(path.join(output,device+'-offline.pdf'),'utf8')).startsWith('%PDF'));pass(device+':PDF-export-while-offline');assert.deepEqual(errors,[]);await context.close();
 }
 // Nested deployment has its own scope and works with hash navigation offline.
 version='A';const nested=await browser.newContext();const np=await nested.newPage();await ready(np,origin+'/studio/');await nested.setOffline(true);await np.reload();await np.locator('.brand').waitFor();assert.equal(await np.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).scope),origin+'/studio/');pass('nested-base:offline-and-scope');await nested.close();
 version='A';const overlap=await browser.newContext();const parent=await overlap.newPage(),child=await overlap.newPage();await ready(parent,origin+'/');await ready(child,origin+'/studio/');await dirty(child,'Separat app');version='B';await parent.getByRole('button',{name:'Sök uppdatering'}).click();await parent.getByRole('button',{name:'Uppdatera nu'}).waitFor();await parent.getByRole('button',{name:'Uppdatera nu'}).click();await parent.waitForFunction(()=>document.querySelector('.editor-app')?.dataset.build==='test-B');assert.equal(await child.getByLabel('Dokumentnamn',{exact:true}).inputValue(),'Separat app');assert.equal(await child.locator('.editor-app').getAttribute('data-build'),'test-A');pass('nested-base:parent-update-does-not-reload-child-app');child.on('dialog',d=>d.accept());await overlap.close();
 // Two tabs must both consent before activation. Dirty state blocks even when caller is clean.
 version='A';const ctx=await browser.newContext();const a=await ctx.newPage(),b=await ctx.newPage();await ready(a,origin+'/');await ready(b,origin+'/');await dirty(b,'Bevara mitt arbete');version='B';await a.getByRole('button',{name:'Sök uppdatering'}).click();await a.getByRole('button',{name:'Uppdatera nu'}).waitFor();await a.getByRole('button',{name:'Uppdatera nu'}).click();await a.getByRole('status').filter({hasText:'alla öppna flikar'}).waitFor();assert.equal(await b.getByLabel('Dokumentnamn',{exact:true}).inputValue(),'Bevara mitt arbete');assert.equal(await a.locator('.editor-app').getAttribute('data-build'),'test-A');assert.equal(await b.locator('.editor-app').getAttribute('data-build'),'test-A');pass('update:dirty-second-tab-blocks-without-data-loss');
 await clean(b);await a.getByRole('button',{name:'Uppdatera nu'}).click();await a.waitForFunction(()=>document.querySelector('.editor-app')?.dataset.build==='test-B');await b.waitForFunction(()=>document.querySelector('.editor-app')?.dataset.build==='test-B');pass('update:all-clean-tabs-activate-and-reload');await ctx.setOffline(true);await a.reload();await a.locator('.brand').waitFor();assert.equal(await a.locator('.editor-app').getAttribute('data-build'),'test-B');pass('update:new-version-starts-offline');await ctx.close();
 // A dead/unresponsive same-scope tab blocks activation and releases the caller's lock.
 version='A';const quiet=await browser.newContext();const live=await quiet.newPage(),silent=await quiet.newPage();await ready(live,origin+'/');await silent.goto(origin+'/silent.html');version='B';await live.getByRole('button',{name:'Sök uppdatering'}).click();await live.getByRole('button',{name:'Uppdatera nu'}).waitFor();await live.getByRole('button',{name:'Uppdatera nu'}).click();await live.getByRole('status').filter({hasText:'alla öppna flikar'}).waitFor();await live.getByRole('button',{name:'Bild',exact:true}).click();assert.equal(await live.getByLabel('Dokumentnamn',{exact:true}).isEnabled(),true);assert.equal(await live.locator('.editor-app').getAttribute('data-build'),'test-A');pass('update:unresponsive-tab-blocks-and-rolls-back-lock');await quiet.close();
 // Failed precache never replaces a known good active worker/cache.
 version='A';const failed=await browser.newContext();const fp=await failed.newPage();await ready(fp,origin+'/');await fp.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();r.addEventListener('updatefound',()=>{const worker=r.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant')window.failedUpdateObserved=true;});});});version='B';failAsset=true;await fp.getByRole('button',{name:'Sök uppdatering'}).click();await fp.waitForFunction(()=>window.failedUpdateObserved===true);await failed.setOffline(true);await fp.reload();await fp.locator('.editor-app').waitFor();assert.equal(await fp.locator('.editor-app').getAttribute('data-build'),'test-A');pass('update:failed-precache-keeps-previous-offline-version');failAsset=false;await failed.close();
 results.result='PASS';
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));build(productionVersion);await writeFile(path.join(output,'pwa-results.json'),JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
