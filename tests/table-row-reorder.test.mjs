import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveTableRow} from '../src/editor/tableCells.ts';

const rows=()=>[
 [{id:'h1',text:'Heading A',header:true},{id:'h2',text:'Heading B',header:true}],
 [{id:'a',text:'First',colSpan:2}],
 [{id:'b',text:'Second'},{id:'c',text:'Third'}]
];

test('moving a row preserves cells, content, spans, IDs and source',()=>{
 const source=rows(),original=structuredClone(source);
 const up=moveTableRow(source,2,-1);
 assert.ok(up);
 assert.deepEqual(up.map(row=>row.map(cell=>cell.id)),[['h1','h2'],['b','c'],['a']]);
 assert.deepEqual(up[2][0],{id:'a',text:'First',colSpan:2});
 assert.deepEqual(source,original);
 assert.deepEqual(moveTableRow(up,1,1),original,'moving back restores order for undo/redo');
});

test('row moves reject boundaries and invalid directions without mutation',()=>{
 const source=rows(),original=structuredClone(source);
 for(const [index,direction] of [[0,-1],[2,1],[-1,1],[3,-1],[1,0],[1,2],[0.5,1]]){
  assert.equal(moveTableRow(source,index,direction),null);
 }
 assert.deepEqual(source,original);
});

test('row moves reject vertical spans, inconsistent widths and duplicate IDs',()=>{
 const cases=[
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a',colSpan:2}],[{id:'b'}]],
  [[{id:'a'}],[{id:'a'}]],
  [[{id:'a',colSpan:0}],[{id:'b'}]]
 ];
 for(const source of cases){
  const before=structuredClone(source);
  assert.equal(moveTableRow(source,0,1),null);
  assert.deepEqual(source,before);
 }
});
