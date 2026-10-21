import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {validateCore} from '../src/core/contract.ts';
import {effective,textOf} from '../src/core/model.ts';

test('PPD contract permits independent fill, stroke and font style on text and shape',()=>{
 const store=new EditorStore();
 const textId=store.add('text'),shapeId=store.add('shape');
 const surface={fill:{color:'#E9F4F1'},stroke:{color:'#136A70'},strokeWidth:4,
  color:'#182F36',fontSize:38,padding:12};
 store.updateElement(textId,{style:surface});
 store.updateElement(shapeId,{style:{...surface,fill:{color:'#F2D8B4'}}});
 const doc=store.getSnapshot().doc;
 assert.doesNotThrow(()=>validateCore(doc));
 const original=JSON.stringify(doc);
 const reopened=JSON.parse(original);
 assert.doesNotThrow(()=>validateCore(reopened));
 for(const id of [textId,shapeId]){
  const element=reopened.slides[0].view.elements.find(e=>e.id===id);
  assert.equal(element.style.strokeWidth,4);
  assert.equal(element.style.stroke.color,'#136A70');
  assert.equal(element.style.color,'#182F36');
  assert.equal(element.style.fontSize,38);
  assert.ok(element.style.fill.color.startsWith('#'));
 }
 assert.equal(JSON.stringify(doc),original,'Serialization must not mutate the editor state');
});

test('text content and explicit run formatting survive unrelated surface patches',()=>{
 const store=new EditorStore();
 const id=store.add('text');
 const before=textOf(store.slide,store.slide.view.elements.find(e=>e.id===id));
 store.updateElement(id,{style:{fill:{color:'#ABCDEF'},stroke:{color:'#234567'},strokeWidth:3}});
 const after=textOf(store.slide,store.slide.view.elements.find(e=>e.id===id));
 assert.deepEqual(after,before);
 store.undo();
 assert.equal(store.slide.view.elements.find(e=>e.id===id).style.fill,undefined);
 store.redo();
 assert.equal(store.slide.view.elements.find(e=>e.id===id).style.strokeWidth,3);
});

test('effective styles retain surface and text values for a content-bound text object',()=>{
 const store=new EditorStore();
 const element=store.slide.view.elements[0];
 store.updateElement(element.id,{style:{fill:{color:'#EEF0FF'},stroke:{color:'#112233'},strokeWidth:2}});
 const result=effective(store.getSnapshot().doc,store.slide,store.slide.view.elements[0]);
 assert.equal(result.style.fill.color,'#EEF0FF');
 assert.equal(result.style.strokeWidth,2);
 assert.ok(textOf(store.slide,element).paragraphs.length>0);
});
