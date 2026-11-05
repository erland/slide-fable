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
