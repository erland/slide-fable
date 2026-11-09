import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isPolygonShape,polygonShapes,shapePolygonPoints} from '../src/core/shapeGeometry.ts';

test('SF-GAP-03 flowchart polygons have valid normalized geometry',()=>{
 assert.deepEqual(Object.keys(polygonShapes),['diamond','hexagon','pentagon','chevron']);
 for(const name of Object.keys(polygonShapes)){
  assert.equal(isPolygonShape(name),true);
  const parts=shapePolygonPoints(name,480,240).split(' ');
  assert.ok(parts.length>=4,name+' has enough vertices');
  for(const part of parts){
   const [x,y]=part.split(',').map(Number);
   assert.ok(Number.isFinite(x)&&x>=0&&x<=480,name+' x');
   assert.ok(Number.isFinite(y)&&y>=0&&y<=240,name+' y');
  }
 }
 assert.equal(isPolygonShape('triangle'),false);
 assert.equal(isPolygonShape('__proto__'),false);
 assert.equal(shapePolygonPoints('diamond',100,100),'50.000,0.000 100.000,50.000 50.000,100.000 0.000,50.000');
});
