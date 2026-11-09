import {test} from 'node:test';
import assert from 'node:assert/strict';
import {iconCatalog,findIcon,iconElement,filterIcons} from '../src/core/iconCatalog.ts';

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

test('SF-GAP-03C: icon search filters by Swedish labels, aliases, category and whitespace',()=>{
 assert.equal(filterIcons('').length,iconCatalog.length);
 assert.deepEqual(filterIcons('dAtAbAs').map(icon=>icon.id),['database']);
 assert.deepEqual(filterIcons('sakerhet').map(icon=>icon.id),['shield']);
 assert.deepEqual(filterIcons('arbetsgrupp','Verksamhet').map(icon=>icon.id),['team']);
 assert.equal(filterIcons('databas','Verksamhet').length,0);
 assert.equal(filterIcons('IT').length,iconCatalog.filter(icon=>icon.group==='IT').length);
 assert.deepEqual(filterIcons('  person   verksamhet  ').map(icon=>icon.id),['person']);
 assert.deepEqual(filterIcons('  ' , 'Alla').map(icon=>icon.id),iconCatalog.map(icon=>icon.id));
 assert.equal(filterIcons('nej-det-finns-inte').length,0);
 assert.equal(filterIcons('x'.repeat(500)).length,0);
});
