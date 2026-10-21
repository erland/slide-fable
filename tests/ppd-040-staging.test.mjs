import {test} from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../proposals/ppd-0.4.0.schema.json' with {type:'json'};
import {createDocument} from '../src/core/model.ts';
import {toOutline,fromOutline,stagePpd040} from '../src/core/ppd040Staging.ts';

const ajv=new Ajv({strict:false,allErrors:true,allowUnionTypes:true});addFormats(ajv);
const validate=ajv.compile(schema);

test('stage PPD 0.4 keeps source immutable and validates generated outline',()=>{
 const source=createDocument();source.schemaVersion='0.3.1';
 const shape={id:'stage-shape',type:'shape',shapeType:'rect',geometry:{x:5,y:5,width:120,height:50},
  style:{fill:{color:'#ffffff'},stroke:{color:'#123456'},strokeWidth:3},text:'Hello'};
 source.slides[0].view.elements.push(shape);
 const before=JSON.stringify(source);
 const staged=stagePpd040(source);
 assert.equal(JSON.stringify(source),before);
 assert.equal(staged.schemaVersion,'0.4.0');
 const converted=staged.slides[0].view.elements.find(e=>e.id==='stage-shape');
 assert.deepEqual(converted.style.outline,{paint:{color:'#123456'},width:3});
 assert.equal('stroke'in converted.style,false);
 assert.equal(validate(staged),true,JSON.stringify(validate.errors));
 assert.equal(validate(JSON.parse(JSON.stringify(staged))),true);
});
test('staging handles theme styles, table cell styles and nested overrides',()=>{
 const source=createDocument();source.schemaVersion='0.3.1';
 source.theme.styles.custom={stroke:{color:'#123456'},strokeWidth:4};
 source.slides[0].view.elements.push({id:'stage-table',type:'table',geometry:{x:0,y:0,width:200,height:200},
  cells:[[{id:'cell-staged',text:'Sample',style:{stroke:{color:'#ABCDEF'},strokeWidth:2}}]],
  overrides:{style:{stroke:{color:'#445566'},strokeWidth:1}}});
 const staged=stagePpd040(source);
 assert.equal(staged.theme.styles.custom.outline.width,4);
 assert.equal(staged.slides[0].view.elements.at(-1).cells[0][0].style.outline.width,2);
 assert.equal(staged.slides[0].view.elements.at(-1).overrides.style.outline.width,1);
 assert.equal(validate(staged),true,JSON.stringify(validate.errors));
});
test('staging refuses conflict, wrong version and lossy reverse mapping',()=>{
 assert.throws(()=>toOutline({strokeWidth:2,outline:{width:2,paint:{}}}),/CONFLICT/);
 assert.throws(()=>stagePpd040({...createDocument(),schemaVersion:'0.4.0'}),/SOURCE_VERSION/);
 assert.deepEqual(fromOutline(toOutline({stroke:{color:'#112233'},strokeWidth:2})),{stroke:{color:'#112233'},strokeWidth:2});
 assert.throws(()=>fromOutline({outline:{paint:{},width:2,dash:'dash'}}),/LOSSY/);
});
