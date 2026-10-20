/** Export orchestration: presentation snapshot, safety guard, artifacts and reports. */
import {copy,type D} from '../core/model.ts';
import {validateFull} from '../core/contract.ts';
import {download,imageExport,standaloneHtml} from './html.tsx';
import {preflight} from './plan.ts';
import {writePdf} from './adapters/pdf.ts';
import {writePptx} from './adapters/pptx.ts';
import {updateSafety} from '../pwa/safety.ts';

export type ExportFormat='html'|'png'|'jpg'|'pdf'|'pptx';
export type ExportOptions={doc:D;slideId:string;scope:string;format:string;profile:string;includePrivate:boolean;imageWidth:number};

/** Save the editable self-contained HTML, acknowledging only the exported revision. */
export async function saveStandaloneHtml(doc:D,acknowledge:(revision:number)=>void){
 const end=updateSafety.beginOperation();
 try{
  const html=await standaloneHtml(doc,true);
  download(html,doc.document.title+'.html','text/html');
  acknowledge(Number(doc.document.revision??0));
 }finally{end();}
}

/** Export a stable snapshot and its loss report using the existing export engines. */
export async function exportPresentation(options:ExportOptions):Promise<D>{
 const end=updateSafety.beginOperation();
 try{
  const {slideId,scope,format,profile,includePrivate,imageWidth}=options;
  const source=copy(options.doc);
  const slides=source.slides.filter((s:D)=>!s.hidden&&(scope==='all'||s.id===slideId));
  if(!slides.length)throw Error('Minst en synlig bild behövs.');
  await validateFull(source);
  let result:D;
  if(format==='html'){
   download(await standaloneHtml(source,includePrivate),source.document.title+'.html','text/html');
   result=preflight(source,'html');
  }else if(format==='png'||format==='jpg'){
   download(await imageExport(source,slides,imageWidth,format),source.document.title+'-'+format+'.zip');
   result=preflight({...source,slides},format);
  }else if(format==='pdf'||format==='pptx'){
   const output=await (format==='pdf'?writePdf:writePptx)(source,slides,profile,includePrivate);
   download(output.file,source.document.title+'.'+format);
   result=output.report;
  }else throw Error('Okänt exportformat: '+format);
  const json=JSON.stringify(result,null,2);
  download(json,source.document.title+'-exportrapport.json','application/json');
  return result;
 }finally{end();}
}
