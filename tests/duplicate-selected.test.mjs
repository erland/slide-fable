import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {textOf} from '../src/core/model.ts';

test('duplicateSelected clones text and geometry in one undoable edit',()=>{
 const store=new EditorStore();
 const id=store.add('text');
 store.editText(id,{paragraphs:[{id:'dup-p',runs:[{text:'Duplicerad text',marks:{bold:true},color:'#123456'}]}]});
 store.select([id]);
 const before=structuredClone(store.getSnapshot().doc);
 const original=store.slide.view.elements.find(e=>e.id===id);
 const undoBefore=store.getSnapshot().undo;
 const ids=store.duplicateSelected();
 assert.equal(ids.length,1);
 assert.notEqual(ids[0],id);
 assert.deepEqual(store.getSnapshot().selected,ids);
 assert.equal(store.getSnapshot().undo,undoBefore+1);
 const clone=store.slide.view.elements.find(e=>e.id===ids[0]);
 assert.ok(clone);
 assert.equal(clone.geometry.x,original.geometry.x+24);
 assert.equal(clone.geometry.y,original.geometry.y+24);
 assert.deepEqual(textOf(store.slide,clone),textOf(store.slide,original),'Rich text and formatting must be preserved');
 if(original.contentRef)assert.notEqual(clone.contentRef,original.contentRef,'Referenced text blocks must be cloned');
 store.undo();
 assert.deepEqual(store.getSnapshot().doc,before);
 store.redo();
 assert.ok(store.slide.view.elements.some(e=>e.id===ids[0]));
});

test('duplicateSelected leaves presentation unchanged without selected objects',()=>{
 const store=new EditorStore();
 const state=store.getSnapshot();
 assert.deepEqual(store.duplicateSelected(),[]);
 assert.equal(store.getSnapshot(),state);
});

test('duplicateSelected clones multiple selected objects together and preserves relative offsets',()=>{
 const store=new EditorStore();
 const a=store.add('shape'),b=store.add('text');
 store.select([a,b]);
 const originals=[a,b].map(id=>store.slide.view.elements.find(e=>e.id===id));
 const ids=store.duplicateSelected();
 assert.equal(ids.length,2);
 for(const [index,id] of ids.entries()){
  const el=store.slide.view.elements.find(e=>e.id===id);
  assert.ok(el);
  assert.notEqual(id,[a,b][index]);
  assert.equal(el.geometry.x,originals[index].geometry.x+24);
  assert.equal(el.geometry.y,originals[index].geometry.y+24);
 }
});