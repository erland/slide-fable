/** PPD 0.4 document creation and strict JSON read/write boundary. */
import {createDocument,copy,type D} from './model.ts';
import {parseJson,PpdError} from './contract.ts';
import {inspectPpd040} from './ppd040Preflight.ts';

export function createPpd040():D{
 const report=inspectPpd040(createDocument());
 if(!report.ready||!report.document)throw new PpdError('PPD_040_GENERATION',report.issues[0]?.path??'');
 return report.document;
}

/** Read a complete JSON document, never silently reinterpret unsupported versions.
 * The returned document is detached from the parsed source. */
export function readPpd040Json(raw:string):D{
 const parsed=parseJson(raw);
 if(parsed.schemaVersion!=='0.4.0')throw new PpdError('PPD_040_VERSION','/schemaVersion');
 const report=inspectPpd040(parsed);
 if(!report.ready||!report.document)throw new PpdError('PPD_040_INVALID',report.issues[0]?.path??'');
 return copy(report.document);
}

export function writePpd040Json(doc:D):string{
 if(doc.schemaVersion!=='0.4.0')throw new PpdError('PPD_040_VERSION','/schemaVersion');
 const report=inspectPpd040(doc);
 if(!report.ready||!report.document)throw new PpdError('PPD_040_INVALID',report.issues[0]?.path??'');
 return JSON.stringify(report.document,null,2);
}
