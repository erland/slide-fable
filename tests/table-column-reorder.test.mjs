import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveTableColumn} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',text:'A',header:true},{id:'b',text:'B'},{id:'c',text:'C'}],
 [{id:'d',text:'D'},{id:'e',text:'E'},{id:'f',text:'F'}]
];

test('swap adjacent columns in every row and keep matching widths',()=>{
 const source=grid(),original=structuredClone(source);
 const moved=moveTableColumn(source,1,-1,[100,200,300]);
 assert.deepEqual(moved?.cells.map(row=>row.map(cell=>cell.id)),[['b','a','c'],['e','d','f']]);
 assert.deepEqual(moved?.columnWidths,[200,100,300]);
 assert.deepEqual(moved?.cells[0][1],original[0][0]);
 assert.deepEqual(source,original);
 assert.deepEqual(moveTableColumn(moved.cells,0,1,moved.columnWidths),{cells:original,columnWidths:[100,200,300]});
});

test('moving columns without explicit widths keeps widths absent',()=>{
 const moved=moveTableColumn(grid(),1,1);
 assert.deepEqual(moved?.cells.map(row=>row.map(cell=>cell.text)),[['A','C','B'],['D','F','E']]);
 assert.equal(Object.hasOwn(moved,'columnWidths'),false);
});

test('unrelated merged cells are preserved, but crossing a merge is blocked',()=>{
 const source=[
  [{id:'a',colSpan:2,text:'merged'},{id:'c'},{id:'d'}],
  [{id:'e'},{id:'f'},{id:'g'},{id:'h'}]
 ];
 assert.deepEqual(moveTableColumn(source,2,1)?.cells[0].map(cell=>cell.id),['a','d','c']);
 assert.deepEqual(moveTableColumn(source,2,1)?.cells[1].map(cell=>cell.id),['e','f','h','g']);
 assert.equal(moveTableColumn(source,1,1),null);
 assert.equal(moveTableColumn(source,0,1),null);
 assert.deepEqual(source[0][0],{id:'a',colSpan:2,text:'merged'});
});

test('bad grids, widths and out-of-range moves fail without mutation',()=>{
 const source=grid(),before=structuredClone(source);
 for(const [index,direction,widths] of [[0,-1],[2,1],[-1,1],[3,-1],[1,0],[1,2],[0.5,1],[0,1,[1,2]],[0,1,[1,0,3]]]){
  assert.equal(moveTableColumn(source,index,direction,widths),null);
 }
 assert.deepEqual(source,before);
 for(const bad of [
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a'},{id:'b'}],[{id:'c'}]],
  [[{id:'a'}],[{id:'a'}]]
 ]){
  const original=structuredClone(bad);
  assert.equal(moveTableColumn(bad,0,1),null);
  assert.deepEqual(bad,original);
 }
});
