import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocument,newSlide} from '../src/core/model.ts';
import {applySlideBackground,resetSlideBackground,effectiveBackground,backgroundColor} from '../src/core/backgroundControls.ts';

test('background actions respect current slide and all slides without modifying the theme',()=>{
 const doc=createDocument();doc.slides.push(newSlide(doc,'content'));
 const [first,second]=doc.slides,theme=structuredClone(doc.theme);
 const inherited=backgroundColor(doc,first);
 applySlideBackground(doc,first.id,'#112233','current');
 assert.equal(first.view.background.color,'#112233');
 assert.equal(second.view.background,undefined);
 applySlideBackground(doc,first.id,'#abcdef','all');
 assert.deepEqual(doc.slides.map(s=>s.view.background?.color),['#abcdef','#abcdef']);
 resetSlideBackground(doc,first.id,'current');
 assert.equal(first.view.background,undefined);
 assert.equal(second.view.background.color,'#abcdef');
 assert.equal(backgroundColor(doc,first),inherited);
 resetSlideBackground(doc,first.id,'all');
 assert.deepEqual(doc.slides.map(s=>s.view.background),[undefined,undefined]);
 assert.ok(effectiveBackground(doc,first));
 assert.deepEqual(doc.theme,theme);
});

test('invalid background colors are rejected before document mutation',()=>{
 const doc=createDocument(),before=structuredClone(doc);
 for(const color of ['red','#aaa','javascript:alert(1)','']){
  assert.throws(()=>applySlideBackground(doc,doc.slides[0].id,color,'current'),/INVALID_BACKGROUND_COLOR/);
 }
 assert.deepEqual(doc,before);
});
