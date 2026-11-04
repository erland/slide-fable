import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expandedTextHeight} from '../src/editor/textHeight.ts';
import {EditorStore} from '../src/core/editor.ts';
import {effective} from '../src/core/model.ts';
import {validateCore} from '../src/core/contract.ts';

test('text box grows enough for measured content and padding',()=>{
 assert.equal(expandedTextHeight(100,180,12,12,500),205);
});
test('never shrinks or extends past the slide allocation',()=>{
 assert.equal(expandedTextHeight(250,20,12,12,500),250);
 assert.equal(expandedTextHeight(100,900,12,12,300),300);
 assert.equal(expandedTextHeight(300,900,12,12,200),300);
});
test('rejects invalid measurements',()=>{
 assert.throws(()=>expandedTextHeight(100,NaN,0,0,200),/INVALID_TEXT_HEIGHT/);
 assert.throws(()=>expandedTextHeight(100,30,-2,0,200),/INVALID_TEXT_HEIGHT/);
});
test('persisted expanded geometry and overflow policy survive undo/redo and validation',()=>{
 const store=new EditorStore();const id=store.add('text');
 const before=effective(store.getSnapshot().doc,store.slide,store.slide.view.elements.find(e=>e.id===id)).geometry;
 const original=store.slide.view.elements.find(e=>e.id===id).text;
 store.editText(id,{...original,overflow:'expand-height'});
 const after=expandedTextHeight(before.height,400,0,0,1200);
 store.setElementGeometry(id,{...before,height:after});
 assert.equal(store.slide.view.elements.find(e=>e.id===id).geometry.height,after);
 assert.equal(store.slide.view.elements.find(e=>e.id===id).text.overflow,'expand-height');
 validateCore(store.getSnapshot().doc);
 store.undo();assert.equal(store.slide.view.elements.find(e=>e.id===id).geometry.height,before.height);
 store.redo();assert.equal(store.slide.view.elements.find(e=>e.id===id).geometry.height,after);
 validateCore(store.getSnapshot().doc);
});
