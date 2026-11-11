import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const matrix=JSON.parse(readFileSync(new URL('../docs/export-coverage.json',import.meta.url),'utf8'));
const allowed=new Set(matrix.allowedEvidenceLevels);
const releases=new Set(JSON.parse(readFileSync(new URL('../docs/release-gates.json',import.meta.url),'utf8')).gates.map(g=>g.id));

test('export quality matrix is traceable, complete and never self-attests release',()=>{
 assert.equal(matrix.schemaVersion,1);
 assert.equal(matrix.releaseReadiness,'NOT_READY');
 assert.ok(matrix.rows.length>=12,'Document a meaningful export scenario inventory');
 const ids=new Set();
 for(const row of matrix.rows){
  assert.match(row.id,/^EXP-[0-9]{2}$/);
  assert.ok(!ids.has(row.id),'duplicate export scenario id: '+row.id);
  ids.add(row.id);
  assert.ok(typeof row.scenario==='string'&&row.scenario.length>4);
  assert.ok(Array.isArray(row.formats)&&row.formats.length>0);
  assert.ok(row.formats.every(format=>['pdf','pptx','png','jpg','html'].includes(format)));
  assert.ok(allowed.has(row.evidenceLevel),row.id+': unknown evidence level');
  assert.ok(['P0','P1','P2'].includes(row.priority));
  assert.ok(releases.has(row.gate),row.id+': nonexistent release gate');
  assert.ok(typeof row.verified==='string'&&row.verified.length>12);
  assert.ok(typeof row.remaining==='string'&&row.remaining.length>12,'No unresolved boundary: '+row.id);
  assert.ok(Array.isArray(row.evidence));
  if(row.evidenceLevel==='manual_pending')assert.equal(row.evidence.length,0,'Manual evidence cannot be pre-attested');
  else assert.ok(row.evidence.length>0,row.id+': named evidence file required');
  for(const relative of row.evidence){
   assert.ok(/^((tests|src|docs)\/[a-zA-Z0-9_./-]+)$/.test(relative),row.id+': unsafe evidence path');
   assert.ok(existsSync(new URL('../'+relative,import.meta.url)),row.id+': missing evidence '+relative);
  }
 }
 assert.ok(matrix.rows.some(row=>row.priority==='P0'&&row.evidenceLevel==='manual_pending'));
 for(const format of ['pdf','pptx','html'])assert.ok(matrix.rows.some(row=>row.formats.includes(format)),format+' missing');
});
