import {test} from 'node:test';
import assert from 'node:assert/strict';
import {iconCatalog,findIcon,iconElement} from '../src/core/iconCatalog.ts';

test('SF-GAP-03B: icons are self-contained, unique and valid PPD vector paths',()=>{
 assert.ok(iconCatalog.length>=8);
 assert.equal(new Set(iconCatalog.map(icon=>icon.id)).size,iconCatalog.length);
 for(const item of iconCatalog){
  assert.equal(findIcon(item.id)?.label,item.label);
  assert.match(item.path,/^M /);
  assert.ok(!/[<>]/.test(item.path),'No markup in icon geometry');
  const element=iconElement(item.id,'test-'+item.id);
  assert.equal(element.type,'vectorPath');
  assert.equal(element.vectorPath.format,'svg-path');
  assert.equal(element.vectorPath.closed,false);
  assert.equal(element.vectorPath.viewBox,'0 0 100 100');
  assert.equal(element.accessibility.altText,item.label);
 }
 assert.equal(findIcon('__proto__'),undefined);
 assert.throws(()=>iconElement('unknown','x'),/UNKNOWN_ICON/);
});
