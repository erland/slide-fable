/** Executable inventory of blockers before making PPD 0.4.0 the default.
 * This gate is intentionally separate from format activation. */
import {createDocument} from './model.ts';
import {createPpd040,readPpd040Json,writePpd040Json} from './ppd040Document.ts';
import {inspectPpd040} from './ppd040Preflight.ts';
import {EditorStore} from './editor.ts';
import {validateCore,negotiate} from './contract.ts';

export type FormatGateCheck={id:string;passed:boolean;detail:string};
export function ppd040StandardGate():{ready:boolean;checks:FormatGateCheck[]}{
 const checks:FormatGateCheck[]=[];
 const check=(id:string,run:()=>boolean,detail:string)=>{
  try{checks.push({id,passed:run(),detail});}
  catch(e){checks.push({id,passed:false,detail:detail+': '+String(e)});}
 };
 check('standard-document-version',()=>createDocument().schemaVersion==='0.4.0','New presentations must default to PPD 0.4.0');
 check('canonical-schema-source',()=>false,'Canonical schemas/ppd.schema.json must be promoted from 0.3.1 proposal before activation');
 check('040-document-roundtrip',()=>{const d=createPpd040();return JSON.stringify(readPpd040Json(writePpd040Json(d)))===JSON.stringify(d);},'Standalone 0.4 JSON roundtrip');
 check('040-editor-core',()=>{const store=new EditorStore(createPpd040());store.add('shape');validateCore(store.getSnapshot().doc);return inspectPpd040(store.getSnapshot().doc).ready;},'0.4 editor transactions stay schema-valid');
 check('040-version-negotiation',()=>negotiate(createPpd040()).mode==='editable_candidate','Normal import negotiates editable PPD 0.4');
 return {ready:checks.every(c=>c.passed),checks};
}
