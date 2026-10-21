import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ppd040StandardGate} from '../src/core/ppd040Gate.ts';

test('PPD 0.4 readiness gate reports unresolved default-version blockers explicitly',()=>{
 const report=ppd040StandardGate();
 const byId=Object.fromEntries(report.checks.map(c=>[c.id,c]));
 assert.equal(byId['040-document-roundtrip'].passed,true);
 assert.equal(byId['040-editor-core'].passed,true);
 assert.equal(byId['040-version-negotiation'].passed,true);
 assert.equal(byId['standard-document-version'].passed,false);
 assert.equal(byId['canonical-schema-source'].passed,false);
 assert.equal(report.ready,false,'never report default format ready while blockers remain');
});
