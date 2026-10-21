import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readOutline,patchOutline} from '../src/core/outline.ts';
import {EditorStore} from '../src/core/editor.ts';
import {validateCore} from '../src/core/contract.ts';

test('PPD 0.3.1 outline edits preserve schema and unrelated style values',()=>{
 const store=new EditorStore();
 const id=store.add('text');
 const element=store.slide.view.elements.find(e=>e.id===id);
 const style=patchOutline(element.style,{paint:{color:'#336699'},width:3},store.getSnapshot().doc.schemaVersion);
 store.updateElement(id,{style});
 const result=store.slide.view.elements.find(e=>e.id===id);
 assert.equal(result.style.stroke.color,'#336699');
 assert.equal(result.style.strokeWidth,3);
 assert.equal(result.style.fontSize,40);
 assert.equal('outline' in result.style,false);
 assert.doesNotThrow(()=>validateCore(store.getSnapshot().doc));
 store.undo();assert.equal(store.slide.view.elements.find(e=>e.id===id).style.stroke,undefined);
 store.redo();assert.equal(readOutline(store.slide.view.elements.find(e=>e.id===id).style).width,3);
});

test('PPD 0.4.0 outline writes use only canonical representation',()=>{
 const original={fontSize:32,fill:{color:'#FFFFFF'},stroke:{color:'#111111'},strokeWidth:2};
 const next=patchOutline(original,{paint:{color:'#222222'},width:5,dash:'dash',cap:'round'},'0.4.0');
 assert.equal(next.outline.paint.color,'#222222');
 assert.equal(next.outline.width,5);
 assert.equal(next.outline.dash,'dash');
 assert.equal(next.fill.color,'#FFFFFF');
 assert.equal(next.fontSize,32);
 assert.equal('stroke' in next,false);
 assert.equal('strokeWidth' in next,false);
 assert.deepEqual(original,{fontSize:32,fill:{color:'#FFFFFF'},stroke:{color:'#111111'},strokeWidth:2});
 assert.deepEqual(readOutline(next),next.outline);
});

test('unsupported 0.4-only options are never silently discarded from active format',()=>{
 assert.throws(()=>patchOutline({}, {dash:'dash'},'0.3.1'),/OUTLINE_040_ONLY/);
 assert.throws(()=>patchOutline({}, {width:-1},'0.4.0'),/INVALID_OUTLINE_WIDTH/);
 assert.throws(()=>patchOutline({}, {width:Infinity},'0.3.1'),/INVALID_OUTLINE_WIDTH/);
 assert.throws(()=>patchOutline({}, {width:1},'0.8.0'),/UNKNOWN_PPD_VERSION/);
});

test('drawing controls preserve paint when width changes and preserve width when paint changes',()=>{
 const base={fill:{color:'#EEEEEE'},stroke:{color:'#112233'},strokeWidth:5};
 const width=patchOutline(base,{width:8},'0.3.1');
 assert.equal(width.stroke.color,'#112233');
 assert.equal(width.strokeWidth,8);
 const paint=patchOutline(width,{paint:{...readOutline(width).paint,color:'#778899'}},'0.3.1');
 assert.equal(paint.strokeWidth,8);
 assert.equal(paint.stroke.color,'#778899');
 assert.deepEqual(base,{fill:{color:'#EEEEEE'},stroke:{color:'#112233'},strokeWidth:5});
 const future=patchOutline({outline:{paint:{color:'#112233'},width:5,dash:'dash'}},{width:8},'0.4.0');
 assert.equal(future.outline.dash,'dash');
 assert.equal(future.outline.width,8);
});
