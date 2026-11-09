/** SF-ANIM-01: real Chromium WAAPI playback, independent of presentation viewport. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=5229;
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Vite startup: '+log)),20000);server.stdout.on('data',x=>{log+=String(x);if(log.includes(String(port))){clearTimeout(timer);resolve();}});server.on('exit',code=>{clearTimeout(timer);reject(Error('Vite exit '+code));});});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port+'/');
  const result=await page.evaluate(async()=>{
   const {animationSchedule,applyPlayback}=await import('/src/core/playback.ts');
   const root=document.createElement('div'),node=document.createElement('div');node.dataset.elementId='stable-target';
   node.style.opacity='0.7';root.append(node);document.body.append(root);
   const slide={animations:[
    {id:'a',targetId:'stable-target',effect:'fade',phase:'entrance',trigger:'on-click',durationMs:200,delayMs:100},
    {id:'b',targetId:'stable-target',effect:'fade',phase:'exit',trigger:'after-previous',durationMs:100,delayMs:50},
    {id:'c',targetId:'stable-target',effect:'appear',phase:'entrance',trigger:'on-click',durationMs:0,delayMs:0}
   ]};
   const starts=animationSchedule(slide).map(a=>a.start);
   const cleanStart=applyPlayback(root,slide,0);
   const initiallyHidden=getComputedStyle(node).visibility==='hidden';
   cleanStart();
   const cleanFirst=applyPlayback(root,slide,1);
   const active=node.getAnimations();
   const count=active.length;
   const keyframes=active[0]?.effect?.getKeyframes()??[];
   const duration=active[0]?.effect?.getTiming().duration;
   cleanFirst();
   const clearAfterCancel=node.getAnimations().length===0&&node.style.visibility===''&&node.style.opacity==='0.7';
   const cleanJump=applyPlayback(root,slide,2,false,false);
   const visibleAfterJump=node.style.visibility==='visible';
   cleanJump();
   const cleanBack=applyPlayback(root,slide,1,true,false);
   const hiddenAfterBack=node.style.visibility==='hidden'&&node.getAnimations().length===0;
   cleanBack();
   root.remove();
   return {starts,initiallyHidden,count,duration,keyframes:keyframes.map(f=>({opacity:f.opacity,visibility:f.visibility})),clearAfterCancel,visibleAfterJump,hiddenAfterBack};
  });
  assert.deepEqual(result.starts,[100,350,0],viewport.name+' scheduling');
  assert.ok(result.initiallyHidden,viewport.name+' initial');
  assert.equal(result.count,1,viewport.name+' one native WAAPI timeline');
  assert.equal(result.duration,450,viewport.name+' combined timing');
  assert.equal(result.keyframes.at(-1).visibility,'hidden',viewport.name+' exit');
  assert.ok(result.clearAfterCancel,viewport.name+' cancels and restores inline styles');
  assert.ok(result.visibleAfterJump,viewport.name+' forward jump');
  assert.ok(result.hiddenAfterBack,viewport.name+' backward reconstruction');
  assert.deepEqual(errors,[],viewport.name+' runtime errors');
  console.log('PASS stable animations '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
