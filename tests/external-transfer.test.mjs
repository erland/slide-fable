import {test} from 'node:test';
import assert from 'node:assert/strict';
import {externalRichText,transferableImage,hasExternalContent} from '../src/core/externalTransfer.ts';

test('plain text becomes separate paragraphs, without HTML execution',()=>{
 const rich=externalRichText('Hej\nVärlden');
 assert.equal(rich.paragraphs.length,2);
 assert.deepEqual(rich.paragraphs.map(p=>p.runs[0].text),['Hej','Världen']);
});
test('HTML imports only text and approved inline formatting',()=>{
 const t=value=>({nodeType:3,textContent:value});
 const e=(tag,...children)=>({nodeType:1,tagName:tag,childNodes:children});
 const parsed=()=>({body:{childNodes:[e('P',t('Hej '),e('STRONG',t('fet')),e('SCRIPT',t('alert(1)'))),e('P',e('EM',t('kursiv')))]}});
 const rich=externalRichText('', '<p>safe</p>',parsed);
 assert.equal(rich.paragraphs.length,2);
 assert.equal(rich.paragraphs[0].runs[1].marks.bold,true);
 assert.equal(rich.paragraphs[1].runs[0].marks.italic,true);
 assert.equal(JSON.stringify(rich).includes('alert(1)'),false);
});
test('rejects oversized clipboard and ignores unknown image types',()=>{
 assert.throws(()=>externalRichText('x'.repeat(100001)),/för stor/);
 assert.equal(transferableImage([{type:'image/svg+xml'}]),undefined);
 assert.equal(transferableImage([{type:'image/png'}])?.type,'image/png');
 assert.equal(hasExternalContent({files:[],getData:()=>''}),false);
 assert.equal(hasExternalContent({files:[],getData:kind=>kind==='text/plain'?'text':''}),true);
});
