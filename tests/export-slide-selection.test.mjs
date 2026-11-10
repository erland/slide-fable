import assert from 'node:assert/strict';
import test from 'node:test';
import {selectExportSlides} from '../src/export/slideSelection.ts';

const slides=[
 {id:'first',title:'Start',hidden:false,view:{elements:[{id:'shape-a'}]}},
 {id:'secret',title:'Dold',hidden:true,view:{elements:[{id:'secret-shape'}]}},
 {id:'last',title:'Slut',view:{elements:[{id:'shape-c'}]}}
];
const doc={slides};

test('all exports only visible slides in their original order',()=>{
 const picked=selectExportSlides(doc,'secret','all');
 assert.deepEqual(picked.map(s=>s.id),['first','last']);
 assert.strictEqual(picked[0],slides[0], 'preserve the original slide objects');
});

test('current exports only the selected visible slide',()=>{
 assert.deepEqual(selectExportSlides(doc,'last','current').map(s=>s.id),['last']);
 assert.deepEqual(selectExportSlides(doc,'first','current').map(s=>s.id),['first']);
});

test('hidden, missing and empty selections fail safely',()=>{
 assert.throws(()=>selectExportSlides(doc,'secret','current'),/Minst en synlig bild/);
 assert.throws(()=>selectExportSlides(doc,'not-found','current'),/Minst en synlig bild/);
 assert.throws(()=>selectExportSlides({slides:[slides[1]]},'secret','all'),/Minst en synlig bild/);
 assert.throws(()=>selectExportSlides({slides:[]},'first','all'),/Minst en synlig bild/);
});

test('unexpected selection modes must never leak hidden or unrelated slides',()=>{
 assert.throws(()=>selectExportSlides(doc,'first','everything'),/Okänt bildurval/);
 assert.throws(()=>selectExportSlides(doc,'first',''),/Okänt bildurval/);
});
