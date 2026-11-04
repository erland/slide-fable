import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findTextFitScale} from '../src/editor/textFit.ts';

test('leaves text untouched when it already fits',()=>{
 assert.equal(findTextFitScale(scale=>scale<=1),1);
});
test('finds the largest fitting scale within tolerance',()=>{
 const scale=findTextFitScale(s=>s<=.72);
 assert.ok(scale<=.72&&scale>=.718);
});
test('never shrinks below the configured minimum',()=>{
 assert.equal(findTextFitScale(s=>s<=.1,.5),.5);
});
test('rejects invalid minimum scale values',()=>{
 for(const n of [0,-1,1.1,Number.NaN])assert.throws(()=>findTextFitScale(()=>true,n),/INVALID_MIN_TEXT_SCALE/);
});
