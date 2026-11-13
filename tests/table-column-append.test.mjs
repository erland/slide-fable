import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendTableColumn,canAppendTableColumn} from '../src/editor/tableCells.ts';

const grid=()=>[
 [{id:'a',colSpan:2,text:'Merged'},{id:'b',text:'B'}],
 [{id:'c',text:'C'},{id:'d',text:'D'},{id:'e',text:'E'}]
];

test('append keeps logical width rectangular even when preceding cells are merged',()=>{
 const before=grid(),source=structuredClone(before);
 let id=0;
 const result=appendTableColumn(before,id=>({id,text:''}),()=>`new-${++id}`);
 assert.deepEqual(result?.cells.map(row=>row.reduce((width,cell)=>width+(cell.colSpan??1),0)),[4,4]);
 assert.deepEqual(result?.cells.map(row=>row.at(-1).id),['new-1','new-2']);
 assert.deepEqual(result.cells[0][0],source[0][0]);
 assert.equal(Object.hasOwn(result,'columnWidths'),false);
 assert.deepEqual(before,source);
});

test('explicit widths remain aligned with appended logical column',()=>{
 const source=grid();
 let count=0;
 const result=appendTableColumn(source,id=>({id,text:''}),()=>`new-${++count}`,[80,90,110]);
 assert.deepEqual(result?.columnWidths,[80,90,110,110]);
 assert.deepEqual(result?.cells.map(row=>row.at(-1).text),['','']);
 assert.deepEqual(source[1].map(cell=>cell.id),['c','d','e']);
});

test('invalid grids and widths reject addition without modifying source',()=>{
 const bad=[
  [[{id:'a'}],[{id:'a'}]],
  [[{id:'a',rowSpan:2}],[{id:'b'}]],
  [[{id:'a',colSpan:2}],[{id:'b'}]],
  [[{id:'a',colSpan:0}],[{id:'b'}]]
 ];
 for(const cells of bad){
  const source=structuredClone(cells);
  assert.equal(canAppendTableColumn(cells),false);
  assert.equal(appendTableColumn(cells,id=>({id}),()=> 'unique'),null);
  assert.deepEqual(cells,source);
 }
 const source=grid(),before=structuredClone(source);
 for(const widths of [[1,2],[1,0,3],[1,Infinity,3]]){
  assert.equal(canAppendTableColumn(source,widths),false);
  assert.equal(appendTableColumn(source,id=>({id}),()=> 'fresh',widths),null);
 }
 assert.deepEqual(source,before);
});

test('identifier exhaustion and invalid cells reject atomically',()=>{
 const source=grid(),before=structuredClone(source);
 assert.equal(appendTableColumn(source,id=>({id}),()=> 'a'),null);
 assert.equal(appendTableColumn(source,id=>({id:'wrong'}),()=> 'fresh'),null);
 assert.equal(appendTableColumn(source,id=>({id,colSpan:2}),()=> 'fresh'),null);
 assert.deepEqual(source,before);
});
