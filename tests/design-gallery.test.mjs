import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {createDocument,effective,textOf} from '../src/core/model.ts';
import {validateCore} from '../src/core/contract.ts';
import {themeChoices,designTemplate} from '../src/core/designGallery.ts';

test('gallery layout maps content by role, creates missing placeholders and preserves unmatched content',()=>{
 const store=new EditorStore(),before=structuredClone(store.getSnapshot().doc),ids=store.slide.view.elements.map(e=>e.id);
 store.applyLayout('columns');
 assert.equal(store.slide.placeholderBindings.length,3);
 for(const id of ids)assert.deepEqual(textOf(store.slide,store.slide.view.elements.find(e=>e.id===id)),textOf(before.slides[0],before.slides[0].view.elements.find(e=>e.id===id)));
 assert.equal(effective(store.getSnapshot().doc,store.slide,store.slide.view.elements.find(e=>e.id===ids[1])).geometry.width,650);
 validateCore(store.getSnapshot().doc);store.undo();assert.deepEqual(store.getSnapshot().doc,before);store.redo();
 const textBefore=store.slide.view.elements.map(e=>textOf(store.slide,e));
 store.applyLayout('blank');assert.equal(store.slide.placeholderBindings.length,0);
 assert.deepEqual(store.slide.view.elements.map(e=>textOf(store.slide,e)),textBefore);validateCore(store.getSnapshot().doc);
});
test('theme changes are atomic, preserve local overrides, update inherited styles and survive persistence',()=>{
 const store=new EditorStore(),id=store.slide.view.elements[0].id;
 store.updateElement(id,{style:{color:'#ff0000'}});const before=structuredClone(store.getSnapshot().doc);
 store.applyTheme(themeChoices[1]);
 assert.equal(store.getSnapshot().doc.theme.colors.surface,'#173944');
 assert.equal(effective(store.getSnapshot().doc,store.slide,store.slide.view.elements[0]).style.color,'#ff0000');
 assert.equal(effective(store.getSnapshot().doc,store.slide,store.slide.view.elements[1]).style.color,'#f5f7fa');
 validateCore(JSON.parse(JSON.stringify(store.getSnapshot().doc)));
 store.undo();assert.deepEqual(store.getSnapshot().doc,before);
 assert.throws(()=>store.applyTheme({...themeChoices[0],ink:'bad'}),/INVALID_THEME/);assert.deepEqual(store.getSnapshot().doc,before);
 store.load(before,true);assert.throws(()=>store.applyTheme(themeChoices[0]),/READ_ONLY/);
});
test('portable design templates omit source slides, speaker notes and unreferenced assets',()=>{
 const source=createDocument();source.slides[0].delivery.speakerNotes='PRIVATE NOTES';
 source.assets.unused={kind:'image',storage:'embedded',mimeType:'image/png',uri:'data:image/png;base64,not-used'};
 const before=structuredClone(source),template=designTemplate(source);
 assert.deepEqual(source,before);validateCore(template);
 assert.notEqual(template.document.id,source.document.id);
 assert.equal(template.slides.length,1);assert.notEqual(template.slides[0].id,source.slides[0].id);
 assert.equal(template.slides[0].delivery.speakerNotes,'');assert.deepEqual(template.assets,{});
 assert.ok(!JSON.stringify(template).includes('PRIVATE NOTES'));
 assert.ok(!JSON.stringify(template).includes('En idé. En berättelse.'));
 assert.deepEqual(template.theme,source.theme);assert.deepEqual(template.masters,source.masters);
});

test('switching content and columns repeatedly reuses placeholder objects without duplication',()=>{
 const store=new EditorStore();
 store.applyLayout('content');
 const initialIds=store.slide.view.elements.map(e=>e.id);
 store.applyLayout('columns');
 const columns=store.slide.view.elements.map(e=>e.id);
 assert.equal(columns.length,3,'Only the missing right column is created');
 const rightId=store.slide.placeholderBindings.find(binding=>binding.placeholderId==='right').elementId;
 store.editText(rightId,'Innehåll i höger kolumn');
 for(let n=0;n<5;n++){
  store.applyLayout('content');
  assert.equal(store.slide.view.elements.length,3,'No elements added when returning to content');
  store.applyLayout('columns');
  assert.deepEqual(store.slide.view.elements.map(e=>e.id),columns,'Object identities remain stable');
  assert.equal(store.slide.placeholderBindings.find(binding=>binding.placeholderId==='right').elementId,rightId);
  assert.equal(textOf(store.slide,store.slide.view.elements.find(e=>e.id===rightId)),'Innehåll i höger kolumn');
 }
 assert.ok(initialIds.every(id=>columns.includes(id)));
 validateCore(store.getSnapshot().doc);
});

test('switching through all layouts preserves user objects and reuses managed placeholders',()=>{
 const store=new EditorStore();
 const extra=store.add('text');
 store.editText(extra,'Eget fristående objekt');
 const before=store.slide.view.elements.find(e=>e.id===extra).geometry;
 const layouts=['content','columns','image-text','blank','title','content','columns'];
 const seenByLayout=new Map();
 for(let round=0;round<3;round++)for(const name of layouts){
  store.applyLayout(name);
  const current=store.slide.view.elements.map(e=>e.id);
  // The first pass legitimately creates the previously absent right column.
  // After one complete traversal, all subsequent layout changes must reuse it.
  if(round===1)seenByLayout.set(name,new Set(current));
  if(round===2)assert.deepEqual(new Set(current),seenByLayout.get(name),'Unexpected new objects after returning to '+name);
  assert.ok(store.slide.view.elements.some(e=>e.id===extra),'Free-standing object must remain');
  assert.deepEqual(store.slide.view.elements.find(e=>e.id===extra).geometry,before,'Free-standing geometry unchanged');
  assert.ok(!store.slide.placeholderBindings.some(b=>b.elementId===extra),'Free-standing text is never captured');
  validateCore(store.getSnapshot().doc);
 }
 const saved=structuredClone(store.getSnapshot().doc);
 const savedIds=store.slide.view.elements.map(e=>e.id);
 store.load(saved);
 for(const name of ['blank','columns','content','columns'])store.applyLayout(name);
 assert.deepEqual(store.slide.view.elements.map(e=>e.id),savedIds,'Saved placeholder affinity survives reload');
});

test('layout changes preserve undo and redo with original placeholder identities',()=>{
 const store=new EditorStore();
 store.applyLayout('content');
 const baseline=structuredClone(store.getSnapshot().doc);
 store.applyLayout('columns');
 const columns=structuredClone(store.getSnapshot().doc);
 store.applyLayout('content');
 store.undo();
 assert.deepEqual(store.getSnapshot().doc,columns);
 store.undo();
 assert.deepEqual(store.getSnapshot().doc,baseline);
 store.redo();
 assert.deepEqual(store.getSnapshot().doc,columns);
 store.applyLayout('content');
 store.applyLayout('columns');
 assert.deepEqual(store.slide.view.elements.map(e=>e.id),columns.slides[0].view.elements.map(e=>e.id));
});
