/** IP-010: repeatable editor history profiling, not a CI speed threshold. */
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {createDocument,newSlide} from '../src/core/model.ts';
import {EditorStore} from '../src/core/editor.ts';
import {updateSafety} from '../src/pwa/safety.ts';

const iterations=Number(process.env.SF_PROFILE_ITERATIONS??12);
if(!Number.isInteger(iterations)||iterations<1||iterations>100)throw Error('SF_PROFILE_ITERATIONS must be between 1 and 100');
const scenarios=[{slides:20,assetKiB:128},{slides:100,assetKiB:2048}];
const measurements=[];
for(const scenario of scenarios){
 const doc=createDocument();
 while(doc.slides.length<scenario.slides)doc.slides.push(newSlide(doc,'blank'));
 // Embedded payload is deliberately valid data URI and digest, not external network data.
 const bytes=Buffer.alloc(scenario.assetKiB*1024,73);
 const id='profile-image';
 doc.assets[id]={kind:'data',storage:'embedded',mimeType:'image/png',uri:'data:image/png;base64,'+bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex')};
 // Do not reference the generated asset as an image: this profiles document cloning and history.
 const store=new EditorStore(doc);
 updateSafety.setDirty(false);
 const times=[];
 const heapBefore=process.memoryUsage().heapUsed;
 for(let i=0;i<iterations;i++){
  const start=performance.now();
  store.updateDocument({title:'Profile '+i});
  times.push(performance.now()-start);
 }
 const heapAfter=process.memoryUsage().heapUsed;
 const startUndo=performance.now();store.undo();const undoMs=performance.now()-startUndo;
 const startRedo=performance.now();store.redo();const redoMs=performance.now()-startRedo;
 times.sort((a,b)=>a-b);
 measurements.push({
  slides:scenario.slides,embeddedAssetKiB:scenario.assetKiB,iterations,
  documentJSONBytes:Buffer.byteLength(JSON.stringify(store.getSnapshot().doc)),
  transactionMs:{median:times[Math.floor(times.length/2)],p95:times[Math.min(times.length-1,Math.ceil(.95*times.length)-1)],max:times.at(-1)},
  undoMs,redoMs,heapDeltaBytes:heapAfter-heapBefore,
  historyDepth:store.getSnapshot().undo
 });
}
console.log(JSON.stringify({name:'slide-fable-ip010-history',node:process.version,platform:process.platform,arch:process.arch,measurements},null,2));
