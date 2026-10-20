import {test} from 'node:test';import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';import {validateCore} from '../src/core/contract.ts';import {updateSafety} from '../src/pwa/safety.ts';
test('commands, undo/redo and duplicate slides keep references valid',()=>{const s=new EditorStore();const before=JSON.stringify(s.getSnapshot().doc);s.add('shape');s.undo();assert.equal(JSON.stringify(s.getSnapshot().doc),before);s.redo();assert.equal(s.slide.view.elements.length,3);s.duplicateSlide();validateCore(s.getSnapshot().doc);assert.equal(s.getSnapshot().doc.slides.length,2);});
test('group/ungroup and repeated object paste preserve IDs and references',()=>{const s=new EditorStore();const a=s.add('shape'),b=s.add('text');s.select([a,b]);s.group();validateCore(s.getSnapshot().doc);s.paste(s.copySelected());validateCore(s.getSnapshot().doc);s.ungroup();validateCore(s.getSnapshot().doc);s.undo();validateCore(s.getSnapshot().doc);});
test('master propagation respects local overrides and layout reset',()=>{const s=new EditorStore();const title=s.slide.view.elements[0];s.transaction(d=>d.masters[0].layouts[0].placeholders[0].geometry.x=250);assert.equal(s.getSnapshot().doc.masters[0].layouts[0].placeholders[0].geometry.x,250);s.updateElement(title.id,{geometry:{x:10,y:10,width:300,height:100}});s.resetLayout();assert.equal(s.slide.placeholderBindings[0].overrides,undefined);validateCore(s.getSnapshot().doc);});
test('failed operation does not change document or update guard',()=>{const s=new EditorStore();updateSafety.setDirty(false);const before=s.getSnapshot().doc;assert.throws(()=>s.updateDocument({canvas:{width:-1,height:900}}));assert.equal(s.getSnapshot().doc,before);assert.equal(updateSafety.getSnapshot().dirty,false);});

test('HTML export acknowledgement does not bypass pending local persistence or update guard',()=>{
 const s=new EditorStore();updateSafety.setDirty(false);s.updateDocument({title:'Export in debounce window'});const doc=s.getSnapshot().doc;const revision=doc.document.revision;
 assert.equal(s.getSnapshot().dirty,true);assert.equal(updateSafety.prepare(),false);
 s.markExported(revision);assert.equal(s.getSnapshot().exportedRevision,revision);assert.equal(s.getSnapshot().dirty,true);assert.equal(updateSafety.prepare(),false);
 assert.equal(s.markPersisted(doc),true);assert.equal(s.getSnapshot().dirty,false);assert.equal(updateSafety.getSnapshot().dirty,false);
});
test('stale CAS completion never acknowledges newer edits',()=>{
 const s=new EditorStore();updateSafety.setDirty(false);s.updateDocument({title:'First'});const stale=s.getSnapshot().doc;
 s.updateDocument({title:'Second'});s.markExported(stale.document.revision);assert.equal(s.getSnapshot().exportedRevision,null);
 assert.equal(s.markPersisted(stale),false);assert.equal(s.getSnapshot().dirty,true);assert.equal(updateSafety.prepare(),false);
 assert.equal(s.markPersisted(s.getSnapshot().doc),true);assert.equal(s.getSnapshot().dirty,false);
});
