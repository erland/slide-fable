import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorStore} from '../src/core/editor.ts';
import {createDocument,allElements,effective,textOf,copy} from '../src/core/model.ts';
import {validateCore} from '../src/core/contract.ts';
import {moveSlidesBefore,moveSlidesBy,reuseSlides} from '../src/core/slideOperations.ts';
import {themeChoices} from '../src/core/designGallery.ts';
const order=['a','b','c','d','e'];
test('reorder selections preserves order and content identities, with edge no-ops',()=>{
 assert.deepEqual(moveSlidesBefore(order,['d','b'],'a'),['b','d','a','c','e']);
 assert.deepEqual(moveSlidesBefore(order,['b','c'],'c'),order);
 assert.deepEqual(moveSlidesBefore(order,['b','d'],null),['a','c','e','b','d']);
 assert.deepEqual(moveSlidesBy(order,['b','c'],-1),['b','c','a','d','e']);
 assert.deepEqual(moveSlidesBy(order,['b','d'],1),['a','c','b','e','d']);
 const store=new EditorStore();store.addSlide();store.addSlide();const before=copy(store.getSnapshot().doc),ids=before.slides.map(s=>s.id);
 store.reorderSlides([ids[2]],ids[0]);assert.deepEqual(store.getSnapshot().doc.slides.map(s=>s.id),[ids[2],ids[0],ids[1]]);
 validateCore(store.getSnapshot().doc);store.undo();assert.deepEqual(store.getSnapshot().doc,before);
});
test('batch duplication remaps internal navigation, groups, fragments, animations and content',()=>{
 const store=new EditorStore();store.addSlide();const [first,second]=store.getSnapshot().doc.slides.map(s=>s.id);
 store.selectSlide(first);const a=store.add('shape'),b=store.add('shape');store.select([a,b]);store.group();
 store.updateElement(a,{actions:[{event:'click',kind:'navigate-slide',targetId:second}]});
 store.updateSlide({delivery:{speakerNotes:'Notes',fragments:[{id:'fragment-original',elementId:a,order:1}]},animations:[{id:'animation-original',targetId:a,effect:'appear',trigger:'on-click',durationMs:0}]});
 const before=copy(store.getSnapshot().doc),undo=store.getSnapshot().undo;
 const ids=store.duplicateSlides([first,second]),doc=store.getSnapshot().doc;
 assert.equal(ids.length,2);assert.equal(store.getSnapshot().undo,undo+1);
 const clone=doc.slides.find(s=>s.id===ids[0]);assert.equal(clone.delivery.speakerNotes,'Notes');
 assert.notEqual(clone.view.elements[0].id,before.slides[0].view.elements[0].id);
 assert.equal(clone.view.elements.find(e=>e.actions?.length).actions[0].targetId,ids[1]);
 assert.notEqual(clone.delivery.fragments[0].elementId,a);assert.equal(clone.animations[0].targetId,clone.delivery.fragments[0].elementId);
 assert.ok(clone.view.elements.filter(e=>e.type==='group').every(e=>e.children.every(id=>clone.view.elements.some(e=>e.id===id))));
 validateCore(doc);store.undo();assert.deepEqual(store.getSnapshot().doc,before);
});
test('batch hide and layout changes are undoable and retain slide text',()=>{
 const store=new EditorStore();store.addSlide();const ids=store.getSnapshot().doc.slides.map(s=>s.id),before=copy(store.getSnapshot().doc);
 store.setSlidesHidden(ids,true);assert.ok(store.getSnapshot().doc.slides.every(s=>s.hidden));store.undo();assert.deepEqual(store.getSnapshot().doc,before);
 store.applyLayouts(ids,'columns');assert.ok(store.getSnapshot().doc.slides.every(s=>s.placeholderBindings.length===3));
 for(const original of before.slides){const slide=store.getSnapshot().doc.slides.find(s=>s.id===original.id);assert.deepEqual(textOf(slide,slide.view.elements[0]),textOf(original,original.view.elements[0]));}
 validateCore(store.getSnapshot().doc);store.undo();assert.deepEqual(store.getSnapshot().doc,before);
});
test('reuse isolates identities and resources, preserves appearance, notes and selected navigation',async()=>{
 const source=new EditorStore();source.applyTheme(themeChoices[1]);source.addSlide();source.addSlide();
 const sourceDoc=source.getSnapshot().doc,[first,second,third]=sourceDoc.slides.map(s=>s.id);
 source.selectSlide(first);const groupChild=source.add('shape');source.updateElement(groupChild,{actions:[{event:'click',kind:'navigate-slide',targetId:second},{event:'click',kind:'navigate-slide',targetId:third}]});
 source.updateSlide({delivery:{speakerNotes:'Keep these notes'}});
 const original=copy(source.getSnapshot().doc),target=new EditorStore(),targetBefore=copy(target.getSnapshot().doc);
 const result=await target.reuseSlides(original,[first,second]),doc=target.getSnapshot().doc,slide=doc.slides.find(s=>s.id===result.ids[0]);
 assert.equal(result.removedLinks,1);assert.equal(doc.document.id,targetBefore.document.id);assert.deepEqual(doc.theme,targetBefore.theme);
 assert.equal(slide.delivery.speakerNotes,'Keep these notes');assert.equal(slide.view.background.color,'#173944');
 assert.equal(effective(doc,slide,slide.view.elements[0]).style.color,'#f5f7fa');
 assert.notEqual(slide.masterId,original.slides[0].masterId);
 assert.equal(slide.view.elements.find(e=>e.type==='shape').actions[0].targetId,result.ids[1]);
 const originalIds=new Set(allElements(original).map(e=>e.id));assert.ok(allElements(doc).filter(e=>!allElements(targetBefore).some(old=>old.id===e.id)).every(e=>!originalIds.has(e.id)));
 assert.deepEqual(original,source.getSnapshot().doc);validateCore(doc);
 const reopened=new EditorStore(JSON.parse(JSON.stringify(doc)));assert.deepEqual(reopened.getSnapshot().doc,doc);
 target.undo();assert.deepEqual(target.getSnapshot().doc,targetBefore);target.redo();assert.equal(target.getSnapshot().doc.slides.length,3);
});
test('repeated reuse duplicates master objects per slide and avoids destination default masters',async()=>{
 const source=createDocument();source.masters[0].elements=[{id:'logo',type:'shape',shapeType:'rect',geometry:{x:0,y:0,width:30,height:30},style:{fill:{color:'#cc0000'}}}];
 const second=new EditorStore(source);second.addSlide();const input=second.getSnapshot().doc,target=new EditorStore();
 target.updateDocument({defaultMasterId:'master',defaultLayoutId:'title'});
 await target.reuseSlides(input,input.slides.map(s=>s.id));await target.reuseSlides(input,[input.slides[0].id]);
 validateCore(target.getSnapshot().doc);const ids=allElements(target.getSnapshot().doc).map(e=>e.id);assert.equal(ids.length,new Set(ids).size);
 assert.ok(target.getSnapshot().doc.slides.slice(1).every(s=>s.view.elements.some(e=>e.style?.fill?.color==='#cc0000')));
});
test('reuse is atomic for stale documents, invalid assets and read-only mode',async()=>{
 const target=new EditorStore(),source=createDocument(),before=copy(target.getSnapshot().doc);
 const invalid=copy(source);invalid.assets.bad={kind:'image',storage:'embedded',mimeType:'image/png',uri:'bad'};
 await assert.rejects(target.reuseSlides(invalid,[source.slides[0].id]));assert.deepEqual(target.getSnapshot().doc,before);
 const pending=target.reuseSlides(source,[source.slides[0].id]);target.updateDocument({title:'Changed while validating'});await assert.rejects(pending,/ändrades/);assert.equal(target.getSnapshot().doc.slides.length,1);
 target.load(before,true);await assert.rejects(target.reuseSlides(source,[source.slides[0].id]),/READ_ONLY/);
 const full=copy(before);full.slides=Array.from({length:200},(_,i)=>({...copy(before.slides[0]),id:'limit-'+i}));assert.throws(()=>reuseSlides(full,source,[source.slides[0].id],full.slides[0].id),/200/);
});

