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
