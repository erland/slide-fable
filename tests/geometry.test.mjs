import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lineBounds,moveEndpoint,resizeDirections,resizeRect} from '../src/core/geometry.ts';
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
