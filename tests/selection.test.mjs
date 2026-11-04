import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSelection,movableSelection} from '../src/core/selection.ts';

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
