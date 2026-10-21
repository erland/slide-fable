import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPpd040,readPpd040Json,writePpd040Json} from '../src/core/ppd040Document.ts';

test('PPD 0.4 JSON documents can be generated, written and read without format downgrade',()=>{
 const original=createPpd040();
 assert.equal(original.schemaVersion,'0.4.0');
 const json=writePpd040Json(original);
 const restored=readPpd040Json(json);
 assert.deepEqual(restored,original);
 assert.notEqual(restored,original);
});
test('PPD 0.4 JSON reader rejects incorrect versions and invalid strokes',()=>{
 const doc=createPpd040();
 assert.throws(()=>readPpd040Json(JSON.stringify({...doc,schemaVersion:'0.3.1'})),e=>e.code==='PPD_040_VERSION');
 doc.slides[0].view.elements.push({id:'bad-outline',type:'shape',style:{outline:{paint:{color:'#123456'},width:-1}}});
 assert.throws(()=>writePpd040Json(doc),e=>e.code==='PPD_040_INVALID');
 assert.throws(()=>readPpd040Json(JSON.stringify(doc)),e=>e.code==='PPD_040_INVALID');
});
test('PPD 0.4 reader retains supported animation metadata through roundtrip',()=>{
 const doc=createPpd040();
 doc.slides[0].view.elements.push({id:'text-animated',type:'text',text:'Hej'});
 doc.slides[0].animations=[{id:'animation-test',targetId:'text-animated',trigger:'on-click',effect:'fade',durationMs:300}];
 const restored=readPpd040Json(writePpd040Json(doc));
 assert.deepEqual(restored.slides[0].animations,doc.slides[0].animations);
});
