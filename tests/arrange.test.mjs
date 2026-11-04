import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrangeSelection} from '../src/core/arrange.ts';
import {EditorStore} from '../src/core/editor.ts';
import {validateCore} from '../src/core/contract.ts';

const items=[
 {id:'a',geometry:{x:60,y:70,width:60,height:40}},
 {id:'b',geometry:{x:230,y:140,width:80,height:50}},
 {id:'c',geometry:{x:410,y:260,width:100,height:70}}
];

test('align left, center, right within selection bounds without resizing',()=>{
 for(const mode of ['left','center','right']){
  const result=arrangeSelection(items,mode);
  const edges=result.map(i=>mode==='left'?i.geometry.x:mode==='right'?i.geometry.x+i.geometry.width:i.geometry.x+i.geometry.width/2);
  assert.ok(edges.every(e=>e===edges[0]),mode);
  assert.deepEqual(result.map(i=>i.geometry.width),[60,80,100]);
 }
 assert.equal(arrangeSelection(items,'left')[0].geometry.x,60,'aligning should not jump to slide edge');
 assert.equal(arrangeSelection(items,'right')[2].geometry.x,410);
});
test('vertical top middle and bottom alignment uses selection bounds',()=>{
 for(const mode of ['top','middle','bottom']){
  const result=arrangeSelection(items,mode);
  const edges=result.map(i=>mode==='top'?i.geometry.y:mode==='bottom'?i.geometry.y+i.geometry.height:i.geometry.y+i.geometry.height/2);
  assert.ok(edges.every(e=>e===edges[0]),mode);
 }
});
test('distribute horizontally by equal edge-to-edge gaps and keep endpoints fixed',()=>{
 const result=arrangeSelection(items,'distribute-x');
 const [a,b,c]=result.map(i=>i.geometry);
 assert.equal(a.x,60);assert.equal(c.x,410);
 assert.equal(b.x-(a.x+a.width),c.x-(b.x+b.width));
 assert.equal(b.y,140);
});
test('distribute vertically by equal gaps and keep endpoints fixed',()=>{
 const result=arrangeSelection(items,'distribute-y');
 const [a,b,c]=result.map(i=>i.geometry);
 assert.equal(a.y,70);assert.equal(c.y,260);
 assert.equal(b.y-(a.y+a.height),c.y-(b.y+b.height));
});
test('single and two-item distribution return unchanged layouts',()=>{
 assert.deepEqual(arrangeSelection(items.slice(0,1),'left'),items.slice(0,1));
 assert.deepEqual(arrangeSelection(items.slice(0,2),'distribute-x'),items.slice(0,2));
});
test('arrangement rejects invalid geometry instead of silently changing a document',()=>{
 assert.throws(()=>arrangeSelection([{id:'bad',geometry:{x:0,y:0,width:20,height:30}}, {id:'bad2',geometry:{x:NaN,y:0,width:10,height:20}}],'left'),/INVALID_ARRANGEMENT_GEOMETRY/);
});
test('editor alignment respects locked objects and remains undoable and PPD-valid',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape'),c=store.add('shape');
 store.setElementGeometry(a,{x:90,y:110,width:90,height:40});
 store.setElementGeometry(b,{x:250,y:160,width:110,height:40});
 store.setElementGeometry(c,{x:450,y:210,width:90,height:40});
 store.updateElement(b,{locked:true});
 const before=store.slide.view.elements.filter(e=>[a,b,c].includes(e.id)).map(e=>({id:e.id,geometry:{...e.geometry}}));
 store.select([a,b,c]);
 store.align('left');
 const after=store.slide.view.elements.filter(e=>[a,b,c].includes(e.id));
 assert.equal(after.find(e=>e.id===a).geometry.x,90);
 assert.equal(after.find(e=>e.id===c).geometry.x,90);
 assert.equal(after.find(e=>e.id===b).geometry.x,250);
 validateCore(store.getSnapshot().doc);
 store.undo();
 for(const item of before)assert.deepEqual(store.slide.view.elements.find(e=>e.id===item.id).geometry,item.geometry);
});
test('too few editable objects do not create undo history',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape');
 store.select([a,b]);const before=store.getSnapshot().undo;
 store.align('distribute-x');
 assert.equal(store.getSnapshot().undo,before);
});
