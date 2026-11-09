import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animationSchedule,playbackSteps,applyPlayback} from '../src/core/playback.ts';
import {EditorStore} from '../src/core/editor.ts';
import {copy} from '../src/core/model.ts';
import {validateCore} from '../src/core/contract.ts';
import {preflight} from '../src/export/plan.ts';
test('click groups and automatic timing use previous start/end with bounded durations',()=>{
 const animations=[{id:'a',targetId:'one',effect:'fade',phase:'entrance',trigger:'on-click',durationMs:400,delayMs:100},{id:'b',targetId:'two',effect:'appear',trigger:'with-previous',durationMs:0,delayMs:50},{id:'c',targetId:'one',effect:'appear',phase:'exit',trigger:'after-previous',durationMs:0,delayMs:70},{id:'d',targetId:'two',effect:'fade',trigger:'on-click',durationMs:200}];
 const schedule=animationSchedule({animations});assert.deepEqual(schedule.map(a=>[a.group,a.start,a.duration]),[[1,100,400],[1,150,0],[1,220,0],[2,0,200]]);
 assert.equal(playbackSteps({animations,delivery:{fragments:[{order:3}]}}),3);
 assert.equal(animationSchedule({animations:[{effect:'spin',durationMs:300}]}).length,0);
 assert.equal(animationSchedule({animations:[{effect:'fade',durationMs:1e8,delayMs:-5} ]})[0].duration,60000);
});
test('animation commands validate atomically, preserve notes and support undo/redo and JSON',()=>{
 const store=new EditorStore(),id=store.slide.view.elements[0].id;store.setTransition('fade',350);store.addAnimation(id,'fade');store.addAnimation(id,'exit');
 let doc=copy(store.getSnapshot().doc);validateCore(doc);assert.equal(doc.slides[0].delivery.speakerNotes,'');
 const [a,b]=store.slide.animations;store.updateAnimation(a.id,{trigger:'after-previous',durationMs:700,delayMs:100});store.moveAnimation(b.id,-1);assert.equal(store.slide.animations[0].id,b.id);
 store.undo();assert.equal(store.slide.animations[0].id,a.id);store.redo();assert.equal(store.slide.animations[0].id,b.id);
 const before=copy(store.getSnapshot().doc);assert.throws(()=>store.updateAnimation(a.id,{delayMs:-1}));assert.deepEqual(store.getSnapshot().doc,before);
 assert.throws(()=>store.addAnimation('missing','fade'));assert.throws(()=>store.setTransition('zoom',100));
 store.load(JSON.parse(JSON.stringify(before)));assert.deepEqual(store.getSnapshot().doc,before);
 store.select([id]);store.removeSelected();assert.equal(store.slide.animations.length,0);validateCore(store.getSnapshot().doc);store.undo();assert.equal(store.slide.animations.length,2);
 store.removeAnimation(a.id);assert.equal(store.slide.animations.length,1);
 assert.ok(preflight(before,'pptx').warnings.some(w=>w.includes('statiskt')));
});
test('DOM playback reconstructs visibility, reduced motion and cancels animations',()=>{
 globalThis.CSS={escape:s=>s};const node={style:{visibility:'',opacity:''},animate:(frames,options)=>{node.frames=frames;node.options=options;return {cancel:()=>node.cancelled=true};}},root={querySelector:()=>node};
 const slide={animations:[{targetId:'one',effect:'fade',phase:'entrance',trigger:'on-click',durationMs:400,delayMs:100},{targetId:'one',effect:'appear',phase:'exit',trigger:'on-click',durationMs:0}]};
 let clean=applyPlayback(root,slide,0);assert.equal(node.style.visibility,'hidden');clean();
 clean=applyPlayback(root,slide,1);assert.equal(node.options.delay,100);assert.equal(node.frames[1].opacity,1);clean();assert.equal(node.cancelled,true);
 clean=applyPlayback(root,slide,2,true);assert.equal(node.style.visibility,'hidden');clean();
 clean=applyPlayback(root,slide,1,true,false);assert.equal(node.style.visibility,'visible');clean();
});

