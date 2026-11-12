import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lineBounds,moveEndpoint,resizeDirections,resizeRect,resizeRectKeepAspect} from '../src/core/geometry.ts';
const rect={x:100,y:200,width:120,height:80};
test('all eight resize handles change only their respective edges',()=>{
 const expected={
  nw:{x:90,y:185,width:130,height:95},n:{x:100,y:185,width:120,height:95},ne:{x:100,y:185,width:130,height:95},
  e:{x:100,y:200,width:130,height:80},se:{x:100,y:200,width:130,height:95},s:{x:100,y:200,width:120,height:95},
  sw:{x:90,y:200,width:130,height:95},w:{x:90,y:200,width:130,height:80}
 };
 for(const direction of resizeDirections)assert.deepEqual(resizeRect(rect,direction,direction.includes('w')?-10:10,direction.includes('n')?-15:15),expected[direction],direction);
});
test('resize clamps at minimum dimensions without moving the opposite edge',()=>{
 assert.deepEqual(resizeRect(rect,'nw',1000,1000),{x:210,y:270,width:10,height:10});
 assert.deepEqual(resizeRect(rect,'se',-1000,-1000),{x:100,y:200,width:10,height:10});
 assert.deepEqual(resizeRect(rect,'n',0,25),{x:100,y:225,width:120,height:55});
 assert.throws(()=>resizeRect(rect,'e',Infinity,0));
});
test('line endpoint movement preserves the other endpoint, including diagonal and vertical lines',()=>{
 const start={x:10,y:20},end={x:110,y:20};
 const diagonal=moveEndpoint(start,end,'end',-35,80);
 assert.deepEqual(diagonal,{start,end:{x:75,y:100}});
 assert.deepEqual(lineBounds(diagonal.start,diagonal.end),{x:10,y:20,width:65,height:80});
 const vertical=moveEndpoint(start,end,'end',-100,70);
 assert.deepEqual(vertical.end,{x:10,y:90});
 assert.deepEqual(lineBounds(vertical.start,vertical.end),{x:10,y:20,width:1,height:70});
 assert.deepEqual(moveEndpoint(start,end,'start',20,-10).end,end);
});

test('Shift keeps aspect ratio for every corner while anchoring the opposite corner',()=>{
 for(const direction of ['nw','ne','se','sw']){
  const dx=direction.includes('w')?-36:36,dy=direction.includes('n')?-15:15;
  const changed=resizeRectKeepAspect(rect,direction,dx,dy);
  assert.ok(Math.abs(changed.width/changed.height-rect.width/rect.height)<1e-10,direction);
  if(direction.includes('w'))assert.equal(changed.x+changed.width,rect.x+rect.width);
  else assert.equal(changed.x,rect.x);
  if(direction.includes('n'))assert.equal(changed.y+changed.height,rect.y+rect.height);
  else assert.equal(changed.y,rect.y);
  assert.ok(changed.width>rect.width&&changed.height>rect.height);
 }
});
test('Shift on side handles anchors the opposite side and centers perpendicular resizing',()=>{
 const east=resizeRectKeepAspect(rect,'e',60,1000);
 assert.deepEqual(east,{x:100,y:180,width:180,height:120});
 const north=resizeRectKeepAspect(rect,'n',1000,-20);
 assert.deepEqual(north,{x:85,y:180,width:150,height:100});
 const west=resizeRectKeepAspect(rect,'w',-60,0);
 assert.deepEqual(west,{x:40,y:180,width:180,height:120});
 const south=resizeRectKeepAspect(rect,'s',0,40);
 assert.deepEqual(south,{x:70,y:200,width:180,height:120});
});
test('Shift resizing clamps both dimensions and rejects invalid geometry',()=>{
 const small=resizeRectKeepAspect(rect,'se',-10000,-10000);
 assert.ok(small.width>=10&&small.height>=10);
 assert.ok(Math.abs(small.width/small.height-1.5)<1e-10);
 assert.throws(()=>resizeRectKeepAspect(rect,'se',NaN,0));
 assert.throws(()=>resizeRectKeepAspect({...rect,width:0},'e',20,0));
});
