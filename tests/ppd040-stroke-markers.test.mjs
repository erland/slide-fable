import {test} from 'node:test';
import assert from 'node:assert/strict';
import {strokeStyle,dashArray} from '../src/core/stroke.ts';
import {endMarkers} from '../src/core/endMarkers.ts';

test('PPD 0.4 outline dash values map into existing renderer/export style family',()=>{
 for(const [dash,expected] of [['solid','solid'],['dash','dashed'],['dot','dotted'],['dash-dot','dashdot']]){
  const el={style:{outline:{dash}},extensions:{slideFableStrokeStyle:'solid'}};
  assert.equal(strokeStyle(el),expected);
 }
 assert.deepEqual(dashArray(strokeStyle({style:{outline:{dash:'dash'}}}),2),[8,4]);
});
test('canonical endpoint markers override legacy extensions and preserve arrow defaults',()=>{
 const el={type:'arrow',style:{outline:{startMarker:'open-arrow',endMarker:'triangle'}},
  extensions:{slideFableEndMarkers:{start:'bar',end:'none'}}};
 assert.deepEqual(endMarkers(el),{start:'openArrow',end:'filledArrow'});
 assert.deepEqual(endMarkers({type:'arrow'}),{start:'none',end:'filledArrow'});
 assert.deepEqual(endMarkers({type:'line',extensions:{slideFableEndMarkers:{end:'diamond'}}}),{start:'none',end:'diamond'});
 assert.deepEqual(endMarkers({type:'line',style:{outline:{endMarker:'oval'}}}),{start:'none',end:'circle'});
});
