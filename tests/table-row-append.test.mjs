import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendTableRow,canAppendTableRow} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',colSpan:2,text:'Merged',header:true},{id:'b',text:'B'}],
 [{id:'c',text:'C'},{id:'d',text:'D'},{id:'e',text:'E'}]
];

test('append row uses logical columns, preserving old merges, IDs and contents',()=>{
 const source=grid(),before=structuredClone(source);
 let count=0;
 const result=appendTableRow(source,id=>({id,text:''}),()=>`fresh-${++count}`);
 assert.ok(result);
 assert.equal(result.length,3);
 assert.deepEqual(result[2].map(cell=>cell.id),['fresh-1','fresh-2','fresh-3']);
 assert.deepEqual(result[2].map(cell=>cell.text),['','','']);
 assert.deepEqual(result.map(row=>row.reduce((sum,cell)=>sum+(cell.colSpan??1),0)),[3,3,3]);
 assert.deepEqual(result.slice(0,2),before);
 assert.deepEqual(source,before);
});

test('same operation supports a one-column table',()=>{
 const source=[[{id:'only',text:'One'}]];
 const result=appendTableRow(source,id=>({id,text:''}),()=> 'new');
 assert.deepEqual(result,[[{id:'only',text:'One'}],[{id:'new',text:''}]]);
});

test('ID retries are unique across all new cells and original cells',()=>{
 const source=grid();
 const sequence=['a','copy-1','copy-1','copy-2','copy-3'];
 let pos=0;
 const result=appendTableRow(source,id=>({id,text:''}),()=>sequence[pos++]);
 assert.deepEqual(result?.[2].map(cell=>cell.id),['copy-1','copy-2','copy-3']);
 assert.equal(appendTableRow(source,id=>({id}),()=> 'a'),null);
});

test('invalid grids cannot append; failures never modify input',()=>{
 const cases=[
  [],
  [[{id:'a'}],[]],
  [[{id:'a'}],[{id:'a'}]],
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a',colSpan:2}],[{id:'b'}]],
  [[{id:'a',colSpan:0}],[{id:'b'}]]
 ];
 for(const cells of cases){
  const before=structuredClone(cells);
  assert.equal(canAppendTableRow(cells),false);
  assert.equal(appendTableRow(cells,id=>({id}),()=> 'unique'),null);
  assert.deepEqual(cells,before);
 }
 const source=grid(),before=structuredClone(source);
 assert.equal(appendTableRow(source,()=>({id:'wrong'}),()=> 'new'),null);
 assert.equal(appendTableRow(source,id=>({id,colSpan:2}),()=> 'new'),null);
 assert.deepEqual(source,before);
});
