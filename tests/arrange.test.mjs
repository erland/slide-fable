import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrangeSelection,matchSelectionSize,scaleSelection,selectionBounds,scaleSelectionFromCorner,snapSelectionScaleFromCorner} from '../src/core/arrange.ts';
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

test('match width, height and both to primary selection while preserving positions',()=>{
 for(const mode of ['width','height','both']){
  const actual=matchSelectionSize(items,'b',mode);
  for(const [index,item] of actual.entries()){
   assert.equal(item.geometry.x,items[index].geometry.x);
   assert.equal(item.geometry.y,items[index].geometry.y);
   assert.equal(item.geometry.width,mode==='height'?items[index].geometry.width:80);
   assert.equal(item.geometry.height,mode==='width'?items[index].geometry.height:50);
  }
 }
 assert.deepEqual(items[0].geometry,{x:60,y:70,width:60,height:40},'pure helper does not mutate source');
});
test('match dimensions rejects missing reference and invalid geometry',()=>{
 assert.throws(()=>matchSelectionSize(items,'not-selected','width'),/INVALID_SIZE_REFERENCE/);
 assert.throws(()=>matchSelectionSize(items,'b','invalid'),/INVALID_SIZE_MODE/);
 const broken=[items[0],{id:'bad',geometry:{x:0,y:0,width:0,height:10}}];
 assert.throws(()=>matchSelectionSize(broken,'a','both'),/INVALID_ARRANGEMENT_GEOMETRY/);
});
test('editor matchSize ignores locked and connector objects and supports undo',()=>{
 const store=new EditorStore();
 const primary=store.add('shape'),target=store.add('shape'),locked=store.add('shape'),line=store.add('line');
 store.setElementGeometry(primary,{x:130,y:100,width:230,height:125});
 store.setElementGeometry(target,{x:430,y:260,width:75,height:40});
 store.setElementGeometry(locked,{x:610,y:210,width:65,height:60});
 store.updateElement(locked,{locked:true});
 const before=store.slide.view.elements.filter(e=>[primary,target,locked,line].includes(e.id)).map(e=>({id:e.id,geometry:{...e.geometry}}));
 store.select([primary,target,locked,line]);
 store.matchSize('both');
 const find=id=>store.slide.view.elements.find(e=>e.id===id).geometry;
 assert.deepEqual(find(primary),before.find(e=>e.id===primary).geometry);
 assert.deepEqual(find(target),{x:430,y:260,width:230,height:125});
 assert.deepEqual(find(locked),before.find(e=>e.id===locked).geometry);
 assert.deepEqual(find(line),before.find(e=>e.id===line).geometry);
 validateCore(store.getSnapshot().doc);
 store.undo();
 for(const item of before)assert.deepEqual(find(item.id),item.geometry);
});
test('matchSize with fewer than two eligible objects or already equal dimensions does not add history',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape');
 store.select([a]);let revision=store.getSnapshot().undo;store.matchSize('width');
 assert.equal(store.getSnapshot().undo,revision);
 const geo={x:120,y:200,width:100,height:70};
 store.setElementGeometry(a,geo);store.setElementGeometry(b,{...geo,x:400});
 store.select([a,b]);revision=store.getSnapshot().undo;store.matchSize('both');
 assert.equal(store.getSnapshot().undo,revision);
});

