import {chromium,webkit} from 'playwright';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('.',import.meta.url));
const output=path.resolve(process.env.SPIKE_OUTPUT??path.join(root,'generated/evidence'));
await mkdir(output,{recursive:true});
let launch={headless:true};let binary='playwright-managed';
if(process.env.CHROMIUM_EXECUTABLE){launch.executablePath=process.env.CHROMIUM_EXECUTABLE;launch.args=['--no-sandbox','--disable-dev-shm-usage'];binary='explicit-executable';}
else if(!existsSync(chromium.executablePath())){const {default:c}=await import('@sparticuz/chromium');launch={...launch,executablePath:await c.executablePath(),args:c.args};binary='sparticuz-fallback';}
const browser=await chromium.launch(launch);
const results={engine:browser.version(),binary,checks:[],limitations:['Actual iPad/Safari pending','Actual PowerPoint Mac/Windows pending','Glass fallback approximation; full fidelity not claimed'],webkit:'not_run'};
const html=pathToFileURL(path.join(root,'generated/index.html')).href;
const record=(name)=>results.checks.push({name,result:'PASS'});
try{
 for(const [device,width,height,touch] of [['desktop',1440,1000,false],['tablet',1024,768,true],['phone',390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,acceptDownloads:true});
  await context.setOffline(true);const page=await context.newPage();const requests=[],errors=[];
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(html);await page.waitForFunction(()=>Boolean(window.spike),null,{timeout:60000});
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);record(device+':cold-file-offline');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);record(device+':responsive-shell');
  const bridge=await page.evaluate(()=>JSON.stringify(window.spike.fromPM(window.spike.editor.getJSON()))===JSON.stringify(window.spike.rich));assert.equal(bridge,true);record(device+':rich-text-canonical-bridge');
  const security=await page.evaluate(()=>{
   const s=window.spike;let rejected=0;
   for(const payload of ['<svg><script>alert(1)</script></svg>','<svg><foreignObject><p>bad</p></foreignObject></svg>','<svg onload="alert(1)"/>','<svg><image href="https://example.org/x"/></svg>']){try{s.sanitizeSVG(payload);}catch{rejected++;}}
   const safe=s.sanitizeSVG('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L20 20"/></svg>');
   const math=s.mathml('<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><script>alert(1)</script><annotation-xml><iframe src="https://example.org"/></annotation-xml></math>');
   let macro=false;try{s.latex('\\includegraphics{https://example.org/x}');}catch{macro=true;}
   return {rejected,safe:safe.includes('path'),math:!/<script|iframe|annotation-xml|src=/i.test(math),latex:s.latex('E=mc^2').includes('math'),macro};
  });assert.deepEqual(security,{rejected:4,safe:true,math:true,latex:true,macro:true});record(device+':svg-math-safety-probes');
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('#measure .text')].filter(n=>n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1).map(n=>n.dataset.id));assert.deepEqual(overflow,[]);record(device+':text-no-overflow');
  for(const [id,extension] of [['pdf','pdf'],['pptx','pptx']]){const wait=page.waitForEvent('download');await page.locator('#'+id).click();const d=await wait;assert.equal(await d.failure(),null);await d.saveAs(path.join(output,`${device}.${extension}`));assert((await stat(path.join(output,`${device}.${extension}`))).size>1000);record(device+':'+extension+'-browser-download');}
  if(device==='desktop'){
   await page.locator('.preview').first().screenshot({path:path.join(output,'preview.png')});
   await writeFile(path.join(output,'layout.json'),JSON.stringify(await page.evaluate(()=>window.spike.layouts),null,2));
   await writeFile(path.join(output,'export-report.json'),JSON.stringify(await page.evaluate(()=>window.spike.report),null,2));
   await writeFile(path.join(output,'model.json'),JSON.stringify(await page.evaluate(()=>window.spike.model),null,2));
   await page.locator('#editor .tiptap').click();await page.keyboard.press('ControlOrMeta+End');await page.keyboard.type(' Testad redigering.');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.spike.fromPM(window.spike.editor.getJSON())).includes('Testad redigering.')),true);record('desktop:real-text-edit');
  }
  await context.close();
 }
 // WebKit automation is separate from Safari on hardware, and never silently PASS.
 if(existsSync(webkit.executablePath())){
  let b;try{b=await webkit.launch();}catch(e){if(/missing dependencies|loading shared libraries|not found|lib.*\.so/i.test(e.message)){results.webkit='deferred_missing_system_dependencies';results.webkitEnvironmentError=e.message;}else throw e;}
  if(b)try{const ctx=await b.newContext();await ctx.setOffline(true);const p=await ctx.newPage();await p.goto(html);await p.waitForFunction(()=>Boolean(window.spike));results.webkit='smoke_pass';}finally{await b.close();}
 }else results.webkit='deferred_missing_browser_binary';
 results.result='passed_with_deferred';
}finally{await browser.close();await writeFile(path.join(output,'browser-results.json'),JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
