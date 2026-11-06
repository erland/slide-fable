import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument} from '../src/core/model.ts';
import {saveAsDocument} from '../src/core/documentFileActions.ts';
test('Spara som creates an independent, named document without modifying the active presentation',()=>{
 const original=createDocument(),snapshot=structuredClone(original);
 const saved=saveAsDocument(original,'  Min nya   presentation ');
 assert.equal(saved.document.title,'Min nya presentation');
 assert.notEqual(saved.document.id,original.document.id);
 assert.equal(saved.slides[0]?.id,original.slides[0]?.id);
 assert.deepEqual(original,snapshot);
 saved.theme.colors.accent='#000000';
 assert.deepEqual(original,snapshot);
});
test('Spara som rejects empty, control-character and oversized titles',()=>{
 const doc=createDocument();
 for(const title of ['   ','x'.repeat(121),'fel\nnamn'])assert.throws(()=>saveAsDocument(doc,title));
});
