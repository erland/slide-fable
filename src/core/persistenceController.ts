import type {D} from './model.ts';
import {saveDraft} from './persistence.ts';

type PersistOutcome = 'saved' | 'stale' | 'conflict' | 'error';
export type PersistNotice = (outcome:PersistOutcome,error?:unknown)=>void;
/** Owns debounce, sequential compare-and-swap writes and restored draft versions. */
export class DraftPersistenceController {
 private readonly writer=crypto.randomUUID();
 private versions=new Map<string,number>();
 private lastSaved:D|null=null;
 private pending:ReturnType<typeof setTimeout>|undefined;
 private queue:Promise<void>=Promise.resolve();
 private readonly save:typeof saveDraft;
 private readonly delayMs:number;
 constructor(save:typeof saveDraft=saveDraft,delayMs=600){this.save=save;this.delayMs=delayMs;}
 hasSaved(doc:D){return this.lastSaved===doc;}
 restore(doc:D,version:number){this.cancel();this.versions.set(doc.document.id,version);this.lastSaved=doc;}
 cancel(){if(this.pending!==undefined)clearTimeout(this.pending);this.pending=undefined;}
 schedule(doc:D,acknowledge:(doc:D)=>boolean,notice:PersistNotice){
  this.cancel();
  this.pending=setTimeout(()=>{
   this.pending=undefined;
   this.queue=this.queue.then(async()=>{
    try{
     const version=await this.save(doc,this.versions.get(doc.document.id)??null,this.writer);
     this.versions.set(doc.document.id,version);this.lastSaved=doc;
     notice(acknowledge(doc)?'saved':'stale');
    }catch(error){notice(String(error).includes('CONFLICT')?'conflict':'error',error);}
   });
  },this.delayMs);
 }
}
