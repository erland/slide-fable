import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestPort,portPoint,resolveLinePoints} from '../src/core/connectors.ts';
import {endMarkers,markerGeometry,pptxMarker} from '../src/core/endMarkers.ts';
import {strokeStyle,dashArray} from '../src/core/stroke.ts';

const first={id:'first',geometry:{x:20,y:30,width:120,height:80}};
const second={id:'second',geometry:{x:400,y:100,width:160,height:100}};

test('SF-SH-13: all four ports are deterministic, and nearest-port snapping has an explicit range',()=>{
 assert.deepEqual(['top','right','bottom','left'].map(p=>portPoint(first.geometry,p)),[
  {x:80,y:30},{x:140,y:70},{x:80,y:110},{x:20,y:70}
 ]);
 assert.deepEqual(nearestPort({x:142,y:72},[first,second]),{elementId:'first',port:'right'});
 assert.equal(nearestPort({x:250,y:250},[first,second]),undefined);
 assert.deepEqual(nearestPort({x:480,y:102},[first,second]),{elementId:'second',port:'top'});
});

test('SF-SH-13: connected endpoints track changes of geometry, and detached ends retain their stored coordinates',()=>{
 const line={geometry:{x:100,y:100,width:300,height:20},
  extensions:{slideFableLinePoints:{start:{x:4,y:5},end:{x:280,y:10}}},
  startAnchor:{elementId:'first',port:'right'},endAnchor:{elementId:'second',port:'left'}};
 assert.deepEqual(resolveLinePoints(line,[first,second]),{start:{x:140,y:70},end:{x:400,y:150}});
 const moved={...first,geometry:{...first.geometry,x:first.geometry.x+50,y:first.geometry.y+30}};
 assert.deepEqual(resolveLinePoints(line,[moved,second]).start,{x:190,y:100});
 assert.deepEqual(resolveLinePoints({...line,startAnchor:undefined},[moved,second]).start,{x:104,y:105});
 assert.deepEqual(resolveLinePoints(line,[first]).end,{x:380,y:110},'Missing target gracefully falls back to stored end');
});

test('SF-SH-13: marker defaults and independent markers survive different line types',()=>{
 assert.deepEqual(endMarkers({type:'arrow'}),{start:'none',end:'filledArrow'});
 assert.deepEqual(endMarkers({type:'line'}),{start:'none',end:'none'});
 const e={type:'arrow',extensions:{slideFableEndMarkers:{start:'circle',end:'openArrow'}}};
 assert.deepEqual(endMarkers(e),{start:'circle',end:'openArrow'});
 assert.equal(pptxMarker('circle'),'oval');
 assert.equal(pptxMarker('diamond'),'diamond');
 assert.ok(markerGeometry('diamond',{x:100,y:40},{x:200,y:40})?.kind==='diamond');
 assert.equal(markerGeometry('none',{x:0,y:0},{x:20,y:0}),null);
});

test('SF-SH-13: solid and patterned lines retain backwards-compatible defaults',()=>{
 assert.equal(strokeStyle({}),'solid');
 assert.deepEqual(dashArray('solid',3),[]);
 assert.deepEqual(dashArray('dashed',3),[12,6]);
 assert.deepEqual(dashArray('dashdot',2),[8,4,2,4]);
 assert.equal(strokeStyle({extensions:{slideFableStrokeStyle:'dotted'}}),'dotted');
});