test('reuse copies only needed assets and components without overwriting name collisions',async()=>{
 const source=createDocument(),target=new EditorStore(),uri='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/eWQAAAAASUVORK5CYII=';
 const asset={kind:'image',storage:'embedded',mimeType:'image/png',uri};
 source.assets.shared={...asset,altText:'Source'};source.assets.unused={...asset,altText:'Unused'};
 source.components=[{id:'source-component',elements:[{id:'component-image',type:'image',assetRef:'shared',geometry:{x:0,y:0,width:100,height:100}}],slots:[]}];
 source.slides[0].view.elements.push({id:'source-instance',type:'component',componentId:'source-component',geometry:{x:400,y:200,width:100,height:100}});
 target.transaction(d=>{d.assets.shared={...asset,altText:'Target'};});
 const result=await target.reuseSlides(source,[source.slides[0].id]),doc=target.getSnapshot().doc;
 assert.equal(doc.assets.shared.altText,'Target');assert.equal(Object.keys(doc.assets).length,2);
 assert.ok(Object.values(doc.assets).some(a=>a.altText==='Source'));assert.ok(!Object.values(doc.assets).some(a=>a.altText==='Unused'));
 const imported=doc.slides.find(s=>s.id===result.ids[0]),instance=imported.view.elements.find(e=>e.type==='component'),component=doc.components.find(c=>c.id===instance.componentId);
 assert.ok(component);assert.notEqual(component.elements[0].assetRef,'shared');validateCore(doc);
});

test('reuse fits different canvas sizes proportionally within a clipped frame',async()=>{
 const source=createDocument();source.document.canvas={width:900,height:1600,unit:'logical'};
 const target=new EditorStore(),result=await target.reuseSlides(source,[source.slides[0].id]);
 const slide=target.getSnapshot().doc.slides.find(s=>s.id===result.ids[0]),frame=slide.view.elements.find(e=>e.extensions?.slideFableCanvasFrame);
 assert.ok(frame);assert.equal(frame.geometry.height,900);assert.equal(frame.geometry.width,506.25);assert.equal(frame.geometry.y,0);
 assert.ok(frame.children.every(id=>slide.view.elements.some(e=>e.id===id)));validateCore(target.getSnapshot().doc);
});

test('deleting slides cleans navigation in all scenes without adding empty optional fields',()=>{
 const store=new EditorStore();store.addSlide();const ids=store.getSnapshot().doc.slides.map(s=>s.id);
 store.transaction(d=>{d.masters[0].elements=[{id:'master-link',type:'shape',geometry:{x:0,y:0,width:30,height:30},actions:[{event:'click',kind:'navigate-slide',targetId:ids[0]}]}];});
 const before=copy(store.getSnapshot().doc);store.removeSlides([ids[0]]);
 assert.equal(store.getSnapshot().doc.masters[0].elements[0].actions.length,0);
 assert.ok(store.slide.view.elements.every(e=>!Object.hasOwn(e,'actions')));validateCore(store.getSnapshot().doc);
 store.undo();assert.deepEqual(store.getSnapshot().doc,before);
});
