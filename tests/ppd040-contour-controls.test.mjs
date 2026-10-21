import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editStrokeStyle,editEndMarker,currentStrokeStyle,currentEndMarkers} from '../src/core/contourControls.ts';
import {EditorStore} from '../src/core/editor.ts';
import {createPpd040} from '../src/core/ppd040Document.ts';
import {inspectPpd040} from '../src/core/ppd040Preflight.ts';

test('PPD 0.4 ribbon controls write canonical dash and marker values without extensions',()=>{
 const store=new EditorStore(createPpd040());
 const id=store.add('arrow');
 let e=store.slide.view.elements.find(e=>e.id===id);
 store.updateElement(id,editStrokeStyle(e,'dashdot','0.4.0'));
 e=store.slide.view.elements.find(e=>e.id===id);
 assert.equal(e.style.outline.dash,'dash-dot');
 assert.equal(currentStrokeStyle(e),'dashdot');
 assert.equal(e.extensions?.slideFableStrokeStyle,undefined);
 store.updateElement(id,editEndMarker(e,'start','openArrow','0.4.0'));
 e=store.slide.view.elements.find(e=>e.id===id);
 assert.equal(e.style.outline.startMarker,'open-arrow');
 assert.equal(e.style.outline.endMarker,'triangle');
 assert.deepEqual(currentEndMarkers(e),{start:'openArrow',end:'filledArrow'});
 assert.equal(e.extensions?.slideFableEndMarkers,undefined);
 assert.equal(inspectPpd040(store.getSnapshot().doc).ready,true);
 store.undo();store.redo();
 assert.equal(inspectPpd040(store.getSnapshot().doc).ready,true);
});
test('Legacy stroke and marker writes remain version-bound and do not mutate source',()=>{
 const original={id:'old',type:'arrow',style:{stroke:{color:'#112233'},strokeWidth:2}};
 const dashed=editStrokeStyle(original,'dotted','0.3.1');
 assert.equal(dashed.extensions.slideFableStrokeStyle,'dotted');
 assert.equal(original.extensions,undefined);
 const marker=editEndMarker(original,'end','diamond','0.3.1');
 assert.equal(marker.extensions.slideFableEndMarkers.end,'diamond');
 assert.throws(()=>editStrokeStyle(original,'dashed','5.0.0'),/UNKNOWN_PPD_VERSION/);
});
