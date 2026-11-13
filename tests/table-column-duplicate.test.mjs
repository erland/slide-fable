import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canDuplicateTableColumn,duplicateTableColumn} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',text:'A',style:{paint:{color:'#123456'}}},{id:'b',text:'B'},{id:'c',text:'C'}],
 [{id:'d',text:'D'},{id:'e',text:'E'},{id:'f',text:'F'}]
];

test('duplicates a logical column across rows with fresh IDs and matching width',()=>{
 const source=grid(),before=structuredClone(source);
 let counter=0;
 const result=duplicateTableColumn(source,1,()=>\`new-\${++counter}\`,[100,200,300]);
 assert.ok(result);
 assert.deepEqual(result.cells.map(row=>row.map(cell=>cell.id)),[['a','b','new-1','c'],['d','e','new-2','f']]);
 assert.deepEqual(result.columnWidths,[100,200,200,300]);
 assert.deepEqual(result.cells[0][2].text,'B');
 assert.deepEqual(source,before);
 result.cells[0][0].style.paint.color='#ffffff';
 assert.equal(source[0][0].style.paint.color,'#123456');
});

test('deep-copies the duplicated cell formatting',()=>{
 const source=grid();
 let index=0;
 const result=duplicateTableColumn(source,0,()=>\`copy-\${++index}\`);
 assert.deepEqual(result.cells[0][1].style,source[0][0].style);
 result.cells[0][1].style.paint.color='#ffffff';
 assert.equal(result.cells[0][0].style.paint.color,'#123456');
 assert.equal(source[0][0].style.paint.color,'#123456');
 assert.equal(Object.hasOwn(result,'columnWidths'),false);
});

test('preserves unrelated merges and rejects a merged target',()=>{
 const source=[
  [{id:'a',colSpan:2,text:'merged'},{id:'c'}],
  [{id:'d'},{id:'e'},{id:'f'}]
 ];
 assert.equal(canDuplicateTableColumn(source,0),false);
 assert.equal(canDuplicateTableColumn(source,1),false);
 assert.equal(canDuplicateTableColumn(source,2),true);
 let index=0;
 const result=duplicateTableColumn(source,2,()=>\`copy-\${++index}\`);
 assert.deepEqual(result.cells.map(row=>row.map(cell=>cell.id)),[['a','c','copy-1'],['d','e','f','copy-2']]);
 assert.equal(result.cells[0][0].colSpan,2);
});

test('invalid indices, grids, widths, and ID exhaustion fail atomically',()=>{
 const source=grid(),before=structuredClone(source);
 for(const index of [-1,3,0.5,NaN]){
  assert.equal(canDuplicateTableColumn(source,index),false);
  assert.equal(duplicateTableColumn(source,index,()=> 'new'),null);
 }
 assert.equal(canDuplicateTableColumn(source,1,[100,200]),false);
 assert.equal(canDuplicateTableColumn(source,1,[100,0,300]),false);
 assert.equal(duplicateTableColumn(source,1,()=> 'a'),null);
 assert.deepEqual(source,before);
 for(const invalid of [
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a'}],[{id:'b'},{id:'c'}]],
  [[{id:'a'}],[{id:'a'}]]
 ]){
  const original=structuredClone(invalid);
  assert.equal(canDuplicateTableColumn(invalid,0),false);
  assert.equal(duplicateTableColumn(invalid,0,()=> 'new'),null);
  assert.deepEqual(invalid,original);
 }
});
