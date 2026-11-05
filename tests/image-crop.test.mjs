import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coverCrop,normalizeCrop,panCrop,zoomCrop} from '../src/editor/imageCrop.ts';
import {paragraphFormat,paragraphCss} from '../src/editor/paragraphFormatting.ts';

test('cover crop preserves source proportions in wide and tall frames',()=>{
 assert.deepEqual(coverCrop(800,400,200,200),{x:.25,y:0,width:.5,height:1});
 assert.deepEqual(coverCrop(400,800,200,200),{x:0,y:.25,width:1,height:.5});
 assert.deepEqual(coverCrop(800,400,400,200),{x:0,y:0,width:1,height:1});
});
test('zoom keeps crop center and pan stays inside image without mutation',()=>{
 const base=coverCrop(800,400,200,200),zoomed=zoomCrop(base,base,2);
 assert.deepEqual(zoomed,{x:.375,y:.25,width:.25,height:.5});
 assert.deepEqual(panCrop(zoomed,1000,-1000,200,200),{x:0,y:.5,width:.25,height:.5});
 assert.deepEqual(base,{x:.25,y:0,width:.5,height:1});
 assert.deepEqual(zoomCrop(zoomed,base,1),base);
});
test('invalid crop measurements cannot produce nonfinite model coordinates',()=>{
 for(const dimensions of [[0,4,2,2],[2,NaN,3,3],[3,3,-2,4]])assert.throws(()=>coverCrop(...dimensions),/INVALID_CROP/);
 assert.throws(()=>zoomCrop({x:0,y:0,width:1,height:1},{x:0,y:0,width:1,height:1},0),/INVALID_CROP_ZOOM/);
 assert.throws(()=>normalizeCrop({x:0,y:0,width:0,height:1}),/INVALID_CROP/);
 assert.throws(()=>panCrop({x:0,y:0,width:1,height:1},NaN,0,100,100),/INVALID_CROP/);
});
test('paragraph formatting preserves list semantics and validates spacing',()=>{
 const original={listType:'number',listLevel:2,listStart:3,align:'right'};
 assert.deepEqual(paragraphFormat(original,'lineSpacing',1.8),{...original,lineSpacing:1.8});
 assert.deepEqual(original,{listType:'number',listLevel:2,listStart:3,align:'right'});
 assert.match(paragraphCss({lineSpacing:1.8,marginAfter:12,indent:20}),/line-height: 1.8/);
 assert.match(paragraphCss({marginAfter:12}),/margin-bottom: 12px/);
 for(const value of [NaN,Infinity,-1,5])assert.throws(()=>paragraphFormat(original,'lineSpacing',value),/INVALID_PARAGRAPH/);
});
