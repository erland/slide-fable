import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareRgb} from '../scripts/export_fidelity_metrics.mjs';

test('identical images produce zero differences',()=>{
 const image=Uint8Array.from([10,20,30,40,50,60]);
 const out=compareRgb(image,image,2,1);
 assert.equal(out.meanAbsoluteChannelError,0);
 assert.equal(out.changedPixelPercent,0);
 assert.equal(out.maxChannelError,0);
 assert.equal(out.difference.length,6);
 assert.deepEqual([...out.difference],[239,239,239,239,239,239]);
});
test('threshold is applied to maximum per-channel difference, metrics use all channels',()=>{
 const a=Uint8Array.from([0,0,0,100,100,100]);
 const b=Uint8Array.from([25,0,0,110,100,100]);
 const out=compareRgb(a,b,2,1,24);
 assert.equal(out.changedPixelPercent,50);
 assert.equal(out.maxChannelError,25);
 assert.equal(out.meanAbsoluteChannelError,Number((35/6).toFixed(4)));
 assert.equal(out.difference[0],255);
 assert.equal(out.difference[3],239);
});
test('diagnostics reject invalid image data and thresholds',()=>{
 assert.throws(()=>compareRgb(new Uint8Array(3),new Uint8Array(6),1,1),/DIMENSIONS_MISMATCH/);
 assert.throws(()=>compareRgb(new Uint8Array(3),new Uint8Array(3),0,1),/INVALID_IMAGE_SIZE/);
 assert.throws(()=>compareRgb(new Uint8Array(3),new Uint8Array(3),1,1,-1),/INVALID_DIFFERENCE_THRESHOLD/);
});
