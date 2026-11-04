import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSelection,movableSelection,marqueeBounds,marqueeSelection} from '../src/core/selection.ts';

test('clicking a new object replaces selection and starts a drag',()=>{
 assert.deepEqual(resolveSelection(['first','second'],'third'),{ids:['third'],beginDrag:true});
});
test('clicking within a multi-selection preserves it and starts a drag',()=>{
 assert.deepEqual(resolveSelection(['first','second'],'second'),{ids:['first','second'],beginDrag:true});
});
test('shift-click adds an unselected object without initiating dragging',()=>{
 assert.deepEqual(resolveSelection(['first'],'second',true),{ids:['first','second'],beginDrag:false});
});
test('shift-click a selected object removes it from the selection',()=>{
 assert.deepEqual(resolveSelection(['first','second'],'first',true),{ids:['second'],beginDrag:false});
 assert.deepEqual(resolveSelection(['first'],'first',true),{ids:[],beginDrag:false});
});
test('locked and missing elements do not move even when they remain selected',()=>{
 const elements=[{id:'a',locked:false},{id:'b',locked:true},{id:'c'}];
 assert.deepEqual(movableSelection(['a','b','missing','c'],elements),['a','c']);
 assert.deepEqual(movableSelection(['b'],elements),[]);
});
test('selection helpers never mutate input arrays',()=>{
 const selected=['a','b'],elements=[{id:'a',locked:true},{id:'b',locked:false}];
 resolveSelection(selected,'a',true);
 movableSelection(selected,elements);
 assert.deepEqual(selected,['a','b']);
});
test('empty selection ID is rejected',()=>assert.throws(()=>resolveSelection([],'',true),/INVALID_SELECTION_ID/));

const objects=[
 {id:'left',geometry:{x:10,y:20,width:50,height:40}},
 {id:'middle',geometry:{x:90,y:40,width:60,height:40}},
 {id:'edge',geometry:{x:145,y:85,width:30,height:30}},
 {id:'locked',locked:true,geometry:{x:30,y:100,width:40,height:40}},
 {id:'hidden',visible:false,geometry:{x:20,y:30,width:15,height:15}}
];
test('marqueeBounds works in all four drag directions',()=>{
 const expected={x:10,y:20,width:140,height:110};
 for(const start of [{x:10,y:20},{x:150,y:130},{x:10,y:130},{x:150,y:20}]){
  const end={x:start.x===10?150:10,y:start.y===20?130:20};
  assert.deepEqual(marqueeBounds(start,end),expected);
 }
});
test('marquee fully contains visible unlocked and locked objects, but not partial overlap',()=>{
 const rect={x:0,y:0,width:150,height:150};
 assert.deepEqual(marqueeSelection([],objects,rect),['left','middle','locked']);
});
test('shift-marquee extends original selection without duplicates',()=>{
 const rect={x:0,y:0,width:80,height:155};
 assert.deepEqual(marqueeSelection(['middle','left'],objects,rect,true),['middle','left','locked']);
 assert.deepEqual(marqueeSelection(['middle','left'],objects,rect,false),['left','locked']);
});
test('empty marquee leaves Shift selection and clears plain selection',()=>{
 const rect={x:500,y:500,width:20,height:20};
 assert.deepEqual(marqueeSelection(['middle'],objects,rect,true),['middle']);
 assert.deepEqual(marqueeSelection(['middle'],objects,rect,false),[]);
});
test('marquee ignores invalid element geometry and rejects non-finite coordinates',()=>{
 assert.throws(()=>marqueeBounds({x:NaN,y:0},{x:10,y:10}),/INVALID_MARQUEE_COORDINATES/);
 assert.throws(()=>marqueeSelection([],objects,{x:0,y:0,width:-1,height:10}),/INVALID_MARQUEE_RECT/);
 assert.deepEqual(marqueeSelection([],[{id:'bad',geometry:{x:0,y:0,width:Infinity,height:10}}],{x:0,y:0,width:100,height:100}),[]);
});
