import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument,copy,effective} from '../src/core/model.ts';
import {updateLayoutName,setTemplateBackground,updatePlaceholderGeometry,duplicateLayout} from '../src/core/masterLayoutControls.ts';

test('editing a shared placeholder updates effective placement without rewriting slide content',()=>{
 const doc=createDocument(),slide=doc.slides[0],master=doc.masters[0],layout=master.layouts[0];
 const original=copy(slide),element=slide.view.elements[0],old=effective(doc,slide,element).geometry;
 updatePlaceholderGeometry(doc,master.id,layout.id,'title',{x:180,y:145});
 assert.equal(effective(doc,slide,element).geometry.x,180);
 assert.equal(effective(doc,slide,element).geometry.y,145);
 assert.equal(old.x,100);
 assert.deepEqual(slide,original);
});
test('layout and master backgrounds remain separate and can be inherited',()=>{
 const doc=createDocument(),master=doc.masters[0],layout=master.layouts[0];
 setTemplateBackground(doc,master.id,undefined,'#112233');
 setTemplateBackground(doc,master.id,layout.id,'#445566');
 assert.equal(master.background.color,'#112233');assert.equal(layout.background.color,'#445566');
 setTemplateBackground(doc,master.id,layout.id,undefined);
 assert.equal(layout.background,undefined);assert.equal(master.background.color,'#112233');
});
test('duplicate preserves the source layout while generating a distinct layout ID',()=>{
 const doc=createDocument(),m=doc.masters[0],source=copy(m.layouts[0]),length=m.layouts.length;
 const id=duplicateLayout(doc,m.id,source.id);
 assert.equal(m.layouts.length,length+1);assert.notEqual(id,source.id);
 assert.deepEqual(m.layouts[0],source);assert.deepEqual(m.layouts.at(-1).placeholders,source.placeholders);
 updateLayoutName(doc,m.id,id,'Ny företagslayout');assert.equal(m.layouts.at(-1).name,'Ny företagslayout');
});
test('invalid geometry and layout names are rejected without modification',()=>{
 const doc=createDocument(),m=doc.masters[0],l=m.layouts[0],old=copy(l);
 for(const values of [{x:-1},{width:0},{x:1510},{height:Infinity},{y:NaN}])assert.throws(()=>updatePlaceholderGeometry(doc,m.id,l.id,'title',values));
 assert.throws(()=>updateLayoutName(doc,m.id,l.id,' '));
 assert.throws(()=>setTemplateBackground(doc,m.id,l.id,'red'));
 assert.deepEqual(l,old);
});
