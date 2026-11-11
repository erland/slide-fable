/**
 * SF-QUAL-10: compare separately-rendered editor/Poppler reference images.
 * Reports are diagnostic, never PASS/FAIL statements about Office rendering.
 *
 * Usage: node scripts/report_export_fidelity.mjs <export-acceptance-directory>
 */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {compareRgb} from './export_fidelity_metrics.mjs';
const checksum=buffer=>createHash('sha256').update(buffer).digest('hex');
const localPath=path.resolve(process.argv[2]??(process.env.EDITOR_OUTPUT?path.join(process.env.EDITOR_OUTPUT,'export-acceptance'):'export-acceptance'));
export async function makeExportFidelityReport(folder=localPath){
 const root=path.resolve(folder);
 const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
 const pdfPreviews=new Map((manifest.previews??[]).map(p=>[p.slideId,p.file]));
 const editorPreviews=manifest.editorPreviews??[];
 if(editorPreviews.length!==manifest.expectedSlides||pdfPreviews.size!==manifest.expectedSlides)throw Error('REFERENCE_PAIRS_INCOMPLETE');
 const results=[],newFiles={};
 for(const {slideId,file:editorFile} of editorPreviews){
  const pdfFile=pdfPreviews.get(slideId);
  if(!pdfFile)throw Error('REFERENCE_SLIDE_MISMATCH: '+slideId);
  for(const name of [editorFile,pdfFile])if(!/^((editor|pdf)-reference-[1-9][0-9]*\.png)$/.test(name))throw Error('INVALID_REFERENCE_NAME');
  const editorBytes=await readFile(path.join(root,editorFile));
  const pdfBytes=await readFile(path.join(root,pdfFile));
  // Check manifest integrity before using files for a visual diagnostic.
  for(const [name,bytes] of [[editorFile,editorBytes],[pdfFile,pdfBytes]]){
   if(manifest.files?.[name]?.sha256!==checksum(bytes))throw Error('REFERENCE_CHECKSUM_MISMATCH: '+name);
  }
  const editor=await sharp(editorBytes).flatten({background:'#ffffff'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const pdf=await sharp(pdfBytes).flatten({background:'#ffffff'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(editor.info.width!==pdf.info.width||editor.info.height!==pdf.info.height)throw Error('REFERENCE_IMAGE_SIZE_MISMATCH: '+slideId);
  const {difference,...metrics}=compareRgb(editor.data,pdf.data,editor.info.width,editor.info.height,24);
  const number=results.length+1;
  const diffFile='difference-'+number+'.png';
  const diffBytes=await sharp(difference,{raw:{width:metrics.width,height:metrics.height,channels:3}}).png().toBuffer();
  await writeFile(path.join(root,diffFile),diffBytes);
  newFiles[diffFile]={sha256:checksum(diffBytes),size:diffBytes.length};
  results.push({slideId,editorReference:editorFile,pdfReference:pdfFile,differenceImage:diffFile,metrics});
 }
 const report={schemaVersion:1,scenario:'SF-QUAL-10',assessment:'DIAGNOSTIC_ONLY',
  sourceCommit:manifest.sourceCommit??null,
  scope:'Editor canvas via Chromium compared with PDF raster from Poppler; neither is PowerPoint',
  method:'Per-pixel RGB comparison after alpha flattening to white. A pixel differs when any RGB channel differs by more than 24/255. Edges and font rasterization contribute to these values.',
  slides:results,manualChecks:['RG-006','RG-008'],releaseReadiness:'NOT_READY'};
 const json=Buffer.from(JSON.stringify(report,null,2)+'\n');
 await writeFile(path.join(root,'difference-report.json'),json);
 const rows=results.map(r=>`| ${r.slideId} | ${r.metrics.meanAbsoluteChannelError} | ${r.metrics.changedPixelPercent}% | ${r.metrics.maxChannelError} | [Editor](${r.editorReference}) · [PDF](${r.pdfReference}) · [Skillnad](${r.differenceImage}) |`);
 const md=Buffer.from([
  '# SF-QUAL-10 – redigerare kontra PDF',
  '',
  '**Diagnostik, inte godkänd exportacceptans.** Bilderna kommer från olika renderare: Chromium-redigeraren och Poppler-rasteriserad PDF. Ingen PowerPoint-rendering ingår.',
  '',
  'En pixel räknas som avvikande om minst en RGB-kanal skiljer sig mer än 24 steg på skalan 0–255. Måtten är beskrivande, inte beslutade toleransgränser. Textkantutjämning påverkar utfallet.',
  '',
  '| Bild-ID | Medelfel per kanal | Andel avvikande pixlar | Största kanalavvikelse | Referenser |',
  '|---|---:|---:|---:|---|',
  ...rows,'',
  '**Tolkning:** rött i skillnadsbilden visar var toleransen överskrids; ljusgrått ligger inom tolerans. Granska bildpar och objektens placering manuellt innan slutsatser dras.',
  '',
  '**Öppna grindar:** RG-006 (PowerPoint Mac/Windows), RG-008 (oberoende PDF-läsare). Release: NOT_READY.',''
 ].join('\n'));
 await writeFile(path.join(root,'difference-report.md'),md);
 // Keep the existing file hashes intact and add generated diagnostic artifacts.
 manifest.differenceReport={json:'difference-report.json',markdown:'difference-report.md',assessment:'DIAGNOSTIC_ONLY',perSlide:results.map(r=>({slideId:r.slideId,image:r.differenceImage}))};
 Object.assign(manifest.files,newFiles,{
  'difference-report.json':{sha256:checksum(json),size:json.length},
  'difference-report.md':{sha256:checksum(md),size:md.length}
 });
 await writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return report;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 try{
  const report=await makeExportFidelityReport();
  console.log('PASS created diagnostic comparison for '+report.slides.length+' slides (no visual acceptance asserted)');
 }catch(error){console.error(error);process.exitCode=1;}
}
