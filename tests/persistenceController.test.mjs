import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DraftPersistenceController} from '../src/core/persistenceController.ts';
const doc=(id='a')=>({document:{id}});
const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('debounce writes last document only and acknowledges exact snapshot',async()=>{
 const calls=[],saved=[];
 const c=new DraftPersistenceController(async(d,v)=>{calls.push([d,v]);return 1;},10);
 const first=doc(),last=doc();c.schedule(first,()=>true,()=>saved.push('first'));c.schedule(last,d=>d===last,x=>saved.push(x));
 await tick(45);assert.equal(calls.length,1);assert.equal(calls[0][0],last);assert.deepEqual(saved,['saved']);
});
test('restored draft version is passed to CAS and retries use latest version',async()=>{
 const versions=[];const d=doc();const c=new DraftPersistenceController(async(_d,v)=>{versions.push(v);return v+1;},1);
 c.restore(d,4);c.schedule(d,()=>true,()=>{});await tick(30);
 c.schedule(d,()=>true,()=>{});await tick(30);assert.deepEqual(versions,[4,5]);
});
test('conflict is surfaced without silently replacing a draft',async()=>{
 const results=[];const c=new DraftPersistenceController(async()=>{throw Error('CONFLICT');},1);
 c.schedule(doc(),()=>true,(result)=>results.push(result));await tick(30);assert.deepEqual(results,['conflict']);
});
test('serialized CAS writes and stale acknowledgement',async()=>{
 let active=0,max=0;const results=[];const c=new DraftPersistenceController(async()=>{active++;max=Math.max(active,max);await tick(15);active--;return 1;},1);
 const a=doc();const b=doc();c.schedule(a,()=>false,x=>results.push(x));await tick(5);c.schedule(b,()=>true,x=>results.push(x));await tick(80);
 assert.equal(max,1);assert.deepEqual(results,['stale','saved']);
});
