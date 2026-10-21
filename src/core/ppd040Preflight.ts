/** Isolated PPD 0.4 readiness checks, independent of the active 0.3.1 editor. */
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import proposal from '../../proposals/ppd-0.4.0.schema.json' with {type:'json'};
import {allElements,copy,type D} from './model.ts';
import {stagePpd040} from './ppd040Staging.ts';

const ajv=new Ajv({strict:false,allErrors:true,allowUnionTypes:true});
addFormats(ajv);
const validateProposal=ajv.compile(proposal);

export type Ppd040Issue={code:string;path:string;message:string};
export type Ppd040Report={ready:boolean;issues:Ppd040Issue[];document:D|null};

export function inspectPpd040(source:D):Ppd040Report{
 const issues:Ppd040Issue[]=[];
 let document:D|null=null;
 try{
  document=source.schemaVersion==='0.3.1'?stagePpd040(source):
   source.schemaVersion==='0.4.0'?copy(source):null;
  if(!document){issues.push({code:'UNSUPPORTED_VERSION',path:'/schemaVersion',message:'Requires PPD 0.3.1 or 0.4.0.'});return {ready:false,issues,document:null};}
 }catch(e){
  issues.push({code:'STAGING_FAILED',path:'/',message:e instanceof Error?e.message:String(e)});
  return {ready:false,issues,document:null};
 }
 if(!validateProposal(document))for(const error of validateProposal.errors??[])
  issues.push({code:'SCHEMA_040',path:error.instancePath||'/',message:error.message??'Invalid field'});
 const ids=new Set<string>();
 for(const e of allElements(document)){
  if(ids.has(e.id))issues.push({code:'DUPLICATE_ELEMENT_ID',path:'/slides',message:e.id});
  ids.add(e.id);
 }
 for(const [index,slide] of document.slides.entries())for(const [n,animation] of (slide.animations??[]).entries())
  if(!ids.has(animation.targetId))issues.push({code:'ANIMATION_TARGET_MISSING',path:`/slides/${index}/animations/${n}/targetId`,message:animation.targetId});
 return {ready:issues.length===0,issues,document};
}
