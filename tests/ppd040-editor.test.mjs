import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {createPpd040} from '../src/core/ppd040Document.ts';
import {inspectPpd040} from '../src/core/ppd040Preflight.ts';

test('PPD 0.4 editor creates and changes elements without legacy stroke fields',()=>{
 const store=new EditorStore(createPpd040());
 const shapeId=store.add('shape');
 const lineId=store.add('line');
 const elements=store.getSnapshot().doc.slides[0].view.elements;
 const shape=elements.find(e=>e.id===shapeId);
 const line=elements.find(e=>e.id===lineId);
 assert.equal(shape.style.outline.width,2);
 assert.equal(line.style.outline.width,5);
 assert.equal('strokeWidth' in shape.style,false);
 assert.equal('stroke' in line.style,false);
 assert.equal(inspectPpd040(store.getSnapshot().doc).ready,true);
 store.updateElement(shapeId,{style:{fill:{color:'#ffffff'},stroke:{color:'#123456'},strokeWidth:6}});
 const updated=store.getSnapshot().doc.slides[0].view.elements.find(e=>e.id===shapeId);
 assert.equal(updated.style.outline.paint.color,'#123456');
 assert.equal(updated.style.outline.width,6);
 assert.equal('stroke' in updated.style,false);
 assert.equal(inspectPpd040(store.getSnapshot().doc).ready,true);
 store.undo();
 assert.equal(store.getSnapshot().doc.slides[0].view.elements.find(e=>e.id===shapeId).style.outline.width,2);
 store.redo();
 assert.equal(store.getSnapshot().doc.slides[0].view.elements.find(e=>e.id===shapeId).style.outline.width,6);
});
test('PPD 0.4 rejects invalid edits atomically',()=>{
 const store=new EditorStore(createPpd040());
 const before=JSON.stringify(store.getSnapshot().doc);
 assert.throws(()=>store.transaction(d=>{d.slides[0].animations=[{id:'a1',targetId:'missing',trigger:'on-click',effect:'fade',durationMs:10}]}),/PPD_040_INVALID/);
 assert.equal(JSON.stringify(store.getSnapshot().doc),before);
});
