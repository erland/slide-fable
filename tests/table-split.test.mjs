import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitHorizontalCell} from '../src/editor/tableCells.ts';
const make=()=>[[{id:'a',text:'Första',colSpan:2,header:true,style:{color:'#123456'}},{id:'c',text:'Tredje'}],[{id:'d',text:'D'},{id:'e',text:'E'},{id:'f',text:'F'}]];
test('splitting a horizontally merged cell keeps contents, styling and table width and creates unique IDs',()=>{
 const source=make();let n=0;
 const output=splitHorizontalCell(source,0,0,()=>`new-${++n}`);
 assert.ok(output);assert.equal(output[0].length,3);
 assert.equal(output[0][0].text,'Första');assert.equal(output[0][0].id,'a');assert.equal(output[0][0].colSpan,undefined);
 assert.equal(output[0][1].text,'');assert.equal(output[0][1].id,'new-1');assert.equal(output[0][1].header,true);
 assert.deepEqual(output[0][1].style,{color:'#123456'});
 assert.equal(output[0].reduce((n,c)=>n+(c.colSpan??1),0),3);
 assert.equal(new Set(output.flat().map(c=>c.id)).size,6);
 assert.equal(source[0][0].colSpan,2);assert.equal(source[0].length,2);
});
test('non-merged and irregular or vertically-spanned tables refuse split without mutation',()=>{
 assert.equal(splitHorizontalCell(make(),0,1,()=> 'x'),null);
 const bad=make();bad[1].pop();assert.equal(splitHorizontalCell(bad,0,0,()=> 'x'),null);
 const vertical=make();vertical[1][0].rowSpan=2;assert.equal(splitHorizontalCell(vertical,0,0,()=> 'x'),null);
});
test('IDs are collision-safe',()=>{let n=0;const result=splitHorizontalCell(make(),0,0,()=>++n===1?'a':'fresh');assert.equal(result[0][1].id,'fresh');});
