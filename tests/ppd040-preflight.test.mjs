import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDocument,box} from '../src/core/model.ts';
import {inspectPpd040} from '../src/core/ppd040Preflight.ts';

test('PPD 0.4 preflight stages a document without modifying its active 0.3.1 source',()=>{
 const source=createDocument(),before=JSON.stringify(source);
 source.slides[0].view.elements.push({id:'stroke-probe',type:'shape',geometry:box(),shapeType:'rect',
  style:{stroke:{color:'#234567'},strokeWidth:4}});
 const snapshot=JSON.stringify(source);
 const report=inspectPpd040(source);
 assert.equal(report.ready,true,JSON.stringify(report.issues));
 assert.equal(report.document.schemaVersion,'0.4.0');
 assert.equal(report.document.slides[0].view.elements.at(-1).style.outline.width,4);
 assert.equal(JSON.stringify(source),snapshot);
 assert.notEqual(before,snapshot);
});
test('preflight diagnoses incompatible versions and 0.4 schema failures',()=>{
 const badVersion=createDocument();badVersion.schemaVersion='9.0.0';
 const unsupported=inspectPpd040(badVersion);
 assert.equal(unsupported.ready,false);
 assert.equal(unsupported.issues[0].code,'UNSUPPORTED_VERSION');
 const badOutline=createDocument();badOutline.schemaVersion='0.4.0';
 badOutline.slides[0].view.elements[0].style={outline:{width:-4,paint:{color:'#112233'}}};
 const report=inspectPpd040(badOutline);
 assert.equal(report.ready,false);
 assert.ok(report.issues.some(i=>i.code==='SCHEMA_040'));
});
test('preflight rejects animations targeting absent objects',()=>{
 const doc=createDocument();
 doc.schemaVersion='0.4.0';
 doc.slides[0].animations=[{id:'anim-1',targetId:'missing-object',trigger:'on-click',effect:'fade',durationMs:200}];
 const report=inspectPpd040(doc);
 assert.equal(report.ready,false);
 assert.ok(report.issues.some(i=>i.code==='ANIMATION_TARGET_MISSING'));
});
