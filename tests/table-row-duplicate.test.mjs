import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canDuplicateTableRow,duplicateTableRow} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',text:'Heading',header:true,borders:{top:{width:2,paint:{color:'#123456'}}}},{id:'b',text:'B'}],
 [{id:'c',text:'Merged',colSpan:2}]
];

test('duplicate preserves content and formatting, but gives every copied cell a new ID',()=>{
 const source=grid(),before=structuredClone(source);
 let counter=0;
 const result=duplicateTableRow(source,0,()=>`new-${++counter}`);
 assert.equal(result.length,3);
 assert.deepEqual(result[1].map(cell=>cell.id),['new-1','new-2']);
 assert.deepEqual(result[1].map(({id,...other})=>other),source[0].map(({id,...other})=>other));
 assert.deepEqual(result[2],source[1]);
 assert.deepEqual(source,before);
 result[1][0].borders.top.paint.color='#ffffff';
 assert.equal(source[0][0].borders.top.paint.color,'#123456','nested formatting must not alias source');
 assert.equal(result[0][0].borders.top.paint.color,'#123456');
});

test('duplicates a merged horizontal row without altering colspan or existing identities',()=>{
 const source=grid();
 const result=duplicateTableRow(source,1,()=> 'fresh');
 assert.equal(result.length,3);
 assert.deepEqual(result[2],[{id:'fresh',text:'Merged',colSpan:2}]);
 assert.deepEqual(result[1],source[1]);
});

test('colliding identifiers are retried and exhausted generators reject safely',()=>{
 const source=grid(),before=structuredClone(source);
 let count=0;
 const result=duplicateTableRow(source,1,()=>++count<3?'a':'new-id');
 assert.equal(result[2][0].id,'new-id');
 assert.equal(duplicateTableRow(source,1,()=> 'a'),null);
 assert.deepEqual(source,before);
});

test('invalid rows and unsafe grids are blocked without mutation',()=>{
 const source=grid(),original=structuredClone(source);
 for(const index of [-1,2,0.5,NaN]){
  assert.equal(canDuplicateTableRow(source,index),false);
  assert.equal(duplicateTableRow(source,index,()=> 'new'),null);
 }
 assert.equal(canDuplicateTableRow(source,0),true);
 for(const invalid of [
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a'}],[{id:'b'},{id:'c'}]],
  [[{id:'a'}],[{id:'a'}]],
  [[{id:'a',colSpan:0}],[{id:'b'}]]
 ]){
  const before=structuredClone(invalid);
  assert.equal(canDuplicateTableRow(invalid,0),false);
  assert.equal(duplicateTableRow(invalid,0,()=> 'new'),null);
  assert.deepEqual(invalid,before);
 }
 assert.deepEqual(source,original);
});
