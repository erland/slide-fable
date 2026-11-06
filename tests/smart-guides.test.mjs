import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapTranslation,snapResize,equalSpacingGuide} from '../src/core/smartGuides.ts';
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

test('resizing east and south snaps active edges to other objects without moving opposite edges',()=>{
 const r=snapResize(moving,'se',[neighbor],117,38);
 assert.deepEqual(r.rect,{x:100,y:100,width:200,height:80});
 assert.deepEqual(r.guides,{x:300,y:180});
});
test('northwest resizing keeps right and bottom fixed and snaps only the dragged edges',()=>{
 const moving={x:250,y:250,width:120,height:100};
 const peer={x:200,y:180,width:100,height:60};
 const r=snapResize(moving,'nw',[peer],-48,-8);
 assert.deepEqual(r.rect,{x:200,y:240,width:170,height:110});
 assert.deepEqual(r.guides,{x:200,y:240});
});
test('resize uses the existing delta grid when no object guide is close',()=>{
 const r=snapResize(moving,'e',[neighbor],53,21);
 assert.deepEqual(r.rect,{x:100,y:100,width:130,height:40});
 assert.deepEqual(r.guides,{});
});
test('resize Alt and disabled grid leave freehand sizes',()=>{
 for(const [enabled,bypass] of [[false,false],[true,true]]){
  const r=snapResize(moving,'se',[neighbor],117,38,enabled,bypass);
  assert.deepEqual(r.rect,{x:100,y:100,width:197,height:78});
  assert.deepEqual(r.guides,{});
 }
});
test('resize respects minimum size and does not show a guide when the edge is clamped',()=>{
 const peer={x:180,y:100,width:10,height:40};
 const r=snapResize(moving,'w',[peer],78,0);
 assert.deepEqual(r.rect,{x:170,y:100,width:10,height:40});
 assert.deepEqual(r.guides,{});
});
test('resize preserves inactive dimension and rejects invalid measurements',()=>{
 const r=snapResize(moving,'n',[neighbor],51,29);
 assert.equal(r.rect.width,moving.width);assert.equal(r.rect.x,moving.x);
 assert.throws(()=>snapResize(moving,'e',[neighbor],Infinity,0),/INVALID_ALIGNMENT_GEOMETRY/);
});

test('snaps between left and right peers with equal horizontal gaps',()=>{
 const left={x:20,y:90,width:50,height:70},right={x:260,y:95,width:50,height:80};
 const result=snapTranslation(moving,[left,right],22,0);
 assert.equal(result.dx,25);
 assert.equal(result.guides.spacingX?.gap,55);
 assert.deepEqual(result.guides.spacingX?.first,{from:70,to:125});
 assert.deepEqual(result.guides.spacingX?.second,{from:205,to:260});
});
test('snaps to equal vertical gaps while retaining original object size',()=>{
 const above={x:90,y:20,width:110,height:60},below={x:95,y:240,width:120,height:40};
 const result=snapTranslation(moving,[above,below],0,38);
 assert.equal(result.dy,40);
 assert.equal(result.guides.spacingY?.gap,60);
 assert.deepEqual(result.guides.spacingY?.first,{from:80,to:140});
 assert.deepEqual(result.guides.spacingY?.second,{from:180,to:240});
});
test('does not use non-overlapping neighbors or one-sided gaps',()=>{
 const left={x:20,y:500,width:50,height:70},right={x:260,y:90,width:50,height:70};
 const onlyOne=snapTranslation(moving,[left,right],22,0);
 assert.equal(onlyOne.guides.spacingX,undefined);
 assert.equal(onlyOne.dx,20);
 assert.equal(equalSpacingGuide(moving,[right],'x',22,0),null);
});
test('existing edge alignment takes priority over equal-distance snapping',()=>{
 const left={x:20,y:90,width:50,height:70},right={x:260,y:95,width:50,height:80};
 const result=snapTranslation(moving,[left,right,{x:122,y:90,width:20,height:70}],22,0);
 assert.equal(result.dx,22);
 assert.equal(result.guides.x,122);
 assert.equal(result.guides.spacingX,undefined);
});
test('spacing is bypassed by Alt or disabling snapping, and does not affect resize',()=>{
 const left={x:20,y:90,width:50,height:70},right={x:260,y:95,width:50,height:80};
 for(const [enabled,bypass] of [[false,false],[true,true]]){
  const result=snapTranslation(moving,[left,right],22,0,enabled,bypass);
  assert.equal(result.dx,22);
  assert.deepEqual(result.guides,{});
 }
 const resized=snapResize(moving,'e',[left,right],22,0);
 assert.equal(resized.guides.spacingX,undefined);
});


test('slide center and slide margins snap with visible guides even without peers',()=>{
 const canvas={width:1280,height:720};
 const centered=snapTranslation({x:430,y:210,width:200,height:100},[],108,99,true,false,7,10,canvas);
 assert.equal(centered.dx,110);assert.equal(centered.dy,100);
 assert.equal(centered.guides.x,640);assert.equal(centered.guides.y,360);
 const margins=snapTranslation({x:30,y:20,width:200,height:100},[],-27,-18,true,false,7,10,canvas);
 assert.equal(margins.dx,-30);assert.equal(margins.dy,-20);
 assert.equal(margins.guides.x,0);assert.equal(margins.guides.y,0);
});
test('slide edge snapping works when resizing while fixed opposite edge stays put',()=>{
 const canvas={width:1280,height:720};
 const r=snapResize({x:800,y:350,width:300,height:250},'se',[],177,118,true,false,7,10,canvas);
 assert.equal(r.rect.x,800);assert.equal(r.rect.y,350);
 assert.equal(r.rect.width,480);assert.equal(r.rect.height,370);
 assert.deepEqual(r.guides,{x:1280,y:720});
});
test('Alt bypasses slide guides and slide size is validated',()=>{
 const canvas={width:1280,height:720};
 const free=snapTranslation({x:30,y:20,width:200,height:100},[],-27,-18,true,true,7,10,canvas);
 assert.deepEqual(free,{dx:-27,dy:-18,guides:{}});
 assert.throws(()=>snapTranslation(moving,[],0,0,true,false,7,10,{width:0,height:720}),/INVALID_ALIGNMENT_GEOMETRY/);
 assert.throws(()=>snapResize(moving,'e',[],0,0,true,false,7,10,{width:1280,height:NaN}),/INVALID_ALIGNMENT_GEOMETRY/);
});
