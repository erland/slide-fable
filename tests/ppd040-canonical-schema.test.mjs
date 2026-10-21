import {test} from 'node:test';
import assert from 'node:assert/strict';
import canonical from '../schemas/ppd.schema.json' with {type:'json'};
import {createDocument} from '../src/core/model.ts';
import {inspectPpd040} from '../src/core/ppd040Preflight.ts';
import {createPpd040,writePpd040Json,readPpd040Json} from '../src/core/ppd040Document.ts';
import {validateCore} from '../src/core/contract.ts';

test('PPD 0.4 preflight and runtime validation use the same canonical schema',()=>{
 assert.equal(canonical.properties.schemaVersion.const,'0.4.0');
 const doc=createDocument();
 assert.equal(inspectPpd040(doc).ready,true);
 assert.doesNotThrow(()=>validateCore(doc));
 const invalid=structuredClone(doc);
 invalid.slides[0].view.elements.push({
  id:'legacy-contour',type:'shape',
  geometry:{x:10,y:10,width:50,height:50},
  style:{strokeWidth:3}
 });
 assert.equal(inspectPpd040(invalid).ready,false);
 assert.throws(()=>validateCore(invalid));
});
test('Explicit PPD 0.4 JSON API roundtrips the active default document',()=>{
 const doc=createPpd040();
 const json=writePpd040Json(doc);
 assert.deepEqual(readPpd040Json(json),doc);
 assert.equal(inspectPpd040(doc).ready,true);
});
