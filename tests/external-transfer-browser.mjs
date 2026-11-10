import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5203;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Vite startup timeout')),20000);server.stdout.on('data',chunk=>{if(String(chunk).includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exit '+code));});});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
try{
 for(const view of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.getByRole('tab',{name:'Infoga'}).waitFor();
  const getTexts=()=>page.evaluate(async()=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='text').map(e=>(e.text?.paragraphs??[]).flatMap(p=>p.runs.map(r=>r.text)).join(''));});
  const before=(await getTexts()).length;
  await page.evaluate(()=>{const data=new DataTransfer();data.setData('text/plain','Säker extern text');window.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
  await page.waitForFunction(async before=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='text').length===before+1;},before);
  assert.ok((await getTexts()).includes('Säker extern text'),view.name+': plain clipboard paste');
  await page.evaluate(()=>{const data=new DataTransfer();data.setData('text/html','<p>Text <strong>fet</strong><script>evil()</script></p>');window.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
  await page.waitForFunction(async before=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='text').length===before+2;},before);
  const bold=await page.evaluate(async()=>{const m=await import('/src/core/editor.ts');const el=m.editorStore.slide.view.elements.at(-1);return {runs:el.text.paragraphs[0].runs,type:el.type};});
  assert.equal(bold.type,'text');assert.equal(bold.runs[1].marks.bold,true);assert.equal(JSON.stringify(bold).includes('evil'),false);
  await page.evaluate(()=>{const data=new DataTransfer();data.setData('text/plain','Släppt text');document.querySelector('.canvas-scroll').dispatchEvent(new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true}));});
  await page.waitForFunction(async before=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='text').length===before+3;},before);
  assert.ok((await getTexts()).includes('Släppt text'));

  const imagesBefore=await page.evaluate(async()=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='image').length;});
  await page.evaluate(async()=>{const blob=await(await fetch('/icons/icon-192.png')).blob();const file=new File([blob],'icon.png',{type:'image/png'});const data=new DataTransfer();data.items.add(file);document.querySelector('.canvas-scroll').dispatchEvent(new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true}));});
  await page.waitForFunction(async before=>{const m=await import('/src/core/editor.ts');return m.editorStore.slide.view.elements.filter(e=>e.type==='image').length===before+1;},imagesBefore);
  const prevented=await page.evaluate(()=>{const data=new DataTransfer();data.items.add(new File(['invalid'],'unsafe.svg',{type:'image/svg+xml'}));const event=new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true});document.querySelector('.canvas-scroll').dispatchEvent(event);return event.defaultPrevented;});
  assert.equal(prevented,true,view.name+': unsupported file must not navigate browser');
  // SF-QUAL-01: a pending image import must never allow dropped files to navigate the tab.
  const blocked=await page.evaluate(async()=>{
   const [{updateSafety},{editorStore}]=await Promise.all([import('/src/pwa/safety.ts'),import('/src/core/editor.ts')]);
   const end=updateSafety.beginOperation();
   try{
    const canvas=document.querySelector('.canvas-scroll');
    const before=editorStore.slide.view.elements.length;
    const results=[];
    for(const [name,type] of [['unsafe.svg','image/svg+xml'],['valid.png','image/png']]){
     const data=new DataTransfer();
     data.items.add(new File(['not a real image'],name,{type}));
     const over=new DragEvent('dragover',{dataTransfer:data,bubbles:true,cancelable:true});
     canvas.dispatchEvent(over);
     const drop=new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true});
     canvas.dispatchEvent(drop);
     results.push({type,overPrevented:over.defaultPrevented,dropPrevented:drop.defaultPrevented});
    }
    return {results,unchanged:editorStore.slide.view.elements.length===before};
   }finally{end();}
  });
  assert.ok(blocked.results.every(result=>result.overPrevented&&result.dropPrevented),view.name+': all file drops are suppressed while busy');
  assert.equal(blocked.unchanged,true,view.name+': busy file drops must not mutate the document');

  assert.deepEqual(errors,[],view.name+': no JS errors');console.log('PASS external transfer '+view.name);await context.close();
 }
}finally{await browser.close();server.kill('SIGTERM');}