test('with-previous anchors to prior start instead of accumulating delays',()=>{
 const animations=[
  {id:'a',targetId:'a',effect:'fade',trigger:'on-click',durationMs:500,delayMs:100},
  {id:'b',targetId:'b',effect:'fade',trigger:'with-previous',durationMs:200,delayMs:50},
  {id:'c',targetId:'c',effect:'fade',trigger:'with-previous',durationMs:100,delayMs:25},
  {id:'d',targetId:'d',effect:'fade',trigger:'after-previous',durationMs:90,delayMs:10},
  {id:'e',targetId:'e',effect:'appear',trigger:'on-click',durationMs:0,delayMs:0}
 ];
 const result=animationSchedule({animations});
 assert.deepEqual(result.map(a=>[a.group,a.start,a.duration]),[
  [1,100,500],[1,150,200],[1,175,100],[1,285,90],[2,0,0]
 ]);
 assert.equal(playbackSteps({animations}),2);
 assert.deepEqual(animations.map(a=>a.delayMs),[100,50,25,10,0],'Scheduling must not mutate PPD');
});
test('same-target effects use one composed WAAPI animation with deterministic cleanup and replay',()=>{
 globalThis.CSS={escape:s=>s};
 const calls=[],node={style:{visibility:'',opacity:'0.8'},animate:(frames,options)=>{
  const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};
  calls.push(animation);return animation;
 }};
 const root={querySelector:selector=>selector.includes('item')?node:null};
 const slide={animations:[
  {id:'a',targetId:'item',effect:'fade',phase:'entrance',trigger:'on-click',durationMs:200,delayMs:100},
  {id:'b',targetId:'item',effect:'fade',phase:'exit',trigger:'after-previous',durationMs:150,delayMs:50},
  {id:'c',targetId:'item',effect:'appear',phase:'entrance',trigger:'on-click',durationMs:0,delayMs:0}
 ]};
 const initial=applyPlayback(root,slide,0);
 assert.equal(node.style.visibility,'hidden');assert.equal(calls.length,0);initial();
 const first=applyPlayback(root,slide,1);
 assert.equal(calls.length,1,'Effects on one target must not fight over fill-forwards');
 assert.deepEqual(calls[0].options,{duration:500,delay:0,fill:'forwards',easing:'linear'});
 assert.equal(calls[0].frames[0].opacity,0);
 assert.equal(calls[0].frames.at(-1).opacity,0,'Exit must finish hidden');
 assert.equal(calls[0].frames.at(-1).visibility,'hidden');
 first();assert.equal(calls[0].cancelled,true);assert.equal(node.style.visibility,'');assert.equal(node.style.opacity,'0.8');
 const jump=applyPlayback(root,slide,2,false,false);
 assert.equal(node.style.visibility,'visible','Jump to next group applies all prior effects without replay');
 assert.equal(node.style.opacity,'0.8');jump();
 const backward=applyPlayback(root,slide,1,true,false);
 assert.equal(node.style.visibility,'hidden','Backward navigation reconstructs completed group');
 backward();
 const replay=applyPlayback(root,slide,1);
 assert.equal(calls.length,2,'Replay creates only the new timeline');
 replay();assert.equal(calls[1].cancelled,true);
});

