import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {createPpd040,readPpd040Json,writePpd040Json} from '../src/core/ppd040Document.ts';
import {inspectPpd040} from '../src/core/ppd040Preflight.ts';
import {readOutline} from '../src/core/outline.ts';
import {strokeStyle} from '../src/core/stroke.ts';
import {endMarkers} from '../src/core/endMarkers.ts';
import {preflight} from '../src/export/plan.ts';

test('PPD 0.4: create, edit, undo/redo, save, reopen, and plan exports',()=>{
 const store=new EditorStore(createPpd040());
 const shape=store.add('shape'),arrow=store.add('arrow');
 store.updateElement(shape,{style:{fill:{color:'#ffeecc'},outline:{paint:{color:'#123456'},width:4,dash:'dash'}}});
 store.updateElement(arrow,{style:{outline:{paint:{color:'#334455'},width:5,endMarker:'triangle'}}});
 const snapshot=store.getSnapshot().doc;
 assert.equal(inspectPpd040(snapshot).ready,true);
 assert.equal(strokeStyle(snapshot.slides[0].view.elements.find(e=>e.id===shape)),'dashed');
 assert.equal(endMarkers(snapshot.slides[0].view.elements.find(e=>e.id===arrow)).end,'filledArrow');
 assert.equal(readOutline(snapshot.slides[0].view.elements.find(e=>e.id===shape).style).width,4);
 store.undo();store.redo();
 const json=writePpd040Json(store.getSnapshot().doc);
 const reopened=readPpd040Json(json);
 assert.deepEqual(reopened,store.getSnapshot().doc);
 const clone=new EditorStore(reopened);
 assert.equal(inspectPpd040(clone.getSnapshot().doc).ready,true);
 for(const format of ['pdf','pptx']){
  const report=preflight(reopened,format);
  assert.equal(report.format,format);
  assert.ok(report.objects.some(e=>e.elementId===shape));
  assert.ok(report.objects.some(e=>e.elementId===arrow));
 }
});
test('PPD 0.4: invalid cross-references fail without damaging a saved document',()=>{
 const original=createPpd040();
 const json=writePpd040Json(original);
 const store=new EditorStore(original);
 assert.throws(()=>store.transaction(d=>{
  d.slides[0].animations=[{id:'invalid-anim',targetId:'absent',trigger:'on-click',effect:'fade',durationMs:100}];
 }),/PPD_040_INVALID/);
 assert.equal(writePpd040Json(store.getSnapshot().doc),json);
});
