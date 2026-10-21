import {test} from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import proposal from '../proposals/ppd-0.4.0.schema.json' with {type:'json'};
import {createDocument,box,rich} from '../src/core/model.ts';

const ajv=new Ajv({strict:false,allErrors:true,allowUnionTypes:true});
addFormats(ajv);
const validate=ajv.compile(proposal);
const ink={paint:{color:'#234567'},width:3,dash:'dash',cap:'round',join:'round'};
function example(){
 const d=createDocument();
 d.schemaVersion='0.4.0';
 d.slides[0].view.elements.push({
  id:'text-surface',type:'text',geometry:box(40,40,450,180),
  text:rich('Inramad textruta'),
  style:{fill:{color:'#FFEECC'},outline:ink,color:'#123456',fontSize:32},
  flipX:false
 },{
  id:'table-sample',type:'table',geometry:box(50,280,600,240),
  tableLayout:{columnWidths:[300,300],rowHeights:[120]},
  cells:[[{id:'cell-a',text:'A',borders:{bottom:ink}},
          {id:'cell-b',text:'B'}]]
 });
 d.slides[0].animations=[{id:'anim-a',targetId:'text-surface',trigger:'on-click',
   effect:'fade',phase:'entrance',durationMs:400,delayMs:0}];
 return d;
}
test('PPD 0.4 proposal validates typical text surface, cell borders and animation',()=>{
 const doc=example();
 assert.equal(validate(doc),true,JSON.stringify(validate.errors));
 assert.equal(validate(JSON.parse(JSON.stringify(doc))),true,'JSON roundtrip');
});
test('PPD 0.4 validates rich run superscripts, highlight and spacing',()=>{
 const doc=example();
 doc.slides[0].view.elements.find(e=>e.id==='text-surface').text.paragraphs[0].runs[0]
   ={text:'x2',baseline:'superscript',highlight:'#FFF000',letterSpacing:1.2};
 assert.equal(validate(doc),true,JSON.stringify(validate.errors));
});
test('PPD 0.4 rejects malformed semantic fields',()=>{
 const doc=example();
 doc.slides[0].view.elements.find(e=>e.id==='text-surface').style.outline.dash='custom';
 assert.equal(validate(doc),false,'custom dash requires dashArray');
 doc.slides[0].view.elements.find(e=>e.id==='text-surface').style.outline.dashArray=[4,2];
 assert.equal(validate(doc),true,JSON.stringify(validate.errors));
 doc.slides[0].animations[0].trigger='random';
 assert.equal(validate(doc),false,'unknown trigger rejected');
});