test('proportional scale preserves aspect ratios and relative center offsets',()=>{
 const original=items.map(i=>({id:i.id,geometry:{...i.geometry}}));
 const result=scaleSelection(items,1.5);
 const left=Math.min(...items.map(i=>i.geometry.x)),right=Math.max(...items.map(i=>i.geometry.x+i.geometry.width));
 const top=Math.min(...items.map(i=>i.geometry.y)),bottom=Math.max(...items.map(i=>i.geometry.y+i.geometry.height));
 const cx=(left+right)/2,cy=(top+bottom)/2;
 for(let i=0;i<result.length;i++){
  const b=result[i].geometry,a=items[i].geometry;
  assert.equal(b.x,cx+(a.x-cx)*1.5);
  assert.equal(b.y,cy+(a.y-cy)*1.5);
  assert.equal(b.width,a.width*1.5);
  assert.equal(b.height,a.height*1.5);
  assert.equal(b.width/b.height,a.width/a.height);
 }
 assert.deepEqual(items,original,'helper does not mutate input');
});
test('scaling the collection down keeps its center fixed',()=>{
 const result=scaleSelection(items,.75);
 const bounds=arr=>({left:Math.min(...arr.map(i=>i.geometry.x)),right:Math.max(...arr.map(i=>i.geometry.x+i.geometry.width)),top:Math.min(...arr.map(i=>i.geometry.y)),bottom:Math.max(...arr.map(i=>i.geometry.y+i.geometry.height))});
 const before=bounds(items),after=bounds(result);
 assert.ok(Math.abs((before.left+before.right)/2-(after.left+after.right)/2)<1e-9);
 assert.ok(Math.abs((before.top+before.bottom)/2-(after.top+after.bottom)/2)<1e-9);
});
test('rejects invalid scale and geometry, and ignores fewer than two objects',()=>{
 for(const factor of [0,.2,2.1,Infinity,NaN])assert.throws(()=>scaleSelection(items,factor),/INVALID_SCALE_FACTOR/);
 assert.deepEqual(scaleSelection(items.slice(0,1),1.25),items.slice(0,1));
 assert.throws(()=>scaleSelection([items[0],{id:'bad',geometry:{x:0,y:0,width:0,height:10}}],1.5),/INVALID_ARRANGEMENT_GEOMETRY/);
});
test('editor scales relative positions, excludes locked and line elements, validates and undoes',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape'),locked=store.add('shape'),line=store.add('line');
 store.setElementGeometry(a,{x:100,y:100,width:100,height:80});
 store.setElementGeometry(b,{x:400,y:300,width:150,height:100});
 store.setElementGeometry(locked,{x:700,y:200,width:70,height:60});
 store.updateElement(locked,{locked:true});
 store.select([a,b,locked,line]);
 const original=store.slide.view.elements.filter(e=>[a,b,locked,line].includes(e.id)).map(e=>({id:e.id,geometry:{...e.geometry}}));
 store.scaleSelected(1.25);
 const get=id=>store.slide.view.elements.find(e=>e.id===id).geometry;
 assert.deepEqual(get(locked),original.find(e=>e.id===locked).geometry);
 assert.deepEqual(get(line),original.find(e=>e.id===line).geometry);
 assert.equal(get(a).width,125);
 assert.equal(get(b).width,187.5);
 assert.equal(get(a).x,43.75);
 assert.equal(get(b).x,418.75);
 validateCore(store.getSnapshot().doc);
 store.undo();
 for(const item of original)assert.deepEqual(get(item.id),item.geometry);
});
test('no-op scaling does not create history and too-small scales are rejected atomically',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape');
 store.select([a,b]);
 let revision=store.getSnapshot().undo;
 store.scaleSelected(1);
 assert.equal(store.getSnapshot().undo,revision);
 store.setElementGeometry(a,{x:10,y:10,width:20,height:20});
 store.setElementGeometry(b,{x:100,y:100,width:80,height:80});
 revision=store.getSnapshot().undo;
 assert.throws(()=>store.scaleSelected(.25),/SCALE_BELOW_MINIMUM/);
 assert.equal(store.getSnapshot().undo,revision);
});

test('selection bounds enclose all selected rectangles',()=>{
 assert.deepEqual(selectionBounds(items),{x:60,y:70,width:450,height:260});
});
test('corner scale preserves opposite corner and relative positions',()=>{
 const starting=selectionBounds(items);
 const scaled=scaleSelectionFromCorner(items,'se',45,0);
 assert.equal(scaled.factor,1.1);
 assert.equal(scaled.bounds.x,starting.x);
 assert.equal(scaled.bounds.y,starting.y);
 assert.ok(Math.abs(scaled.bounds.width-starting.width*1.1)<1e-8);
 assert.ok(Math.abs(scaled.bounds.height-starting.height*1.1)<1e-8);
 for(let i=0;i<items.length;i++){
  const a=items[i].geometry,b=scaled.items[i].geometry;
  assert.ok(Math.abs(b.x-(starting.x+(a.x-starting.x)*1.1))<1e-8);
  assert.ok(Math.abs(b.y-(starting.y+(a.y-starting.y)*1.1))<1e-8);
  assert.ok(Math.abs(b.width-a.width*1.1)<1e-8);
  assert.ok(Math.abs(b.height-a.height*1.1)<1e-8);
 }
});
test('northwest corner anchors lower right and shrinks uniformly',()=>{
 const before=selectionBounds(items);
 const result=scaleSelectionFromCorner(items,'nw',45,0);
 assert.equal(result.factor,.9);
 assert.ok(Math.abs(result.bounds.x+result.bounds.width-(before.x+before.width))<1e-9);
 assert.ok(Math.abs(result.bounds.y+result.bounds.height-(before.y+before.height))<1e-9);
});
test('north east corner anchors lower left and uses vertical drag when dominant',()=>{
 const b=selectionBounds(items);
 const result=scaleSelectionFromCorner(items,'ne',0,-26);
 assert.equal(result.factor,1.1);
 assert.equal(result.bounds.x,b.x);
 assert.ok(Math.abs(result.bounds.y+result.bounds.height-(b.y+b.height))<1e-8);
});
test('corner scale clamps before any object falls below 10 logical units',()=>{
 const peers=[{id:'a',geometry:{x:10,y:20,width:20,height:25}},{id:'b',geometry:{x:80,y:60,width:100,height:60}}];
 const result=scaleSelectionFromCorner(peers,'se',-500,-500);
 assert.equal(result.factor,.5);
 assert.equal(result.items[0].geometry.width,10);
 assert.ok(result.items.every(i=>i.geometry.width>=10&&i.geometry.height>=10));
});
test('corner scale rejects non-finite drag and invalid selection',()=>{
 assert.throws(()=>scaleSelectionFromCorner(items,'se',Infinity,0),/INVALID_SCALE_DRAG/);
 assert.throws(()=>scaleSelectionFromCorner(items,'not-corner',0,0),/INVALID_SCALE_DRAG/);
 assert.throws(()=>selectionBounds([]),/EMPTY_SCALE_SELECTION/);
});
test('interactive corner scale persists as one undoable transaction and skips locked objects',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape'),locked=store.add('shape');
 store.setElementGeometry(a,{x:100,y:100,width:100,height:80});
 store.setElementGeometry(b,{x:400,y:300,width:150,height:100});
 store.setElementGeometry(locked,{x:600,y:200,width:80,height:60});
 store.updateElement(locked,{locked:true});
 store.select([a,b,locked]);
 const before=[a,b,locked].map(id=>({id,geometry:{...store.slide.view.elements.find(e=>e.id===id).geometry}}));
 const history=store.getSnapshot().undo;
 store.scaleSelectedFromCorner('se',45,0);
 const get=id=>store.slide.view.elements.find(e=>e.id===id).geometry;
 assert.equal(store.getSnapshot().undo,history+1);
 assert.deepEqual(get(a),{x:100,y:100,width:110.00000000000001,height:88});
 assert.deepEqual(get(locked),before[2].geometry);
 validateCore(store.getSnapshot().doc);
 store.undo();
 for(const item of before)assert.deepEqual(get(item.id),item.geometry);
});
test('zero-delta corner drag does not add an undo entry',()=>{
 const store=new EditorStore(),a=store.add('shape'),b=store.add('shape');
 store.select([a,b]);const history=store.getSnapshot().undo;
 store.scaleSelectedFromCorner('se',0,0);
 assert.equal(store.getSnapshot().undo,history);
});