test('SF-ANIM-02 fly-in/out is valid PPD, configurable and undoable',()=>{
 const store=new EditorStore(),id=store.add('shape');
 store.addAnimation(id,'fly-in');store.addAnimation(id,'fly-out');
 let [entry,exit]=store.slide.animations;
 assert.deepEqual(entry.from,{offset:{x:-1,y:0}});assert.equal(entry.effect,'fly-in');assert.equal(entry.phase,'entrance');
 assert.deepEqual(exit.to,{x:1,y:0});assert.equal(exit.effect,'fly-out');assert.equal(exit.phase,'exit');
 store.updateAnimation(entry.id,{from:{offset:{x:0,y:-1}}});
 store.updateAnimation(exit.id,{to:{x:0,y:1}});
 assert.deepEqual(store.slide.animations[0].from.offset,{x:0,y:-1});
 assert.deepEqual(store.slide.animations[1].to,{x:0,y:1});
 assert.ok(!preflight(store.getSnapshot().doc,'html').warnings.some(w=>w.includes('Importerade avancerade animeringar')),'Supported fly effects should not trigger unsupported HTML warning');
 assert.throws(()=>store.updateAnimation(entry.id,{from:{offset:{x:3,y:0}}}),/INVALID_ANIMATION_PATCH/);
 validateCore(store.getSnapshot().doc);
 store.undo();assert.deepEqual(store.slide.animations[1].to,{x:1,y:0});
 store.redo();assert.deepEqual(store.slide.animations[1].to,{x:0,y:1});
});
test('SF-ANIM-02 list builds one click step per list paragraph and preserves non-list paragraphs',()=>{
 const store=new EditorStore(),id=store.add('text');
 store.updateElement(id,{text:{paragraphs:[
  {id:'p0',runs:[{text:'Rubrik'}]},
  {id:'p1',runs:[{text:'Första'}],paragraphStyle:{listType:'bullet'}},
  {id:'p2',runs:[{text:'Andra'}],paragraphStyle:{listType:'bullet'}},
  {id:'p3',runs:[{text:'Tredje'}],paragraphStyle:{listType:'number'}}
 ]}});
 store.addAnimation(id,'bullet-steps');
 assert.equal(store.slide.animations.length,3);
 assert.deepEqual(store.slide.animations.map(a=>a.from.paragraph.x),[1,2,3]);
 assert.deepEqual(animationSchedule(store.slide).map(a=>a.group),[1,2,3]);
 assert.equal(playbackSteps(store.slide),3);
 validateCore(store.getSnapshot().doc);
 store.undo();assert.equal(store.slide.animations?.length??0,0);
 store.redo();assert.equal(store.slide.animations.length,3);
});
test('SF-ANIM-02 fly effects use relative translate without overriding shape rotation',()=>{
 globalThis.CSS={escape:s=>s};
 const calls=[],node={style:{visibility:'',opacity:''},animate:(frames,options)=>{calls.push({frames,options});return {cancel(){}};}};
 const root={querySelector:()=>node};
 const slide={animations:[{targetId:'fly',effect:'fly-in',phase:'entrance',trigger:'on-click',durationMs:400,delayMs:70,from:{offset:{x:0,y:-1}}},{targetId:'fly',effect:'fly-out',phase:'exit',trigger:'on-click',durationMs:300,delayMs:0,to:{x:1,y:0}}]};
 applyPlayback(root,slide,1);assert.equal(calls[0].frames[0].translate,'0% -110%');assert.equal(calls[0].frames[1].translate,'0% 0%');
 assert.equal(calls[0].options.delay,70);
 applyPlayback(root,slide,2);assert.equal(calls[1].frames[0].translate,'0% 0%');assert.equal(calls[1].frames[1].translate,'110% 0%');
});
test('SF-ANIM-02 bullet animation only hides paragraph target rather than its text box',()=>{
 globalThis.CSS={escape:s=>s};
 const make=()=>({style:{visibility:'',opacity:''},animate(frames,options){this.frames=frames;this.options=options;return {cancel(){}};}});
 const nodes=[make(),make(),make()],parent=make();
 parent.querySelectorAll=()=>nodes;
 const root={querySelector:()=>parent};
 const slide={animations:[1,2].map((i)=>({targetId:'list',effect:'appear',phase:'entrance',trigger:'on-click',durationMs:0,delayMs:0,from:{paragraph:{x:i,y:0}}}))};
 const clean0=applyPlayback(root,slide,0);assert.equal(parent.style.visibility,'');assert.equal(nodes[0].style.visibility,'');assert.equal(nodes[1].style.visibility,'hidden');assert.equal(nodes[2].style.visibility,'hidden');clean0();
 const clean1=applyPlayback(root,slide,1,false,false);assert.equal(nodes[1].style.visibility,'visible');assert.equal(nodes[2].style.visibility,'hidden');clean1();
 const clean2=applyPlayback(root,slide,2,true,false);assert.equal(nodes[1].style.visibility,'visible');assert.equal(nodes[2].style.visibility,'visible');clean2();
});
