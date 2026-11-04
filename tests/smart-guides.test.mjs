import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapTranslation} from '../src/core/smartGuides.ts';
const moving={x:100,y:100,width:80,height:40};
const neighbor={x:300,y:180,width:100,height:60};
test('snaps left edge to a neighboring right edge with a visible vertical guide',()=>{
 const r=snapTranslation(moving,[neighbor],198,29,true,false,7);
 assert.equal(r.dx,200);assert.equal(r.guides.x,300);
});
test('snaps centers along both axes and uses matching object coordinates',()=>{
 const r=snapTranslation(moving,[neighbor],210,90,true,false,7);
 assert.equal(r.dx,210);assert.equal(r.dy,90);
 assert.equal(r.guides.x,350);assert.equal(r.guides.y,210);
});
test('grid snapping remains fallback and guides disappear when no object is close',()=>{
 const r=snapTranslation(moving,[neighbor],54,26,true,false,5);
 assert.equal(r.dx,50);assert.equal(r.dy,30);
 assert.deepEqual(r.guides,{});
});
test('Alt bypasses guides and grid, and toggle disables both',()=>{
 for(const [enabled,bypass] of [[false,false],[true,true]]){
  const r=snapTranslation(moving,[neighbor],198,29,enabled,bypass);
  assert.deepEqual(r,{dx:198,dy:29,guides:{}});
 }
});
test('no cross-axis snap and multiple selection preserves rigid spacing through shared translation',()=>{
 const r=snapTranslation(moving,[neighbor],198,56,true,false,7);
 assert.equal(r.dx,200);
 assert.equal(r.dy,60);
 const second={x:470,y:420,width:80,height:40};
 assert.equal(second.x+r.dx-moving.x-r.dx,second.x-moving.x);
});
test('rejects nonfinite geometry',()=>assert.throws(()=>snapTranslation(moving,[],NaN,0),/INVALID_ALIGNMENT_GEOMETRY/));
