import {copy,scenes,type D} from './model.ts';
import {validateCore,PpdError} from './contract.ts';
/** Explicit, restricted profile derived from the bundled 0.1/0.2 prose examples.
 * Unsupported fields fail validation; callers retain the original read-only.
 */
export function migrateLegacy(source:D){if(!['0.1.0','0.2.0'].includes(source.schemaVersion))throw new PpdError('MIGRATION_UNSUPPORTED');const d=copy(source),changes:string[]=[];d.schemaVersion='0.3.1';d.theme??={};if(!d.theme.id){d.theme.id='legacy-theme';changes.push('theme.id added');}for(const master of d.masters??[]){master.name??=master.id;for(const layout of master.layouts??[])layout.name??=layout.id;}
 const text=(value:D|string|undefined)=>{if(value&&typeof value==='object')for(const p of value.paragraphs??[])for(const run of p.runs??[])if(Array.isArray(run.marks)){run.marks=Object.fromEntries(run.marks.map((m:string)=>[m,true]));changes.push('marks array to object');}};
 const content=(bs:D[])=>{for(const b of bs){if(b.type&&!b.kind){b.kind=b.type;delete b.type;changes.push('content type to kind');}text(b.text);content(b.children??[]);}};
 for(const slide of d.slides??[])content(slide.content?.blocks??[]);
 for(const scene of scenes(d))for(const e of scene.elements??[]){if(e.box){if(e.geometry&&JSON.stringify(e.box)!==JSON.stringify(e.geometry))throw new PpdError('GEOMETRY_CONFLICT');e.geometry=e.box;delete e.box;changes.push('box to geometry');}if(e.assetId&&!e.assetRef){e.assetRef=e.assetId;delete e.assetId;changes.push('assetId to assetRef');}if(e.editability==='raster'){e.editability='rasterized';changes.push('editability raster to rasterized');}text(e.text);}
 delete d.build;validateCore(d);return {doc:d,changes:[...new Set(changes)]};}
