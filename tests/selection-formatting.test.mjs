import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {effective,textOf} from '../src/core/model.ts';
import {formatValues,sharedFormat} from '../src/core/selectionFormatting.ts';
import {readOutline} from '../src/core/outline.ts';

test('selection format preserves unrelated properties and skips locked/unsupported/unselected objects',()=>{
 const store=new EditorStore(),a=store.add('shape'),b=store.add('shape'),locked=store.add('shape'),line=store.add('line'),other=store.add('shape');
 store.updateElement(locked,{locked:true});
 const before=structuredClone(store.slide.view.elements);
 store.select([a,b,locked,line]);const undo=store.getSnapshot().undo;
 store.formatSelected({key:'fill',value:'#ff0000'});
 for(const id of [a,b]){
  const e=store.slide.view.elements.find(e=>e.id===id),old=before.find(e=>e.id===id);
  assert.equal(e.style.fill.color,'#ff0000');
  assert.deepEqual(e.geometry,old.geometry);
  assert.deepEqual(readOutline(e.style),readOutline(old.style));
 }
 for(const id of [locked,line,other])assert.deepEqual(store.slide.view.elements.find(e=>e.id===id),before.find(e=>e.id===id));
 assert.equal(store.getSnapshot().undo,undo+1);
 store.undo();assert.deepEqual(store.slide.view.elements,before);
 store.redo();assert.equal(store.slide.view.elements.find(e=>e.id===a).style.fill.color,'#ff0000');
});

test('mixed values include explicit rich text runs and formatting updates every selected run',()=>{
 const store=new EditorStore(),a=store.add('text'),b=store.add('shape');
 store.editText(a,{paragraphs:[{id:'format-p',runs:[{text:'A',size:24,marks:{bold:true}},{text:'B',size:30,link:'https://example.com'}]}]});
 store.select([a,b]);
 assert.equal(sharedFormat(formatValues(store.getSnapshot().doc,store.slide,[a,b],'fontSize')),undefined);
 const before=structuredClone(textOf(store.slide,store.slide.view.elements.find(e=>e.id===a)));
 store.formatSelected({key:'fontSize',value:48});
 assert.equal(sharedFormat(formatValues(store.getSnapshot().doc,store.slide,[a,b],'fontSize')),48);
 const runs=textOf(store.slide,store.slide.view.elements.find(e=>e.id===a)).paragraphs[0].runs;
 assert.deepEqual(runs.map(r=>r.size),[48,48]);assert.deepEqual(runs[0].marks,{bold:true});assert.equal(runs[1].link,'https://example.com');
 store.undo();assert.deepEqual(textOf(store.slide,store.slide.view.elements.find(e=>e.id===a)),before);
});

test('layout-bound style overrides survive reset-free persistence roundtrip',()=>{
 const store=new EditorStore(),ids=store.slide.view.elements.slice(0,2).map(e=>e.id);
 store.select(ids);store.formatSelected({key:'color',value:'#123456'});
 for(const e of store.slide.view.elements.filter(e=>ids.includes(e.id)))assert.equal(effective(store.getSnapshot().doc,store.slide,e).style.color,'#123456');
 const doc=JSON.parse(JSON.stringify(store.getSnapshot().doc)),reopened=new EditorStore(doc);
 for(const e of reopened.slide.view.elements.filter(e=>ids.includes(e.id)))assert.equal(effective(doc,reopened.slide,e).style.color,'#123456');
});

test('outline formatting supports lines while text formatting does not',()=>{
 const store=new EditorStore(),line=store.add('line');store.select([line]);
 const before=store.getSnapshot();
 store.formatSelected({key:'fontSize',value:40});assert.equal(store.getSnapshot(),before);
 store.formatSelected({key:'outlineColor',value:'#abcdef'});
 assert.equal(readOutline(store.slide.view.elements.find(e=>e.id===line).style).paint.color,'#abcdef');
 store.formatSelected({key:'outlineWidth',value:7});
 assert.equal(readOutline(store.slide.view.elements.find(e=>e.id===line).style).width,7);
});

test('invalid values and read-only changes are atomic',()=>{
 const store=new EditorStore(),id=store.add('shape');store.select([id]);
 const before=store.getSnapshot();
 for(const change of [{key:'fontSize',value:NaN},{key:'fontSize',value:0},{key:'outlineWidth',value:-1},{key:'fill',value:'url(unsafe)'}])assert.throws(()=>store.formatSelected(change),/INVALID_FORMAT/);
 assert.equal(store.getSnapshot(),before);
 store.load(before.doc,true);store.select([id]);
 assert.throws(()=>store.formatSelected({key:'fill',value:'#123456'}),/READ_ONLY/);
});

test('formatting shared content does not alter a locked instance',()=>{
 const store=new EditorStore(),[a,b]=store.slide.view.elements;
 store.updateElement(b.id,{contentRef:a.contentRef,locked:true});
 const before=structuredClone(textOf(store.slide,store.slide.view.elements.find(e=>e.id===b.id)));
 store.select([a.id,b.id]);store.formatSelected({key:'color',value:'#aabbcc'});
 const after=store.slide.view.elements;
 assert.deepEqual(textOf(store.slide,after.find(e=>e.id===b.id)),before);
 assert.notEqual(after.find(e=>e.id===a.id).contentRef,after.find(e=>e.id===b.id).contentRef);
});