test('corner scaling snaps active edge to a nearby object line and keeps anchor fixed',()=>{
 const a=[{id:'left',geometry:{x:100,y:100,width:100,height:80}},{id:'right',geometry:{x:250,y:130,width:150,height:120}}];
 const target={x:440,y:10,width:100,height:100};
 const snapped=snapSelectionScaleFromCorner(a,'se',[37][0],0,[target],true,false,7);
 assert.equal(snapped.guides.x,440);
 assert.deepEqual(snapped.guides,{x:440});
 assert.equal(snapped.bounds.x,100);
 assert.equal(snapped.bounds.y,100);
 assert.ok(Math.abs(snapped.bounds.x+snapped.bounds.width-440)<1e-8);
 const originalAspect=a[0].geometry.width/a[0].geometry.height;
 assert.equal(snapped.items[0].geometry.width/snapped.items[0].geometry.height,originalAspect);
});
test('Alt bypass and disabled snapping preserve raw corner scale',()=>{
 const a=[{id:'a',geometry:{x:100,y:100,width:100,height:80}},{id:'b',geometry:{x:250,y:130,width:150,height:120}}];
 const other=[{x:440,y:10,width:100,height:100}];
 const raw=scaleSelectionFromCorner(a,'se',37,0);
 for(const [enabled,bypass] of [[false,false],[true,true]]){
  const actual=snapSelectionScaleFromCorner(a,'se',37,0,other,enabled,bypass);
  assert.equal(actual.factor,raw.factor);
  assert.deepEqual(actual.guides,{});
 }
});
test('corner snap rejects impossible scaling and ignores invalid neighbor bounds',()=>{
 const small=[{id:'a',geometry:{x:100,y:100,width:20,height:20}},{id:'b',geometry:{x:160,y:140,width:80,height:80}}];
 const result=snapSelectionScaleFromCorner(small,'se',-400,-400,[{x:190,y:0,width:NaN,height:100}],true,false);
 assert.equal(result.factor,.5);
 assert.deepEqual(result.guides,{});
});
test('persisted guided corner scaling matches calculated preview and can be undone',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('shape'),other=store.add('shape');
 store.setElementGeometry(a,{x:100,y:100,width:100,height:80});
 store.setElementGeometry(b,{x:250,y:130,width:150,height:120});
 store.setElementGeometry(other,{x:440,y:10,width:100,height:100});
 store.select([a,b]);
 const source=[a,b].map(id=>({id,geometry:{...store.slide.view.elements.find(e=>e.id===id).geometry}}));
 const guide=snapSelectionScaleFromCorner(source,'se',37,0,[store.slide.view.elements.find(e=>e.id===other).geometry]);
 assert.equal(guide.guides.x,440);
 const before=store.getSnapshot().undo;
 store.scaleSelectedFromCorner('se',37,0,true);
 assert.equal(store.getSnapshot().undo,before+1);
 for(const item of guide.items)assert.deepEqual(store.slide.view.elements.find(e=>e.id===item.id).geometry,item.geometry);
 validateCore(store.getSnapshot().doc);
 store.undo();
 for(const item of source)assert.deepEqual(store.slide.view.elements.find(e=>e.id===item.id).geometry,item.geometry);
});
