import {inspectPpd040} from './ppd040Preflight.ts';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import canonicalize from 'canonicalize';
import {parseFragment,parse} from 'parse5';
import {SVGPathData} from 'svg-pathdata';
import schema from '../../schemas/ppd.schema.json' with {type:'json'};
import originalSchema from '../../reference/ppd.schema.json' with {type:'json'};
import {allElements,blocks,copy,scenes,type D} from './model.ts';

export class PpdError extends Error{code:string;path:string;constructor(code:string,path=''){super(code+(path?': '+path:''));this.code=code;this.path=path;}}
const fail=(code:string,path=''):never=>{throw new PpdError(code,path);};
const ajv=new Ajv({allErrors:true,strict:false,allowUnionTypes:true});addFormats(ajv);
const validateSchema=ajv.compile(schema),validateOriginal=ajv.compile(originalSchema);
export const FEATURES=new Set(['ppd.core','ppd.rich-text','ppd.masters','ppd.semantic-diagram','ppd.equation','ppd.vector-path']);
const TYPES=new Set(schema.$defs.element.properties.type.enum);

/** Strict JSON tokenizer/parser with duplicate-key and depth limits; no eval. */
export function parseJson(raw:string):D{
 if(new TextEncoder().encode(raw).length>50*1024*1024)fail('FILE_LIMIT');let i=0,tokens=0;
 const whitespace=()=>{while(/\s/.test(raw[i]??'')&&i<raw.length)i++;};
 const string=()=>{const start=i++;while(i<raw.length){if(raw[i]==='\\'){i+=2;continue;}if(raw[i++]==='"')return JSON.parse(raw.slice(start,i));}return fail('JSON_SYNTAX');};
 const value=(depth:number):unknown=>{if(depth>128||++tokens>500000)fail('JSON_LIMIT');whitespace();const ch=raw[i];if(ch==='"')return string();if(ch==='{'){i++;const out:D=Object.create(null),seen=new Set();whitespace();if(raw[i]==='}'){i++;return out;}for(;;){whitespace();if(raw[i]!=='"')fail('JSON_SYNTAX');const key=string();if(seen.has(key))fail('JSON_DUPLICATE_KEY',key);seen.add(key);whitespace();if(raw[i++]!==':')fail('JSON_SYNTAX');out[key]=value(depth+1);whitespace();const end=raw[i++];if(end==='}')return out;if(end!==',')fail('JSON_SYNTAX');}}
 if(ch==='['){i++;const out:unknown[]=[];whitespace();if(raw[i]===']'){i++;return out;}for(;;){out.push(value(depth+1));whitespace();const end=raw[i++];if(end===']')return out;if(end!==',')fail('JSON_SYNTAX');}}
 const match=/^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(raw.slice(i));if(!match)fail('JSON_SYNTAX');i+=match![0].length;const v=JSON.parse(match![0]);if(typeof v==='number'&&(!Number.isFinite(v)||(!/[.eE]/.test(match![0])&&!Number.isSafeInteger(v))))fail('JSON_NUMBER');return v;};
 const result=value(0);whitespace();if(i!==raw.length||!result||typeof result!=='object'||Array.isArray(result))fail('JSON_SYNTAX');return result as D;
}
export async function hash(value:D){return bytesHash(new TextEncoder().encode(canonicalize(Object.fromEntries(Object.entries(value).filter(([k])=>k!=='build')))!));}
export async function bytesHash(bytes:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function safeUrl(value:string){if([...value].some(c=>c.charCodeAt(0)<=32||c==='\\')||!/^(https?:|mailto:|tel:)/i.test(value))fail('UNSAFE_URL');return value;}
function nodes(node:D):D[]{return [node,...(node.childNodes??[]).flatMap(nodes)];}
export function inspectSvg(source:string){
 if(source.length>1000000||/<!\s*(?:DOCTYPE|ENTITY)/i.test(source))fail('UNSAFE_SVG');const root=parseFragment(source) as unknown as D;
 const list=nodes(root),svg=list.find(n=>n.tagName);if(svg?.tagName!=='svg')fail('UNSAFE_SVG');
 const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc','defs','clipPath','linearGradient','radialGradient','stop']);
 const attrs=new Set(['xmlns','id','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','fill-rule','opacity','transform','offset','stop-color','stop-opacity','clip-path','gradientUnits','gradientTransform']);
 for(const node of list){if(node.tagName&&(!tags.has(node.tagName)||node.namespaceURI!=='http://www.w3.org/2000/svg'))fail('UNSAFE_SVG');for(const a of node.attrs??[]){if(!attrs.has(a.name)||(a.namespace&&a.name!=='xmlns')||a.value.includes('\\')||(a.name==='xmlns'&&a.value!=='http://www.w3.org/2000/svg')||(/url\s*\(/i.test(a.value)&&!/^url\(#[A-Za-z0-9_-]+\)$/.test(a.value)))fail('UNSAFE_SVG');if(a.name==='d')try{new SVGPathData(a.value);}catch{fail('SVG_PATH');}}}
 return source;
}
function unique(items:D[],path:string){const map=new Map<string,D>();for(const item of items){if(map.has(item.id))fail('DUPLICATE_ID',path);map.set(item.id,item);}return map;}
function acyclic(graph:Map<string,string[]>,code:string){const done=new Set(),active=new Set();const visit=(id:string)=>{if(active.has(id))fail(code);if(done.has(id))return;active.add(id);for(const next of graph.get(id)??[])visit(next);active.delete(id);done.add(id);};for(const key of graph.keys())visit(key);}
export function negotiate(model:D){
 if(model.format!=='ppd')return {mode:'blocked',code:'FORMAT'};
 if((model.document?.featureRequirements??[]).some((f:string)=>!FEATURES.has(f)))return {mode:'blocked',code:'REQUIRED_FEATURE'};
 if(!['0.3.0','0.3.1','0.4.0'].includes(model.schemaVersion))return {mode:'read_only',code:'UNVERIFIED_VERSION'};
 const min=model.minReaderVersion??'0.0.0';if(!/^\d+\.\d+\.\d+$/.test(min))return {mode:'blocked',code:'READER_VERSION'};const parts=min.split('.').map(Number);if(parts[0]>0||parts[1]>4||(parts[1]===4&&parts[2]>0))return {mode:'blocked',code:'READER_TOO_OLD'};
 if(allElements(model).some(e=>!TYPES.has(e.type)))return {mode:'read_only',code:'UNKNOWN_OBJECT'};
 if(allElements(model).some(e=>['area','scatter','combo'].includes(e.chartType)))return {mode:'read_only',code:'CHART_OUTSIDE_EDITOR_PROFILE'};
 return {mode:'editable_candidate',code:'VALIDATION_REQUIRED'};
}
export function migrate030(model:D){if(!validateOriginal(model))fail('SOURCE_SCHEMA');if(negotiate(model).mode!=='editable_candidate')fail('MIGRATION_UNSUPPORTED');const d=copy(model);for(const el of allElements(d)){if(el.box){if(el.geometry&&canonicalize(el.box)!==canonicalize(el.geometry))fail('GEOMETRY_CONFLICT',el.id);el.geometry=el.box;delete el.box;}}d.schemaVersion='0.3.1';delete d.build;validateCore(d);return d;}
export function validateCore(model:D){
 if(model.schemaVersion==='0.4.0'){const report=inspectPpd040(model);if(!report.ready)fail('SCHEMA_040',report.issues[0]?.path??'');}
 else if(!validateSchema(model))fail('SCHEMA',validateSchema.errors?.[0]?.instancePath??'');
 try{canonicalize(model);}catch{fail('CANONICAL_JSON');}
 const slides=unique(model.slides,'slides'),masters=unique(model.masters??[],'masters'),components=unique(model.components??[],'components'),elements=allElements(model),elementMap=unique(elements,'elements'),sections=unique(model.presentation.sections??[],'sections');
 if(elements.length>10000||model.slides.length>200)fail('DOCUMENT_LIMIT');
 if(model.presentation.initialSlideId&&!slides.has(model.presentation.initialSlideId))fail('SLIDE_REF');const dm=model.document.defaultMasterId,dl=model.document.defaultLayoutId;if(dm&&!masters.has(dm))fail('MASTER_REF');if(dl&&(!dm||!masters.get(dm)!.layouts.some((l:D)=>l.id===dl)))fail('LAYOUT_REF');
 for(const m of masters.values()){unique(m.layouts,'layouts');if(m.themeRef&&m.themeRef!==model.theme.id)fail('THEME_REF');for(const l of m.layouts)unique(l.placeholders??[],'placeholders');}
 for(const c of components.values())unique(c.slots??[],'slots');
 for(const scene of scenes(model)){const map=new Map((scene.elements??[]).map((e:D)=>[e.id,e])),parents=new Set(),graph=new Map<string,string[]>();
  for(const el of (scene.elements??[]) as D[]){for(const a of ['startAnchor','endAnchor'])if(el[a]&&!map.has(el[a].elementId))fail('ANCHOR_REF');if(el.styleRef&&!model.theme.styles?.[el.styleRef])fail('STYLE_REF');if(el.componentId&&!components.has(el.componentId))fail('COMPONENT_REF');if(el.type==='group'){graph.set(el.id,el.children);for(const child of el.children){if(!map.has(child))fail('CHILD_REF');if(parents.has(child))fail('MULTIPLE_PARENT');parents.add(child);}}}
  acyclic(graph,'GROUP_CYCLE');const order=scene.accessibilityOrder??[];if(order.length!==new Set(order).size||order.some((id:string)=>!map.has(id)))fail('READING_ORDER');
 }
 acyclic(new Map([...components].map(([id,c])=>[id,(c.elements??[]).filter((e:D)=>e.componentId).map((e:D)=>e.componentId)])),'COMPONENT_CYCLE');
 for(const s of model.slides as D[]){if(s.sectionId&&!sections.has(s.sectionId))fail('SECTION_REF');const mid=s.masterId??dm;if(mid&&!masters.has(mid))fail('MASTER_REF');const lid=s.layoutId??dl,layouts=masters.get(mid)?.layouts??[];if(lid&&!layouts.some((l:D)=>l.id===lid))fail('LAYOUT_REF');const bm=unique(blocks(s),'content');
  const content=(ref:string)=>{if(bm.has(ref))return;const [id,field]=ref.split('#');if(!bm.has(id)||!['text','body','title'].includes(field)||bm.get(id)![field]===undefined)fail('CONTENT_REF',ref);};
  for(const e of s.view.elements)if(e.contentRef)content(e.contentRef);const seen=new Set();const phs=new Set(layouts.find((l:D)=>l.id===lid)?.placeholders?.map((p:D)=>p.id)??[]);for(const b of s.placeholderBindings??[]){if(seen.has(b.placeholderId))fail('BINDING_DUPLICATE');seen.add(b.placeholderId);if(!phs.has(b.placeholderId))fail('PLACEHOLDER_REF');if(b.contentRef)content(b.contentRef);if(b.elementId&&!s.view.elements.some((e:D)=>e.id===b.elementId))fail('ELEMENT_REF');}for(const f of s.delivery?.fragments??[])if(!s.view.elements.some((e:D)=>e.id===f.elementId))fail('FRAGMENT_REF');
 }
 for(const el of elements){
  if(el.geometry?.unit&&el.geometry.unit!=='logical')fail('GEOMETRY_UNIT');
  if(el.type==='semanticDiagram'){const d=el.semanticDiagram,nm=unique(d.nodes,'nodes');unique(d.edges??[],'edges');const graph=new Map<string,string[]>();for(const e of d.edges??[]){if(!nm.has(e.from)||!nm.has(e.to))fail('DIAGRAM_REF');graph.set(e.from,[...(graph.get(e.from)??[]),e.to]);}if(['hierarchy','org-chart'].includes(d.kind))acyclic(graph,'HIERARCHY_CYCLE');}
  if(el.type==='vectorPath'){if(el.vectorPath.format==='svg-document')inspectSvg(el.vectorPath.svg);else try{new SVGPathData(el.vectorPath.pathData);}catch{fail('SVG_PATH');}}
  if(el.type==='chart'){const d=el.dataset;unique(d.columns??[],'columns');unique(d.series??[],'series');if(d.columns&&d.rows?.some((r:D[])=>r.length!==d.columns.length))fail('DATASET_SHAPE');if(d.categories&&d.series?.some((s:D)=>s.values.length!==d.categories.length))fail('DATASET_SHAPE');}
  for(const action of el.actions??[]){const required:D={'navigate-slide':'targetId','open-url':'url','show-hide':'targetId','play-media':'targetId','set-state':'stateKey'};if(action[required[action.kind]]===undefined)fail('ACTION_PAYLOAD');if(action.kind==='navigate-slide'&&!slides.has(action.targetId))fail('ACTION_REF');if(['show-hide','play-media'].includes(action.kind)&&!elementMap.has(action.targetId))fail('ACTION_REF');if(action.kind==='play-media'&&elementMap.get(action.targetId)?.type!=='media')fail('ACTION_MEDIA_TYPE');}
 }
 const walk=(value:unknown,path='')=>{if(Array.isArray(value)){value.forEach((v,i)=>walk(v,path+'/'+i));return;}if(!value||typeof value!=='object')return;const obj=value as D;if(path.endsWith('/text')&&obj.paragraphs)unique(obj.paragraphs,path);for(const [k,v] of Object.entries(obj)){if(['extensions','generation','provenance'].includes(k))continue;if(['assetRef','posterAssetRef','fallbackAssetRef','renderedAssetRef','captionsAssetRef'].includes(k)&&!model.assets[v])fail('ASSET_REF');if(['link','url'].includes(k)&&typeof v==='string')safeUrl(v);walk(v,path+'/'+k);}};walk(model);return model;
}
export function assetBytes(asset:D){const m=/^data:([^;,]+);base64,([A-Za-z0-9+/=]*)$/.exec(asset.uri??'');if(!m||m[1]!==asset.mimeType)fail('ASSET_ENCODING');try{return Uint8Array.from(atob(m![2]),c=>c.charCodeAt(0));}catch{return fail('ASSET_ENCODING');}}
export async function validateAssets(doc:D,offline=false){let total=0;for(const [id,a] of Object.entries(doc.assets) as [string,D][]){if(a.storage!=='embedded'){if(offline)fail('EXTERNAL_RESOURCE',id);continue;}const bytes=assetBytes(a);const ascii=(start:number,end:number)=>new TextDecoder().decode(bytes.slice(start,end));
 if(a.mimeType==='image/png'&&(bytes.length<24||bytes[0]!==137||ascii(1,4)!=='PNG'))fail('ASSET_SIGNATURE',id);
 if(a.mimeType==='image/png'){const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(dv.getUint32(16)*dv.getUint32(20)>40000000)fail('ASSET_PIXELS',id);}
 if(a.mimeType==='image/jpeg'&&(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255))fail('ASSET_SIGNATURE',id);
 if(a.mimeType==='image/webp'&&(ascii(0,4)!=='RIFF'||ascii(8,12)!=='WEBP'))fail('ASSET_SIGNATURE',id);
 if(a.mimeType==='font/woff2'&&ascii(0,4)!=='wOF2')fail('ASSET_SIGNATURE',id);
 if(a.mimeType==='font/ttf'&&!(bytes[0]===0&&bytes[1]===1&&bytes[2]===0&&bytes[3]===0))fail('ASSET_SIGNATURE',id);
 total+=bytes.length;if(bytes.length>10*1024*1024||total>25*1024*1024)fail('ASSET_LIMIT',id);if(a.sha256&&await bytesHash(bytes)!==a.sha256)fail('ASSET_HASH',id);if(offline&&!a.sha256)fail('ASSET_HASH',id);if(a.mimeType==='image/svg+xml')inspectSvg(new TextDecoder().decode(bytes));if(!['image/png','image/jpeg','image/webp','image/svg+xml','font/woff2','font/ttf'].includes(a.mimeType)&&offline)fail('ASSET_MIME',id);}}
export async function validateFull(doc:D,profile='core'){validateCore(doc);await validateAssets(doc);if(profile==='offline-single-file'){if(!doc.provenance||!doc.build?.selfContained)fail('PUBLISH_METADATA');if(allElements(doc).some(e=>!e.geometry))fail('PUBLISH_GEOMETRY');await validateAssets(doc,true);if(await hash(doc)!==doc.build.sourceModelHash)fail('MODEL_HASH');}return doc;}
export async function importDocument(raw:string){
 if(new TextEncoder().encode(raw).length>50*1024*1024)fail('FILE_LIMIT');
 let json=raw;if(!raw.trimStart().startsWith('{')){const tree=parse(raw) as unknown as D;const scripts=nodes(tree).filter(n=>n.tagName==='script'&&n.attrs?.some((a:D)=>a.name==='id'&&a.value==='ppd-data'));if(scripts.length!==1||!scripts[0].attrs.some((a:D)=>a.name==='type'&&a.value==='application/json'))fail('PPD_MARKER');json=(scripts[0].childNodes??[]).map((n:D)=>n.value??'').join('');}
 const source=parseJson(json);let doc=copy(source);if(!Array.isArray(doc.slides)||!doc.document||!doc.assets)fail('SCHEMA');if(['0.1.0','0.2.0'].includes(doc.schemaVersion)){try{const {migrateLegacy}=await import('./legacy.ts');const migrated=migrateLegacy(doc);await validateAssets(migrated.doc);return {doc:migrated.doc,readOnly:false,original:raw,warnings:['MIGRATED_RESTRICTED_LEGACY_PROFILE',...migrated.changes]};}catch{/* never guess an unsupported legacy structure */}}
 const mode=negotiate(doc);if(mode.mode==='blocked')fail(mode.code);if(doc.schemaVersion==='0.3.0'&&mode.mode==='editable_candidate')doc=migrate030(doc);
 if(mode.mode==='read_only'){const inspection=copy(doc);inspection.schemaVersion='0.3.1';for(const scene of scenes(inspection))scene.elements=(scene.elements??[]).map((e:D)=>TYPES.has(e.type)?e:{id:e.id,type:'shape',geometry:e.geometry,fallbackAssetRef:e.fallbackAssetRef});validateCore(inspection);await validateAssets(inspection);return {doc:inspection,readOnly:true,original:raw,warnings:[mode.code]};}
 validateCore(doc);await validateAssets(doc);return {doc,readOnly:false,original:raw,warnings:doc===source?[]:source.schemaVersion!==doc.schemaVersion?['MIGRATED_030']:[]};
}
