import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPpd040,writePpd040Json} from '../src/core/ppd040Document.ts';
import {createDocument} from '../src/core/model.ts';
import {validateCore,validateFull,importDocument,negotiate} from '../src/core/contract.ts';

test('shared validation and ordinary import accept an explicit PPD 0.4 document',async()=>{
 const doc=createPpd040();
 assert.doesNotThrow(()=>validateCore(doc));
 await assert.doesNotReject(()=>validateFull(doc));
 assert.equal(negotiate(doc).mode,'editable_candidate');
 const opened=await importDocument(writePpd040Json(doc));
 assert.equal(opened.readOnly,false);
 assert.equal(opened.doc.schemaVersion,'0.4.0');
 assert.deepEqual(opened.doc,doc);
});
test('shared validation still accepts PPD 0.3.1 and rejects invalid 0.4',async()=>{
 const legacy=createDocument();
 assert.doesNotThrow(()=>validateCore(legacy));
 const malformed=createPpd040();
 malformed.slides[0].animations=[{id:'bad-animation',targetId:'not-an-object',trigger:'on-click',effect:'fade',durationMs:100}];
 assert.throws(()=>validateCore(malformed),e=>e.code==='SCHEMA_040');
 await assert.rejects(()=>importDocument(JSON.stringify(malformed)),e=>e.code==='SCHEMA_040');
});
