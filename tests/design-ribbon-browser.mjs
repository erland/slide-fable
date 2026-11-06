import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5197;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
const errors=[];server.stderr.on('data',x=>errors.push(String(x)));
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite startup timeout '+errors.join(''))),20000);server.stdout.on('data',x=>{if(String(x).includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(new Error('Vite exited '+code+' '+errors.join('')));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height}}),page=await context.newPage();const pageErrors=[];page.on('pageerror',err=>pageErrors.push(err.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.getByRole('tab',{name:'Design'}).click();const ribbon=page.getByRole('group',{name:'Teman'});
  assert.equal(await ribbon.getByRole('button',{name:'Använd tema Midnatt'}).count(),1);
  const getDoc=()=>page.evaluate(async()=>{const {editorStore}=await import('/src/core/editor.ts');return structuredClone(editorStore.getSnapshot().doc);});
  const before=await getDoc();
  await ribbon.getByRole('button',{name:'Använd tema Midnatt'}).click();
  const themed=await getDoc();
  assert.equal(themed.theme.colors.surface,'#173944',v.name+': changed theme');
  assert.equal(themed.slides[0].id,before.slides[0].id,v.name+': retained slide');
  const gallery=page.getByRole('group',{name:'Välj bildlayout'});
  assert.equal(await gallery.getByRole('button',{name:'Använd layout Två kolumner'}).count(),1,v.name+': gallery choice is unique');
  assert.equal(await gallery.locator('svg.layout-preview').count(),5,v.name+': five layout previews');
  const beforePreview=await getDoc();
  await gallery.getByRole('button',{name:'Använd layout Två kolumner'}).hover();
  assert.deepEqual(await getDoc(),beforePreview,v.name+': preview does not change presentation');
  await gallery.getByRole('button',{name:'Använd layout Två kolumner'}).click();
  assert.equal(await gallery.getByRole('button',{name:'Använd layout Två kolumner'}).getAttribute('aria-pressed'),'true',v.name+': active layout visibly selected');
  const laid=await getDoc();assert.equal(laid.slides[0].layoutId,'columns',v.name+': changed layout');
  await page.getByRole('button',{name:'Återställ layout'}).first().click();
  const restored=await getDoc();assert.equal(restored.slides[0].layoutId,'columns',v.name+': reset kept selected layout');
  await page.getByRole('button',{name:'Anpassa design…'}).click();
  await page.getByRole('heading',{name:'Välj layout'}).waitFor();
  assert.deepEqual(pageErrors,[],v.name+': page errors');
  console.log('PASS design ribbon '+v.name);await context.close();
 }
}finally{await browser.close();server.kill('SIGTERM');}
