import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pptxDiagramLine} from '../src/export/diagramLine.ts';

test('SF-NEXT-04: diagram edges remain positive-size PPTX lines in every direction',()=>{
 const cases=[
  [{x:10,y:20},{x:70,y:90},false,false],
  [{x:70,y:90},{x:10,y:20},true,true],
  [{x:70,y:20},{x:10,y:90},true,false],
  [{x:10,y:90},{x:70,y:20},false,true],
  [{x:50,y:20},{x:50,y:90},false,false],
  [{x:50,y:90},{x:50,y:20},false,true],
  [{x:10,y:50},{x:70,y:50},false,false],
  [{x:70,y:50},{x:10,y:50},true,false],
 ];
 for(const [start,end,flipH,flipV] of cases){
  const line=pptxDiagramLine(start,end,10);
  assert.ok(line.w>=0&&line.h>=0);
  assert.equal(line.flipH,flipH);
  assert.equal(line.flipV,flipV);
  assert.equal(line.x,Math.min(start.x,end.x)/10);
  assert.equal(line.y,Math.min(start.y,end.y)/10);
  assert.equal(line.w,Math.abs(end.x-start.x)/10);
  assert.equal(line.h,Math.abs(end.y-start.y)/10);
 }
});
test('SF-NEXT-04: reject invalid geometry before creating PPTX shape',()=>{
 assert.throws(()=>pptxDiagramLine({x:NaN,y:1},{x:2,y:3},10));
 assert.throws(()=>pptxDiagramLine({x:1,y:1},{x:2,y:3},0));
});
