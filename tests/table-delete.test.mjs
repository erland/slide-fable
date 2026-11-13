import {test} from 'node:test';
import assert from 'node:assert/strict';
import {removeTableRow,removeTableColumn} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'}],
 [{id:'d',text:'D'},{id:'e',text:'E'},{id:'f',text:'F'}],
 [{id:'g',text:'G'},{id:'h',text:'H'},{id:'i',text:'I'}]
];

test('delete a middle row preserves IDs, content and source unchanged',()=>{
 const source=grid(),before=structuredClone(source);
 const next=removeTableRow(source,1);
 assert.deepEqual(next,[source[0],source[2]]);
 assert.deepEqual(source,before);
 assert.equal(removeTableRow(source,-1),null);
 assert.equal(removeTableRow(source,3),null);
 assert.equal(removeTableRow([source[0]],0),null);
});

test('delete a logical column preserves remaining cells and matching layout widths',()=>{
 const source=grid(),before=structuredClone(source);
 const result=removeTableColumn(source,1,[100,200,300]);
 assert.deepEqual(result?.cells,[[source[0][0],source[0][2]],[source[1][0],source[1][2]],[source[2][0],source[2][2]]]);
 assert.deepEqual(result?.columnWidths,[100,300]);
 assert.deepEqual(source,before);
 assert.deepEqual(removeTableColumn(source,0)?.cells.map(row=>row.map(cell=>cell.text)),[['B','C'],['E','F'],['H','I']]);
 assert.equal(removeTableColumn(source,3),null);
 assert.equal(removeTableColumn(source,0,[10,20]),null);
 assert.equal(removeTableColumn([[{id:'one',text:'Only'}]],0),null);
});

test('a merged cell elsewhere does not prevent deleting a different column',()=>{
 const source=[
 [{id:'a',text:'Merged',colSpan:2},{id:'b',text:'B'}],
 [{id:'c',text:'C'},{id:'d',text:'D'},{id:'e',text:'E'}]
 ];
 const result=removeTableColumn(source,2,[100,200,300]);
 assert.deepEqual(result?.cells[0],[{id:'a',text:'Merged',colSpan:2}]);
 assert.deepEqual(result?.cells[1],[source[1][0],source[1][1]]);
 assert.deepEqual(result?.columnWidths,[100,200]);
 assert.equal(removeTableColumn(source,0),null,'merged first logical column must be rejected');
 assert.equal(removeTableColumn(source,1),null,'merged second logical column must be rejected');
 assert.deepEqual(source[0][0],{id:'a',text:'Merged',colSpan:2});
});

test('invalid grids, vertical spans and duplicate IDs cannot be deleted or mutated',()=>{
 const bad=[
 [[{id:'a',text:'A',rowSpan:2}],[{id:'b',text:'B'}]],
 [[{id:'a',text:'A'},{id:'b',text:'B'}],[{id:'c',text:'C'}]],
 [[{id:'a',text:'A'}],[{id:'a',text:'Duplicate'}]],
 [[{id:'a',text:'A',colSpan:0}],[{id:'b',text:'B'}]]
 ];
 for(const source of bad){
  const before=structuredClone(source);
  assert.equal(removeTableRow(source,0),null);
  assert.equal(removeTableColumn(source,0),null);
  assert.deepEqual(source,before);
 }
});
