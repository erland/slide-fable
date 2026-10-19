import {test} from 'node:test';
import assert from 'node:assert/strict';
import {UpdateSafety} from '../src/pwa/safety.ts';
test('dirty edits prevent upgrade; reset permits lock',()=>{const s=new UpdateSafety();s.setDirty(true);assert.equal(s.prepare(),false);s.setDirty(false);assert.equal(s.prepare(),true);assert.equal(s.getSnapshot().locked,true);});
test('overlapping async operations hold guard until all finish',()=>{const s=new UpdateSafety(),a=s.beginOperation(),b=s.beginOperation();a();a();assert.equal(s.prepare(),false);b();assert.equal(s.prepare(),true);});
test('locked client rejects new edits and operations; rollback restores work',()=>{const s=new UpdateSafety();s.prepare();assert.equal(s.setDirty(true),false);assert.throws(()=>s.beginOperation(),/UPDATE_LOCKED/);s.release();assert.equal(s.setDirty(true),true);assert.equal(s.getSnapshot().dirty,true);});
test('subscribers observe immutable snapshots and unsubscribe',()=>{const s=new UpdateSafety();const original=s.getSnapshot();let changed=0;const off=s.subscribe(()=>changed++);s.setDirty(true);assert.notEqual(s.getSnapshot(),original);assert.equal(original.dirty,false);off();s.release();assert.equal(changed,1);});
