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
  const feature=await page.evaluate(async()=>{
   const {applyPlayback,animationSchedule}=await import('/src/core/playback.ts');
   const root=document.createElement('div'),shape=document.createElement('div');
   shape.dataset.elementId='fly02';shape.style.transform='rotate(27deg)';root.append(shape);
   const list=document.createElement('div');list.dataset.elementId='list02';
   for(let i=0;i<3;i++){const p=document.createElement('p');p.textContent='Punkt '+(i+1);list.append(p);}
   root.append(list);document.body.append(root);
   const slide={animations:[
    {id:'in',targetId:'fly02',effect:'fly-in',phase:'entrance',trigger:'on-click',durationMs:320,delayMs:80,from:{offset:{x:0,y:-1}}},
    ...[0,1,2].map(i=>({id:'p'+i,targetId:'list02',effect:'appear',phase:'entrance',trigger:'on-click',durationMs:0,delayMs:0,from:{paragraph:{x:i,y:0}}})),
    {id:'out',targetId:'fly02',effect:'fly-out',phase:'exit',trigger:'on-click',durationMs:300,delayMs:0,to:{x:1,y:0}}
   ]};
   const first=applyPlayback(root,slide,1);
   const waapi=shape.getAnimations()[0],frames=waapi.effect.getKeyframes(),transform=shape.style.transform;
   first();
   const initial=applyPlayback(root,slide,0);
   const initialHidden=[...list.querySelectorAll('p')].map(p=>getComputedStyle(p).visibility==='hidden');
   initial();
   const step2=applyPlayback(root,slide,2,true,false);
   const bulletState=[...list.querySelectorAll('p')].map(p=>p.style.visibility);
   step2();
   const step4=applyPlayback(root,slide,4,true,false);
   const complete=[...list.querySelectorAll('p')].map(p=>p.style.visibility);
   step4();
   const exit=applyPlayback(root,slide,5);
   const exitFrames=shape.getAnimations()[0]?.effect?.getKeyframes()??[];
   exit();root.remove();
   return {groups:animationSchedule(slide).map(a=>a.group),from:frames[0].translate,to:frames.at(-1).translate,transform,initialHidden,bulletState,complete,exitTranslate:exitFrames.at(-1)?.translate};
  });
  assert.deepEqual(feature.groups,[1,2,3,4,5],viewport.name+' click groups');
  assert.equal(feature.from,'0% -110%',viewport.name+' fly-in direction');
  assert.equal(feature.to,'0% 0%',viewport.name+' fly-in finishes centered');
  assert.equal(feature.transform,'rotate(27deg)',viewport.name+' rotation retained');
  assert.deepEqual(feature.initialHidden,[true,true,true],viewport.name+' bullets hidden at start');
  assert.deepEqual(feature.bulletState,['visible','hidden','hidden'],viewport.name+' one bullet per click');
  assert.deepEqual(feature.complete,['visible','visible','visible'],viewport.name+' all bullets shown');
  assert.equal(feature.exitTranslate,'110% 0%',viewport.name+' fly-out direction');
  console.log('PASS fly and paragraph playback '+viewport.name);
  assert.deepEqual(errors,[],viewport.name+' runtime errors');
  console.log('PASS stable animations '+viewport.name);
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
