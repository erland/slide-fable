import {filterIcons,iconElement,type IconGroup} from '../core/iconCatalog';
import {isPolygonShape,shapePolygonPoints} from '../core/shapeGeometry';
import {AnimationPanel} from './AnimationPanel';
import {RibbonMotion} from './RibbonMotion';
import {PresentationSlide} from './PresentationSlide';
import {playbackSteps} from '../core/playback';
import {SlideOverview,ReuseSlidePicker} from './SlideOverview';
import {SlideFilmstrip} from './SlideFilmstrip';
import {DesignGallery} from './DesignGallery';
import {MasterLayoutEditor} from './MasterLayoutEditor';
import {updateLayoutName,setTemplateBackground,updatePlaceholderGeometry,duplicateLayout} from '../core/masterLayoutControls';
import {RibbonDesign} from './RibbonDesign';
import {designTemplate} from '../core/designGallery';
import {ImageCropEditor} from '../editor/ImageCropEditor';
import {MultiSelectionFormatting} from './MultiSelectionFormatting';
import {ObjectTextFormatting} from './ObjectTextFormatting';
import {RibbonFormatting} from './RibbonFormatting';
import {RibbonDataTools} from './RibbonDataTools';
import {textOverflowOptions,textOverflowPolicy,type TextOverflowPolicy} from '../core/textOverflowControls';
import {currentStrokeStyle,currentEndMarkers,editStrokeStyle,editEndMarker} from '../core/contourControls';
import {useEffect,useRef,useState,useSyncExternalStore,type PointerEvent} from 'react';
import {editorStore as store} from '../core/editor';
import {resolveSelection,movableSelection,marqueeBounds,marqueeCandidates,shouldStartMarquee,type SelectionRect} from '../core/selection';
import {resizeRect,resizeDirections,lineBounds,moveEndpoint,type ResizeDirection} from '../core/geometry';
import {selectionBounds,snapSelectionScaleFromCorner,type ArrangeItem,type ScaleCorner} from '../core/arrange';
import {snapTranslation,snapResize,type AlignmentGuides} from '../core/smartGuides';
import {markerGeometry,markerSvgPoints,endMarkers} from '../core/endMarkers';
import {resolveLinePoints,nearestPort} from '../core/connectors';
import {box,copy,createDocument,effective,plain,textOf,uid,type D} from '../core/model';
import {readOutline,patchOutline} from '../core/outline';
import {bytesHash,importDocument,validateFull} from '../core/contract';
import {deleteDraft,listDrafts,type Draft} from '../core/persistence';
import {DraftPersistenceController} from '../core/persistenceController';
import {saveAsDocument} from '../core/documentFileActions';
import {SlideView} from '../editor/Renderer';
import {TableEditor,ChartEditor,DiagramEditor} from '../editor/ObjectEditors';
import {RichEditor} from '../editor/RichEditor';
import {download} from '../export/html';
import {saveStandaloneHtml,exportPresentation} from '../export/exportController';
import {applyUpdate,checkForUpdate,initializePwa,pwaStatus} from '../pwa/client';
import {updateSafety} from '../pwa/safety';
import {externalRichText,transferableImage,hasExternalContent} from '../core/externalTransfer';
import './editor.css';
function audienceDoc(doc:D){const d=copy(doc);for(const s of d.slides)if(s.delivery)delete s.delivery.speakerNotes;delete d.provenance;return d;}
const shapeChoices=[{id:'rect',label:'Rektangel'},{id:'round',label:'Rundad rektangel'},{id:'ellipse',label:'Ellips'},{id:'triangle',label:'Triangel'},{id:'diamond',label:'Romb (beslut)'},{id:'hexagon',label:'Sexhörning'},{id:'pentagon',label:'Femhörning'},{id:'chevron',label:'Chevron (flödessteg)'},{id:'line',label:'Linje'},{id:'arrow',label:'Pil'}] as const;
function ShapeIcon({kind}:{kind:typeof shapeChoices[number]['id']}){return <svg aria-hidden="true" viewBox="0 0 48 32" width="48" height="32" fill="none" stroke="currentColor" strokeWidth="2">{kind==='rect'?<rect x="6" y="5" width="36" height="22"/>:kind==='round'?<rect x="6" y="5" width="36" height="22" rx="7"/>:kind==='ellipse'?<ellipse cx="24" cy="16" rx="18" ry="11"/>:kind==='triangle'?<path d="M24 4 L44 28 H4 Z"/>:isPolygonShape(kind)?<polygon points={shapePolygonPoints(kind,36,22).split(' ').map(point=>{const [a,b]=point.split(',').map(Number);return `${a+6},${b+5}`;}).join(' ')}/>:kind==='line'?<path d="M4 26 L44 6"/>:<path d="M4 26 L44 6 M33 5 L44 6 L40 17"/>}</svg>;}
function JsonField({label,value,onSave}:{label:string;value:unknown;onSave:(v:D)=>void}){const [input,setInput]=useState(JSON.stringify(value,null,2)),[error,setError]=useState('');useEffect(()=>setInput(JSON.stringify(value,null,2)),[value]);return <label>{label}<textarea value={input} rows={7} spellCheck={false} onChange={e=>setInput(e.target.value)}/><button onClick={()=>{try{onSave(JSON.parse(input));setError('');}catch(e){setError(String(e));}}}>Tillämpa {label.toLowerCase()}</button>{error&&<span role="alert">{error}</span>}</label>;}
function NumberField({name,value,onChange,min}:{name:string;value:number;onChange:(n:number)=>void;min?:number}){return <label>{name}<input aria-label={name} type="number" key={value} defaultValue={Math.round(value*100)/100} min={min} onBlur={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n!==value&&(min===undefined||n>=min))onChange(n);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;}
export function App(){
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot),pwa=useSyncExternalStore(pwaStatus.subscribe,pwaStatus.getSnapshot),safety=useSyncExternalStore(updateSafety.subscribe,updateSafety.getSnapshot);
 const doc=state.doc,slide=store.slide,element=slide.view?.elements?.find((e:D)=>e.id===state.selected[0]),selected=element?effective(doc,slide,element):undefined;
 const [reuseSource,setReuseSource]=useState<D|null>(null);
 const [reuseError,setReuseError]=useState('');
 const [saveAsTitle,setSaveAsTitle]=useState('');
 const [saveAsError,setSaveAsError]=useState('');
 const [draftAction,setDraftAction]=useState<{kind:'restore'|'delete';id:string}|null>(null);
 const [draftError,setDraftError]=useState('');
 const reuseFile=useRef<HTMLInputElement>(null);
 const [editingTextId,setEditingTextId]=useState<string|null>(null);
 const [alignmentGuides,setAlignmentGuides]=useState<AlignmentGuides>({});
 const [selectionMarquee,setSelectionMarquee]=useState<SelectionRect|null>(null);
 const [marqueeCandidateIds,setMarqueeCandidateIds]=useState<string[]>([]);
 const [touchMarqueeMode,setTouchMarqueeMode]=useState(false);
 const [ribbonTab,setRibbonTab]=useState('Start');
 const [iconSearch,setIconSearch]=useState('');
 const [iconGroup,setIconGroup]=useState<IconGroup>('Alla');
 const [objectMenu,setObjectMenu]=useState<{id:string;x:number;y:number}|null>(null);
 const [ribbonExpanded,setRibbonExpanded]=useState(true);
 const [showSlides,setShowSlides]=useState(true),[showProperties,setShowProperties]=useState(true),[showNotes,setShowNotes]=useState(false);
 const [message,setMessage]=useState(''),[panel,setPanel]=useState('canvas'),[tab,setTab]=useState('object'),[zoom,setZoom]=useState(1),[width,setWidth]=useState(800),[height,setHeight]=useState(600),[drafts,setDrafts]=useState<Draft[]>([]),[draftStatus,setDraftStatus]=useState('Arbetskopian är lokal'),[conflict,setConflict]=useState(false),[dialog,setDialog]=useState(''),[format,setFormat]=useState('html'),[profile,setProfile]=useState('editable-first'),[includePrivate,setIncludePrivate]=useState(true),[imageWidth,setImageWidth]=useState(1600),[exportScope,setExportScope]=useState('all'),[report,setReport]=useState(''),[present,setPresent]=useState(false),[animationPreview,setAnimationPreview]=useState(false),[previewStep,setPreviewStep]=useState(0),[black,setBlack]=useState(false),[fragment,setFragment]=useState(0),[elapsed,setElapsed]=useState(0),[search,setSearch]=useState(''),[replacement,setReplacement]=useState(''),[dark,setDark]=useState(false),[snap,setSnap]=useState(true),[online,setOnline]=useState(navigator.onLine);
 useEffect(()=>{if(state.selected.length) setTab(current=>current==='animations'?'animations':'object');},[state.selected.join('|')]);
 useEffect(()=>{if(!state.selected.length&&ribbonTab==='Formatera')setRibbonTab('Start');},[state.selected.length,ribbonTab]);
 const replaceImage=useRef(false);
 const file=useRef<HTMLInputElement>(null),image=useRef<HTMLInputElement>(null),viewport=useRef<HTMLDivElement>(null),modal=useRef<HTMLDialogElement>(null),clipboard=useRef<D|null>(null),paint=useRef<D|null>(null),persistence=useRef<DraftPersistenceController>(null!),channel=useRef<BroadcastChannel|null>(null),isAudience=new URLSearchParams(location.search).has('audience');
 persistence.current??=new DraftPersistenceController();
 const scale=Math.min(1,Math.max(1,width-40)/doc.document.canvas.width,Math.max(1,height-40)/doc.document.canvas.height)*zoom;
 const run=(fn:()=>void)=>{try{fn();}catch(e){setMessage(String(e));}};
 const openObjectMenu=(id:string,x:number,y:number)=>{
  if(!state.selected.includes(id))store.select([id]);
  setObjectMenu({id,x:Math.max(8,Math.min(x,window.innerWidth-230)),y:Math.max(8,Math.min(y,window.innerHeight-340))});
 };
 const menuAction=(action:()=>void)=>{setObjectMenu(null);run(action);};
 useEffect(()=>{if(!objectMenu)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setObjectMenu(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[objectMenu]);
 const openProperties=(section:'object'|'design'|'animations')=>{setTab(section);setShowProperties(true);setPanel('properties');};
 const commands={
 undo:{label:'Ångra',disabled:!state.undo||state.readOnly,execute:()=>run(()=>store.undo())},
 redo:{label:'Gör om',disabled:!state.redo||state.readOnly,execute:()=>run(()=>store.redo())},
 copy:{label:'Kopiera',disabled:!state.selected.length,execute:()=>{clipboard.current=store.copySelected();setMessage('Objekten är kopierade inom Slide Fable.');}},
 paste:{label:'Klistra in',disabled:state.readOnly||safety.locked||safety.busy,execute:()=>void pasteFromButton()},
 animations:{label:'Övergångar och animeringar',disabled:false,execute:()=>openProperties('animations')},
 present:{label:'Presentera',disabled:false,execute:()=>{setPresent(true);setFragment(0);}},
 newSlide:{label:'Ny bild',disabled:state.readOnly,execute:()=>run(()=>store.addSlide('content'))},
 line:{label:'Linje',disabled:state.readOnly,execute:()=>run(()=>store.add('line'))},
 arrow:{label:'Pil',disabled:state.readOnly,execute:()=>run(()=>store.add('arrow'))},
 shape:{label:'Form',disabled:state.readOnly,execute:()=>run(()=>store.add('shape'))}
 };
 const ribbonCommands={
  Start:['newSlide','copy','paste','undo','redo'],
  Rita:[],
  Design:[],
  Formatera:['copy'],
  Visa:['present','animations']
 } as const;
 const renderRibbonCommands=(tab:keyof typeof ribbonCommands)=>ribbonCommands[tab].map(id=>commandButton(id,tab==='Formatera'&&id==='copy'?'Kopiera objekt':undefined));
 const selectedFormatType=state.selected.length>1?'multi':element?.type??'';
 const updateOverflow=(id:string,policy:TextOverflowPolicy)=>{const item=store.slide.view.elements.find((e:D)=>e.id===id);if(!item||item.locked||!['text','shape'].includes(item.type))return;const value=textOf(store.slide,item);if(textOverflowPolicy(value)===policy)return;run(()=>store.editText(id,{...(typeof value==='string'?{paragraphs:[{id:uid('p'),runs:[{text:value}]}]}:value),overflow:policy}));};
 const dataRibbon=()=>state.selected.length===1&&element&&['table','chart'].includes(element.type)?<RibbonDataTools element={element} disabled={state.readOnly||safety.locked||safety.busy||!!element.locked} onChange={change=>run(()=>store.updateElement(element.id,change))} onDetails={()=>{openProperties('object');}}/>:null;
 const formatRibbon=()=> <RibbonFormatting doc={doc} slide={slide} ids={state.selected} selectedType={selectedFormatType} disabled={state.readOnly||safety.locked||safety.busy} onFormat={change=>run(()=>store.formatSelected(change))} onDetails={()=>{openProperties('object');}} onReplaceImage={()=>{replaceImage.current=true;image.current?.click();}} onTextOverflow={updateOverflow}/>;
 const commandButton=(id:keyof typeof commands,label?:string)=><button key={id} disabled={commands[id].disabled} onClick={commands[id].execute}>{label??commands[id].label}</button>;
 const show=(name:string)=>{setDialog(name);setTimeout(()=>{if(!modal.current?.open)modal.current?.showModal();},0);};
 async function openDrafts(){
  setDraftAction(null);setDraftError('');
  try{setDrafts(await listDrafts());}catch(error){setDraftError('Kunde inte läsa lokala arbetskopior: '+String(error));}
  show('drafts');
 }
 async function confirmDraftAction(){
  const action=draftAction,draft= drafts.find(item=>item.id===action?.id);
  if(!action||!draft)return;
  try{
   if(action.kind==='restore'){
    store.load(draft.model);persistence.current.restore(draft.model,draft.version);
    setConflict(false);setDraftStatus('Arbetskopia återställd');
    modal.current?.close();
   }else{
    await deleteDraft(draft.id);
    setDrafts(items=>items.filter(item=>item.id!==draft.id));
   }
   setDraftAction(null);
  }catch(error){setDraftError('Kunde inte hantera arbetskopian: '+String(error));}
 }
 useEffect(()=>{void initializePwa();listDrafts().then(setDrafts).catch(e=>setMessage('Återställning: '+e));const change=()=>setOnline(navigator.onLine);window.addEventListener('online',change);window.addEventListener('offline',change);const observer=new ResizeObserver(([entry])=>{setWidth(entry.contentRect.width);setHeight(entry.contentRect.height);});if(viewport.current)observer.observe(viewport.current);return ()=>{observer.disconnect();window.removeEventListener('online',change);window.removeEventListener('offline',change);};},[]);
 useEffect(()=>{const controller=persistence.current;if(!state.dirty||state.readOnly||conflict||controller.hasSaved(doc))return;setDraftStatus('Sparar arbetskopia…');controller.schedule(doc,snapshot=>store.markPersisted(snapshot),(outcome,error)=>{if(outcome==='saved')setDraftStatus('Arbetskopia sparad på denna enhet');else if(outcome==='conflict'){setConflict(true);setDraftStatus('Lagringskonflikt – skapa en separat kopia');}else if(outcome==='error')setDraftStatus('Kunde inte spara arbetskopia: '+String(error));});return ()=>controller.cancel();},[doc,state.dirty,state.readOnly,conflict]);
 useEffect(()=>{const bc=new BroadcastChannel('slide-fable-presenter');channel.current=bc;bc.onmessage=event=>{if(isAudience&&event.data.type==='view'){store.load(event.data.doc,true);store.selectSlide(event.data.slideId);setFragment(event.data.fragment);setBlack(event.data.black);setPresent(true);}else if(event.data.type==='ready'){const s=store.getSnapshot();bc.postMessage({type:'view',doc:audienceDoc(s.doc),slideId:s.slideId,fragment,black});}};if(isAudience)bc.postMessage({type:'ready'});return ()=>{bc.close();channel.current=null;};},[isAudience]);
 useEffect(()=>{if(!isAudience)channel.current?.postMessage({type:'view',doc:audienceDoc(doc),slideId:state.slideId,fragment,black});},[doc,state.slideId,fragment,black,isAudience]);
 useEffect(()=>{if(!present)return;const start=Date.now();const t=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);return ()=>clearInterval(t);},[present]);
 const navigate=(direction:number)=>{const max=playbackSteps(slide);if(direction<0&&fragment>0){setFragment(Number.isFinite(fragment)?fragment-1:Math.max(0,max-1));return;}if(direction>0&&fragment<max){setFragment(fragment+1);return;}const visible=doc.slides.filter((s:D)=>!s.hidden),at=visible.findIndex((s:D)=>s.id===state.slideId),next=visible[Math.max(0,Math.min(visible.length-1,at+direction))];if(next&&next.id!==state.slideId){store.selectSlide(next.id);setFragment(direction>0?0:playbackSteps(next));}};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(target.closest('input,textarea,select,[contenteditable="true"]'))return;if(modal.current?.open){if(dialog==='overview'&&(e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key)){e.preventDefault();runSlideAction(()=>e.key==='y'||e.shiftKey?store.redo():store.undo(),undefined);}return;}if(present){if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();navigate(1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();navigate(-1);}if(e.key==='b')setBlack(b=>!b);if(e.key==='Escape'&&!isAudience)setPresent(false);return;}if(e.ctrlKey||e.metaKey){if(e.key==='z'){e.preventDefault();run(()=>e.shiftKey?store.redo():store.undo());}if(e.key==='y'){e.preventDefault();run(()=>store.redo());}/* Native copy event records the internal selection. *//* Native paste event handles external content or internal objects. */if(e.key==='s'){e.preventDefault();void saveHtml();}if(e.key.toLowerCase()==='d'&&!e.shiftKey&&!e.altKey&&state.selected.length&&!state.readOnly&&!safety.locked&&!safety.busy){e.preventDefault();run(()=>store.duplicateSelected());}if(e.key.toLowerCase()==='g'&&!e.altKey&&!state.readOnly&&!safety.locked&&!safety.busy){if(e.shiftKey&&element?.type==='group'){e.preventDefault();run(()=>store.ungroup());}else if(!e.shiftKey&&state.selected.length>=2){e.preventDefault();run(()=>store.group());}}return;}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();run(()=>store.removeSelected());}if(state.selected.length&&!state.readOnly&&!safety.locked&&!safety.busy&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=e.shiftKey?10:1;run(()=>store.nudgeSelected((e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0),(e.key==='ArrowDown'?n:e.key==='ArrowUp'?-n:0)));}};window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);});
 async function saveHtml(){const source=store.getSnapshot();try{await saveStandaloneHtml(source.doc,revision=>store.markExported(revision));setMessage('Presentationens redigerbara HTML-fil har hämtats. Arbetskopian sparas dessutom automatiskt på denna enhet.');}catch(e){setMessage('Kunde inte spara presentationen: '+String(e));}}
 function openSaveAs(){setSaveAsTitle(doc.document.title+' – kopia');setSaveAsError('');show('save-as');}
 async function saveAsHtml(){const end=updateSafety.beginOperation();try{const output=saveAsDocument(store.getSnapshot().doc,saveAsTitle);await validateFull(output);await saveStandaloneHtml(output,()=>{});modal.current?.close();setMessage('En separat redigerbar HTML-kopia har hämtats. Den öppna presentationen är oförändrad.');}catch(e){setSaveAsError(String(e));}finally{end();}}
 async function openFile(f:File){const end=updateSafety.beginOperation();try{const text=await f.text(),result=await importDocument(text);store.load(result.doc,result.readOnly,text,result.warnings);setConflict(false);setMessage(result.warnings.join(' · ')||'Presentation öppnad.');}catch(e){setMessage('Filen kunde inte öppnas: '+String(e));}finally{end();}}
 function runSlideAction<T>(fn:()=>T,fallback:T):T{setReuseError('');try{return fn();}catch(e){setReuseError(String(e));return fallback;}}
 async function prepareReuse(f:File){setReuseError('');const end=updateSafety.beginOperation();try{if(f.size>50*1024*1024)throw Error('Filen är större än 50 MB.');const result=await importDocument(await f.text());if(result.readOnly)throw Error('Filen kan bara visas och kan inte återanvändas i redigeraren.');setReuseSource(result.doc);show('reuse');}catch(e){setReuseError('Bilderna kunde inte läsas: '+String(e));setMessage('Bilderna kunde inte läsas: '+String(e));}finally{end();}}
 async function insertReused(ids:string[]){if(!reuseSource)return;setReuseError('');const end=updateSafety.beginOperation();try{const result=await store.reuseSlides(reuseSource,ids);modal.current?.close();setMessage(result.ids.length+' bilder infogade.'+(result.removedLinks?' '+result.removedLinks+' länkar eller animationer till ej valda mål togs bort.':''));}catch(e){setReuseError('Bilderna kunde inte infogas: '+String(e));}finally{end();}}
 async function addImage(f:File){
  const slideId=slide.id;
  const replaceTargetId=replaceImage.current&&element?.type==='image'?element.id:null;
  replaceImage.current=false;
  const end=updateSafety.beginOperation();
  try{
   if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)||f.size>10*1024*1024)throw Error('Välj PNG, JPEG, WebP eller säker SVG, högst 10 MB.');
   const bytes=new Uint8Array(await f.arrayBuffer());
   const uri=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(f);});
   const assetId=uid('asset'),newElementId=uid('image');
   const asset={kind:'image',storage:'embedded',mimeType:f.type,uri,sha256:await bytesHash(bytes)};
   const probe=new Image();probe.src=uri;await probe.decode();
   if(probe.naturalWidth*probe.naturalHeight>40000000)throw Error('Bilden överskrider 40 megapixlar.');
   // Validate the candidate without committing a stale copy of the document.
   const candidate=copy(store.getSnapshot().doc);
   const candidateSlide=candidate.slides.find((s:D)=>s.id===slideId);
   if(!candidateSlide)throw Error('Bilden finns inte längre i presentationen.');
   candidate.assets[assetId]=asset;
   const candidateTarget=replaceTargetId?candidateSlide.view.elements.find((e:D)=>e.id===replaceTargetId&&e.type==='image'):null;
   if(replaceTargetId&&!candidateTarget)throw Error('Bilden som ska ersättas finns inte längre.');
   if(candidateTarget)candidateTarget.assetRef=assetId;
   else candidateSlide.view.elements.push({id:newElementId,type:'image',geometry:box(200,200,800,500),assetRef:assetId,fit:'cover',accessibility:{altText:f.name}});
   await validateFull(candidate);
   // Apply only the new asset and intended element to the latest state, preserving intervening edits.
   store.transaction(d=>{
    const currentSlide=d.slides.find((s:D)=>s.id===slideId);
    if(!currentSlide)throw Error('Bilden finns inte längre i presentationen.');
    const currentTarget=replaceTargetId?currentSlide.view.elements.find((e:D)=>e.id===replaceTargetId&&e.type==='image'):null;
    if(replaceTargetId&&!currentTarget)throw Error('Bilden som ska ersättas finns inte längre.');
    d.assets[assetId]=asset;
    if(currentTarget)currentTarget.assetRef=assetId;
    else currentSlide.view.elements.push({id:newElementId,type:'image',geometry:box(200,200,800,500),assetRef:assetId,fit:'cover',accessibility:{altText:f.name}});
   });
   store.select([replaceTargetId??newElementId]);
  }catch(e){setMessage(String(e));}
  finally{end();}
 }
 async function importTransfer(data:Pick<DataTransfer,'getData'|'files'>,fallback=false){
  if(state.readOnly||safety.locked||safety.busy||modal.current?.open||present)return;
  const picture=transferableImage(data.files);
  if(picture){replaceImage.current=false;await addImage(picture);return;}
  const text=data.getData('text/plain'),html=data.getData('text/html');
  if(text||html){
   try{const rich=externalRichText(text,html,markup=>new DOMParser().parseFromString(markup,'text/html'));
    const id=store.add('text');store.editText(id,rich);setMessage('Text infogad från urklipp eller drag/släpp.');
   }catch(error){setMessage('Kunde inte infoga text: '+String(error));}
   return;
  }
  if(fallback&&clipboard.current)run(()=>store.paste(clipboard.current!));
 }
 useEffect(()=>{const onPaste=(event:ClipboardEvent)=>{
  const target=event.target;
  if(target instanceof Element&&target.closest('input,textarea,select,[contenteditable],.canvas-inline-editor'))return;
  if(state.readOnly||safety.locked||safety.busy||modal.current?.open||present)return;
  if(!event.clipboardData)return;
  if(event.clipboardData.getData('application/x-slide-fable-internal')==='1'&&clipboard.current){event.preventDefault();run(()=>store.paste(clipboard.current!));return;}
  if(hasExternalContent(event.clipboardData)||clipboard.current){event.preventDefault();void importTransfer(event.clipboardData,true);}
 };
  const onCopy=(event:ClipboardEvent)=>{const target=event.target;if(target instanceof Element&&target.closest('input,textarea,select,[contenteditable],.canvas-inline-editor'))return;
   if(!state.selected.length||!event.clipboardData||modal.current?.open||present)return;
   clipboard.current=store.copySelected();event.clipboardData.setData('application/x-slide-fable-internal','1');event.clipboardData.setData('text/plain','Slide Fable-objekt');event.preventDefault();
  };
  window.addEventListener('paste',onPaste);window.addEventListener('copy',onCopy);return()=>{window.removeEventListener('paste',onPaste);window.removeEventListener('copy',onCopy);};});
 async function pasteFromButton(){
  if(!navigator.clipboard?.read){if(clipboard.current)run(()=>store.paste(clipboard.current!));else setMessage('Använd Ctrl/Cmd+V för att klistra in från ett annat program.');return;}
  try{const items=await navigator.clipboard.read();
   for(const item of items){const type=['image/png','image/jpeg','image/webp'].find(type=>item.types.includes(type));
    if(type){const blob=await item.getType(type);await addImage(new File([blob],'Urklippsbild', {type}));return;}
    const html=item.types.includes('text/html')?await (await item.getType('text/html')).text():'';
    const text=item.types.includes('text/plain')?await (await item.getType('text/plain')).text():'';
    if(text||html){const rich=externalRichText(text,html,markup=>new DOMParser().parseFromString(markup,'text/html'));const id=store.add('text');store.editText(id,rich);return;}
   }
   if(clipboard.current)run(()=>store.paste(clipboard.current!));
  }catch{if(clipboard.current)run(()=>store.paste(clipboard.current!));else setMessage('Urklippet kunde inte läsas. Använd Ctrl/Cmd+V.');}
 }
 function startMarquee(event:PointerEvent<HTMLDivElement>){
  if(!event.isPrimary||event.button!==0||state.readOnly||safety.locked||safety.busy)return;
  const target=event.target;
  if(!(target instanceof Element)||target.closest('.render-element,.resize-handle,.selection-scale-frame,.canvas-inline-editor'))return;
  const area=viewport.current?.querySelector<HTMLElement>('.stage-space');
  if(!area||!area.contains(target)){if(!event.shiftKey){store.select([]);setEditingTextId(null);}return;}
  // Touch gestures keep native canvas scrolling. Mouse and stylus support marquee.
  if(!shouldStartMarquee(event.pointerType,touchMarqueeMode)){if(!event.shiftKey){store.select([]);setEditingTextId(null);}return;}
  const bounds=area.getBoundingClientRect();
  const position=(ev:{clientX:number;clientY:number})=>({
   x:Math.max(0,Math.min(doc.document.canvas.width,(ev.clientX-bounds.left)/scale)),
   y:Math.max(0,Math.min(doc.document.canvas.height,(ev.clientY-bounds.top)/scale))
  });
  const start=position(event),initialSelection=[...state.selected],extend=event.shiftKey;
  const objects=slide.view.elements.map((e:D)=>({id:e.id,geometry:effective(doc,slide,e).geometry,visible:e.visible!==false}));
  const host=event.currentTarget;
  host.setPointerCapture(event.pointerId);
  event.preventDefault();
  const update=(ev:globalThis.PointerEvent)=>{
   const rect=marqueeBounds(start,position(ev));
   setSelectionMarquee(rect);
   setMarqueeCandidateIds(marqueeCandidates(initialSelection,objects,rect,extend));
  };
  const finish=(ev:globalThis.PointerEvent)=>{
   cleanup();
   const rect=marqueeBounds(start,position(ev));
   setSelectionMarquee(null);
   setMarqueeCandidateIds([]);
   store.select(marqueeCandidates(initialSelection,objects,rect,extend));
   setEditingTextId(null);
  };
  const cancel=()=>{cleanup();setSelectionMarquee(null);setMarqueeCandidateIds([]);};
  const cleanup=()=>{host.removeEventListener('pointermove',update);host.removeEventListener('pointerup',finish);host.removeEventListener('pointercancel',cancel);};
  host.addEventListener('pointermove',update);
  host.addEventListener('pointerup',finish);
  host.addEventListener('pointercancel',cancel);
 }
 function startDrag(id:string,event:PointerEvent,resize:ResizeDirection|false=false){
  if(!event.isPrimary||event.button!==0||state.readOnly||safety.locked||safety.busy)return;
  const object=slide.view.elements.find((e:D)=>e.id===id);if(!object)return;
  const choice=resolveSelection(state.selected,id,event.shiftKey);
  store.select(choice.ids);
  // Shift modifies selection only. Locked objects can be selected but never dragged.
  if(!choice.beginDrag||object.locked)return;
  const chosen=movableSelection(choice.ids,slide.view.elements);
  const initial=chosen.map(cid=>({id:cid,geometry:copy(effective(doc,slide,slide.view.elements.find((e:D)=>e.id===cid)).geometry)}));
  const x=event.clientX,y=event.clientY,target=event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  const nodes=initial.map(item=>viewport.current?.querySelector<HTMLElement>(`.stage [data-element-id="${CSS.escape(item.id)}"]`));
  const connected=slide.view.elements.filter((e:D)=>['line','arrow','connector'].includes(e.type)&&[e.startAnchor?.elementId,e.endAnchor?.elementId].some((v:string)=>chosen.includes(v))).map((e:D)=>{
   const node=viewport.current?.querySelector<HTMLElement>(`.stage [data-element-id="${CSS.escape(e.id)}"]`);
   const line=node?.querySelector<SVGLineElement>('svg line');
   const markers=Array.from(node?.querySelectorAll<SVGElement>('.line-end-marker')??[]);
   return {element:e,line,markers,oldLine:line?{x1:line.getAttribute('x1'),y1:line.getAttribute('y1'),x2:line.getAttribute('x2'),y2:line.getAttribute('y2')}:null,oldMarkers:markers.map(m=>({m,points:m.getAttribute('points'),cx:m.getAttribute('cx'),cy:m.getAttribute('cy')}))};
  });
  const otherBounds=slide.view.elements.filter((e:D)=>!chosen.includes(e.id)&&e.visible!==false).map((e:D)=>effective(doc,slide,e).geometry);
  const translationBounds=initial.length===1?initial[0].geometry:selectionBounds(initial);
  const translated=(dx:number,dy:number,alt:boolean)=>snapTranslation(translationBounds,otherBounds,dx,dy,Boolean(snap)&&!resize,alt,7,10,doc.document.canvas);
  const resized=(dx:number,dy:number,alt:boolean)=>{
   const reference=(initial.find(item=>item.id===id)??initial[0]).geometry;
   const result=snapResize(reference,resize as ResizeDirection,otherBounds,dx,dy,snap,alt,7,10,doc.document.canvas);
   return {guides:result.guides,dx:resize&&resize.includes('w')?result.rect.x-reference.x:result.rect.width-reference.width,
    dy:resize&&resize.includes('n')?result.rect.y-reference.y:result.rect.height-reference.height};
  };
  const preview=(dx:number,dy:number,alt=false)=>{
   const result=resize?resized(dx,dy,alt):translated(dx,dy,alt);
   setAlignmentGuides(result.guides);
   const geometries=slide.view.elements.map((e:D)=>{const changed=initial.find(t=>t.id===e.id);if(!changed)return {id:e.id,geometry:effective(doc,slide,e).geometry};const b=changed.geometry;return {id:e.id,geometry:resize?{...b,...resizeRect(b,resize,result.dx,result.dy)}:{...b,x:b.x+result.dx,y:b.y+result.dy}};});
   initial.forEach((item,i)=>{const node=nodes[i];if(!node)return;const next=geometries.find((g:{id:string;geometry:D})=>g.id===item.id)!.geometry;Object.assign(node.style,{left:next.x+'px',top:next.y+'px',width:next.width+'px',height:next.height+'px'});});
   for(const record of connected){
    if(!record.line)continue;
    const endpoints=resolveLinePoints(record.element,geometries),b=record.element.geometry;
    const coords={x1:endpoints.start.x-b.x,y1:endpoints.start.y-b.y,x2:endpoints.end.x-b.x,y2:endpoints.end.y-b.y};
    for(const [key,value] of Object.entries(coords))record.line.setAttribute(key,String(value));
    const kinds=endMarkers(record.element);
    for(const which of ['start','end'] as const){
     const node=record.markers.find((m:SVGElement)=>m.getAttribute('data-marker-end')===which);
     const g=markerGeometry(kinds[which],which==='start'?{x:coords.x1,y:coords.y1}:{x:coords.x2,y:coords.y2},which==='start'?{x:coords.x2,y:coords.y2}:{x:coords.x1,y:coords.y1});
     if(!node||!g)continue;
     if('points'in g)node.setAttribute('points',markerSvgPoints(g.points));
     if('center'in g){node.setAttribute('cx',String(g.center.x));node.setAttribute('cy',String(g.center.y));}
    }
   }
  };
  const restore=()=>{
   initial.forEach((item,i)=>{const node=nodes[i],b=item.geometry;if(node)Object.assign(node.style,{left:b.x+'px',top:b.y+'px',width:b.width+'px',height:b.height+'px'});});
   for(const record of connected){
    if(record.line&&record.oldLine)for(const [key,value] of Object.entries(record.oldLine))if(value!==null)record.line.setAttribute(key,value);
    for(const old of record.oldMarkers)for(const [key,value] of Object.entries({points:old.points,cx:old.cx,cy:old.cy}))if(value===null)old.m.removeAttribute(key);else old.m.setAttribute(key,value);
   }
  };
  const cleanup=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',cancel);setAlignmentGuides({});};
  const move=(ev:globalThis.PointerEvent)=>preview((ev.clientX-x)/scale,(ev.clientY-y)/scale,ev.altKey);
  const end=(ev:globalThis.PointerEvent)=>{
   cleanup();const dx=(ev.clientX-x)/scale,dy=(ev.clientY-y)/scale;
   if(Math.abs(dx)+Math.abs(dy)<2){restore();return;}
   run(()=>store.transaction((_d,s)=>{for(const item of initial){
    const el=s.view.elements.find((e:D)=>e.id===item.id),b=item.geometry;
    const result=resize?resized(dx,dy,ev.altKey):translated(dx,dy,ev.altKey);
    el.geometry=resize?{...b,...resizeRect(b,resize,result.dx,result.dy)}:{...b,x:b.x+result.dx,y:b.y+result.dy};
    const binding=s.placeholderBindings?.find((p:D)=>p.elementId===el.id);
    if(binding)binding.overrides={...binding.overrides,geometry:copy(el.geometry)};
   }}));
  };
  const cancel=()=>{cleanup();restore();};
  target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',cancel);
 }
 function startSelectionScale(corner:ScaleCorner,event:PointerEvent){
  if(!event.isPrimary||event.button!==0||state.readOnly||safety.locked||safety.busy)return;
  const eligible=slide.view.elements.filter((e:D)=>state.selected.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type));
  if(eligible.length<2)return;
  const items:ArrangeItem[]=eligible.map((e:D)=>({id:e.id,geometry:copy(effective(doc,slide,e).geometry)}));
  const bounds=selectionBounds(items);
  const otherElements=slide.view.elements.filter((e:D)=>!state.selected.includes(e.id)&&e.visible!==false);
  const others=otherElements.map((e:D)=>effective(doc,slide,e).geometry);
  const target=event.currentTarget as HTMLElement,originX=event.clientX,originY=event.clientY;
  const nodeMap=items.map((item:ArrangeItem)=>viewport.current?.querySelector<HTMLElement>(`.stage [data-element-id="${CSS.escape(item.id)}"]`));
  const stage=viewport.current?.querySelector<HTMLElement>('.stage');
  const frame=stage?.querySelector<HTMLElement>('.selection-scale-frame');
  const label=frame?.querySelector<HTMLElement>('.selection-scale-percent');
  const vertical=stage?.querySelector<HTMLElement>('.selection-scale-guide.vertical');
  const horizontal=stage?.querySelector<HTMLElement>('.selection-scale-guide.horizontal');
  const connections=slide.view.elements.filter((e:D)=>['line','arrow','connector'].includes(e.type)&&[e.startAnchor?.elementId,e.endAnchor?.elementId].some((id:string)=>items.some((item:ArrangeItem)=>item.id===id))).map((element:D)=>{
   const node=stage?.querySelector<HTMLElement>(`[data-element-id="${CSS.escape(element.id)}"]`);
   const line=node?.querySelector<SVGLineElement>('svg line');
   const markers=Array.from(node?.querySelectorAll<SVGElement>('.line-end-marker')??[]);
   return {element,line,markers,oldLine:line?{x1:line.getAttribute('x1'),y1:line.getAttribute('y1'),x2:line.getAttribute('x2'),y2:line.getAttribute('y2')}:null,
    oldMarkers:markers.map(m=>({m,points:m.getAttribute('points'),cx:m.getAttribute('cx'),cy:m.getAttribute('cy')}))};
  });
  const applied=(ev:globalThis.PointerEvent)=>snapSelectionScaleFromCorner(items,corner,(ev.clientX-originX)/scale,(ev.clientY-originY)/scale,others,snap,ev.altKey);
  const showGuide=(node:HTMLElement|null|undefined,coordinate:number|undefined,axis:'x'|'y')=>{
   if(!node)return;
   node.style.display=coordinate===undefined?'none':'block';
   if(coordinate!==undefined){if(axis==='x')node.style.left=coordinate+'px';else node.style.top=coordinate+'px';}
  };
  target.setPointerCapture(event.pointerId);
  const move=(ev:globalThis.PointerEvent)=>{
   const scaled=applied(ev);
   scaled.items.forEach((item:ArrangeItem,i:number)=>{const node=nodeMap[i];if(node)Object.assign(node.style,{left:item.geometry.x+'px',top:item.geometry.y+'px',width:item.geometry.width+'px',height:item.geometry.height+'px'});});
   if(frame)Object.assign(frame.style,{left:scaled.bounds.x+'px',top:scaled.bounds.y+'px',width:scaled.bounds.width+'px',height:scaled.bounds.height+'px'});
   if(label){label.textContent=Math.round(scaled.factor*100)+' %';label.style.display='block';}
   showGuide(vertical,scaled.guides.x,'x');showGuide(horizontal,scaled.guides.y,'y');
   const geometries=slide.view.elements.map((e:D)=>({id:e.id,geometry:scaled.items.find((item:ArrangeItem)=>item.id===e.id)?.geometry??effective(doc,slide,e).geometry}));
   for(const record of connections){
    if(!record.line)continue;
    const endpoints=resolveLinePoints(record.element,geometries),b=record.element.geometry;
    const coords={x1:endpoints.start.x-b.x,y1:endpoints.start.y-b.y,x2:endpoints.end.x-b.x,y2:endpoints.end.y-b.y};
    for(const [key,value] of Object.entries(coords))record.line.setAttribute(key,String(value));
    const kinds=endMarkers(record.element);
    for(const which of ['start','end'] as const){
     const node=record.markers.find((m:SVGElement)=>m.getAttribute('data-marker-end')===which);
     const g=markerGeometry(kinds[which],which==='start'?{x:coords.x1,y:coords.y1}:{x:coords.x2,y:coords.y2},which==='start'?{x:coords.x2,y:coords.y2}:{x:coords.x1,y:coords.y1});
     if(!node||!g)continue;
     if('points'in g)node.setAttribute('points',markerSvgPoints(g.points));
     if('center'in g){node.setAttribute('cx',String(g.center.x));node.setAttribute('cy',String(g.center.y));}
    }
   }
  };
  const restore=()=>{
   items.forEach((item:ArrangeItem,i:number)=>{const node=nodeMap[i];if(node)Object.assign(node.style,{left:item.geometry.x+'px',top:item.geometry.y+'px',width:item.geometry.width+'px',height:item.geometry.height+'px'});});
   if(frame)Object.assign(frame.style,{left:bounds.x+'px',top:bounds.y+'px',width:bounds.width+'px',height:bounds.height+'px'});
   if(label)label.style.display='none';
   showGuide(vertical,undefined,'x');showGuide(horizontal,undefined,'y');
   for(const record of connections){
    if(record.line&&record.oldLine)for(const [key,value] of Object.entries(record.oldLine))if(value!==null)record.line.setAttribute(key,value);
    for(const old of record.oldMarkers)for(const [key,value] of Object.entries({points:old.points,cx:old.cx,cy:old.cy}))if(value===null)old.m.removeAttribute(key);else old.m.setAttribute(key,value);
   }
  };
  const cleanup=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',cancel);};
  const end=(ev:globalThis.PointerEvent)=>{
   cleanup();restore();
   if(Math.abs(ev.clientX-originX)+Math.abs(ev.clientY-originY)<2)return;
   run(()=>store.scaleSelectedFromCorner(corner,(ev.clientX-originX)/scale,(ev.clientY-originY)/scale,Boolean(snap)&&!ev.altKey));
  };
  const cancel=()=>{cleanup();restore();};
  target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',cancel);
 }
 function dragLineEndpoint(id:string,which:'start'|'end',event:PointerEvent){
  if(!event.isPrimary||event.button!==0||state.readOnly||safety.locked||safety.busy)return;
  const source=slide.view.elements.find((e:D)=>e.id===id);
  if(!source||source.locked)return;
  const b=effective(doc,slide,source).geometry;
  const existing=resolveLinePoints(source,slide.view.elements.filter((item:D)=>item.id!==id).map((item:D)=>({id:item.id,geometry:effective(doc,slide,item).geometry})));
  const start=existing.start,end=existing.end;
  const x=event.clientX,y=event.clientY,target=event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  // Preview the endpoint in the rendered SVG without creating an undo entry per pointer event.
  const rendered=Array.from(document.querySelectorAll<HTMLElement>('.stage .render-element')).find(n=>n.dataset.elementId===id);
  const line=rendered?.querySelector<SVGLineElement>('svg line');
  const markerNodes=Array.from(rendered?.querySelectorAll<SVGElement>('.line-end-marker')??[]);
  const originalMarkers=markerNodes.map(node=>({node,points:node.getAttribute('points'),cx:node.getAttribute('cx'),cy:node.getAttribute('cy')}));
  const originalStyle=rendered?.getAttribute('style')??'';
  const originalLine=line?{x1:line.getAttribute('x1'),y1:line.getAttribute('y1'),x2:line.getAttribute('x2'),y2:line.getAttribute('y2')}:undefined;
  const handleStyle=target.getAttribute('style')??'';
  const position=(ev:globalThis.PointerEvent)=>{
   const dx=(ev.clientX-x)/scale,dy=(ev.clientY-y)/scale;
   const q=(v:number)=>snap&&!ev.altKey?Math.round(v/10)*10:v;
   const points=moveEndpoint(start,end,which,q(dx),q(dy)),bounds=lineBounds(points.start,points.end);
   return {points,bounds,changed:Math.abs(dx)+Math.abs(dy)>=2};
  };
  const preview=(ev:globalThis.PointerEvent)=>{
   const {points,bounds}=position(ev);
   if(!rendered||!line)return;
   Object.assign(rendered.style,{left:bounds.x+'px',top:bounds.y+'px',width:bounds.width+'px',height:bounds.height+'px'});
   const x1=points.start.x-bounds.x,y1=points.start.y-bounds.y,x2=points.end.x-bounds.x,y2=points.end.y-bounds.y;
   line.setAttribute('x1',String(x1));line.setAttribute('y1',String(y1));line.setAttribute('x2',String(x2));line.setAttribute('y2',String(y2));
   const configured=endMarkers(source);
   for(const end of ['start','end'] as const){
    const node=markerNodes.find(n=>n.getAttribute('data-marker-end')===end);
    if(!node)continue;
    const geometry=markerGeometry(configured[end],end==='start'?{x:x1,y:y1}:{x:x2,y:y2},end==='start'?{x:x2,y:y2}:{x:x1,y:y1});
    if(!geometry)continue;
    if('points'in geometry)node.setAttribute('points',markerSvgPoints(geometry.points));
    if('center'in geometry){node.setAttribute('cx',String(geometry.center.x));node.setAttribute('cy',String(geometry.center.y));}
   }
   const p=which==='start'?points.start:points.end;target.style.left=(p.x-12)+'px';target.style.top=(p.y-12)+'px';
  };
  const restore=()=>{
   if(rendered)rendered.setAttribute('style',originalStyle);
   if(line&&originalLine)for(const [key,value] of Object.entries(originalLine))if(value!==null)line.setAttribute(key,value);
   for(const {node,points,cx,cy} of originalMarkers)for(const [key,value] of Object.entries({points,cx,cy})){if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}
   target.setAttribute('style',handleStyle);
  };
  const cleanup=()=>{target.removeEventListener('pointermove',preview);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',cancel);};
  const finish=(ev:globalThis.PointerEvent)=>{
   cleanup();const {points,bounds,changed}=position(ev);
   if(!changed){restore();return;}
   const hit=nearestPort(points[which],slide.view.elements.filter((item:D)=>item.id!==id&&['shape','text','image'].includes(item.type)&&item.visible!==false).map((item:D)=>({id:item.id,geometry:effective(doc,slide,item).geometry})));
   const next={...source,geometry:{...b,...bounds},extensions:{...source.extensions,slideFableLinePoints:{start:{x:points.start.x-bounds.x,y:points.start.y-bounds.y},end:{x:points.end.x-bounds.x,y:points.end.y-bounds.y}}}};
   if(hit)next[which==='start'?'startAnchor':'endAnchor']=hit;else delete next[which==='start'?'startAnchor':'endAnchor'];
   run(()=>store.updateElement(id,{geometry:next.geometry,extensions:next.extensions,startAnchor:next.startAnchor,endAnchor:next.endAnchor}));
  };
  const cancel=()=>{cleanup();restore();};
  target.addEventListener('pointermove',preview);
  target.addEventListener('pointerup',finish);
  target.addEventListener('pointercancel',cancel);
 }
 const patch=(p:D)=>run(()=>store.updateElement(element.id,p));
 async function saveDesignTemplate(){const end=updateSafety.beginOperation();try{const template=designTemplate(store.getSnapshot().doc);await validateFull(template);download(JSON.stringify(template,null,2),template.document.title+'.json','application/json');setMessage('Designmallen är sparad. Öppna filen för att skapa en presentation från mallen.');}catch(e){setMessage('Mallen kunde inte sparas: '+String(e));}finally{end();}}
 async function exportFile(){try{const result=await exportPresentation({doc,slideId:slide.id,scope:exportScope,format,profile,includePrivate,imageWidth});setReport(JSON.stringify(result,null,2));setMessage('Exporten är skapad. Läs rapporten för objekt som rasteriserats.');}catch(e){setMessage('Exporten misslyckades: '+String(e));}}
 const replaceWithNew=()=>{store.load(createDocument());setConflict(false);setDraftStatus('Ny presentation');};
 return <div className={`editor-app ${dark?'night':''}`} data-build={__BUILD_ID__}>
 <a className="skip" href="#workspace">Hoppa till arbetsytan</a><header className="editor-header"><a className="brand" href="#workspace"><img src="./icons/icon.svg" width="32" alt=""/>Slide <strong>Fable</strong></a><div className="document-heading"><span className="document-title">{doc.document.title}</span><span className="draft-indicator" role="status" aria-live="polite" title="Arbetskopian sparas lokalt på den här enheten. Arkiv → Spara hämtar en separat HTML-fil.">{draftStatus}</span></div><span className="connection" data-ready={pwa.offlineReady}>{online?'Uppkopplad':'Offline'}{pwa.offlineReady?' · redo för offline':''}</span>{commandButton("undo")}{commandButton("redo")}{commandButton("present")}<button onClick={()=>setDark(!dark)} aria-label="Mörkt gränssnitt">{dark?'Ljust':'Mörkt'}</button><button onClick={()=>show('install')}>Installera appen</button><details className="editor-menu-disclosure"><summary>Arkiv</summary><nav className="editor-menu" aria-label="Arkiv och redigering" onClick={event=>{if((event.target as HTMLElement).closest("button"))event.currentTarget.closest("details")?.removeAttribute("open");}}><button onClick={()=>show('new')}>Ny presentation</button><button onClick={()=>file.current?.click()}>Öppna presentation…</button><button onClick={()=>void saveHtml()} disabled={state.readOnly||safety.busy}>Spara</button><button onClick={openSaveAs} disabled={state.readOnly||safety.busy}>Spara som…</button><button onClick={()=>show('export')} disabled={state.readOnly||safety.busy}>Exportera…</button><button onClick={()=>void openDrafts()}>Arbetskopior…</button><p className="file-menu-note">Arbetskopian sparas automatiskt här. Spara hämtar en redigerbar HTML-fil.</p><span className="divider"/>{commandButton("undo")}{commandButton("redo")}{commandButton("copy")}{commandButton("paste")}{commandButton("present")}<button onClick={()=>show('help')}>Hjälp</button></nav></details></header>
 
 <input ref={reuseFile} hidden type="file" aria-label="Presentation att återanvända" accept=".html,.htm,.json" onChange={e=>{if(e.target.files?.[0])void prepareReuse(e.target.files[0]);e.target.value='';}}/><input ref={file} hidden type="file" accept=".html,.htm,.json" onChange={e=>{if(e.target.files?.[0])void openFile(e.target.files[0]);e.target.value='';}}/><input ref={image} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>{if(e.target.files?.[0])void addImage(e.target.files[0]);e.target.value='';}}/>

 {state.readOnly&&<section role="alert" className="recovery">Skrivskyddat kompatibilitetsläge. {state.warnings.join(' ')}<button onClick={()=>download(state.original,'original.html','text/html')}>Hämta oförändrat original</button></section>}
 {conflict&&<section role="alert" className="recovery">En annan flik har en nyare arbetskopia.<button onClick={()=>run(()=>{store.transaction(d=>{d.document.id=uid('doc');d.document.title+=' – separat kopia';});setConflict(false);})}>Spara som separat arbetskopia</button><button onClick={()=>void saveHtml()}>Hämta min HTML-fil</button></section>}
 <nav className="mobile-panels" aria-label="Arbetsytans paneler">{[['slides','Bilder'],['canvas','Arbetsyta'],['properties','Egenskaper']].map(([v,t])=><button key={v} aria-pressed={panel===v} onClick={()=>{if(v==='properties')setShowProperties(true);if(v==='slides')setShowSlides(true);setPanel(v);}}>{t}</button>)}</nav>
 
 <main id="workspace" className="editor-workspace" data-panel={panel} data-slides-open={showSlides} data-properties-open={showProperties} tabIndex={-1}>
 <SlideFilmstrip doc={doc} activeId={slide.id} disabled={state.readOnly||safety.locked||safety.busy}
  onAdd={()=>run(()=>store.addSlide('content'))} onOverview={()=>{setReuseError('');show('overview');}}
  onSelect={id=>{store.selectSlide(id);setPanel('canvas');}}
  onDuplicate={id=>run(()=>store.duplicateSlides([id]))}
  onRemove={id=>run(()=>store.removeSlides([id]))}
  onHide={(id,hidden)=>run(()=>store.setSlidesHidden([id],hidden))}
  onLayout={id=>{store.selectSlide(id);openProperties('design');}}
  onReorder={(id,before)=>run(()=>store.reorderSlides([id],before))}
  onMove={(id,direction)=>run(()=>store.moveSlides([id],direction))}/>
 <section className="editor-canvas-pane" aria-label="Arbetsyta"><button type="button" className="properties-toggle" aria-controls="slide-properties" aria-expanded={showProperties} onClick={()=>{if(showProperties){setShowProperties(false);if(panel==='properties')setPanel('canvas');}else{setShowProperties(true);setPanel('properties');}}}>{showProperties?'Dölj egenskaper':'Visa egenskapspanel'}</button><button type="button" className="ribbon-collapse" aria-controls="slide-ribbon-panel" aria-expanded={ribbonExpanded} onClick={()=>setRibbonExpanded(x=>!x)}>{ribbonExpanded?"Dölj verktyg":"Visa verktyg"}</button><nav className="ribbon-tabs" aria-label="Menyflikar" role="tablist" onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));const index=tabs.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();}}>{['Start','Infoga','Rita','Design','Övergångar','Animeringar','Bildspel','Visa',...(selected?['Formatera']:[])].map(name=><button key={name} id={"ribbon-tab-"+name.toLowerCase()} role="tab" aria-selected={ribbonTab===name} tabIndex={ribbonTab===name?0:-1} aria-controls="slide-ribbon-panel" onClick={()=>{setRibbonTab(name);setRibbonExpanded(true);}}>{name}</button>)}</nav><div id="slide-ribbon-panel" role="tabpanel" aria-label={ribbonTab} className="ribbon-panel" hidden={!ribbonExpanded}>{ribbonTab==='Infoga'?<div className="insert-tools insert-gallery" aria-label="Infoga objekt">
 <div className="insert-gallery-group" role="group" aria-label="Text och bild"><span className="insert-gallery-label">Text och bild</span><div className="insert-gallery-actions"><button id="insert-text" type="button" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>run(()=>store.add('text'))}>Textfält</button><button type="button" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>{replaceImage.current=false;image.current?.click();}}>Bilder</button></div></div>
 <div className="insert-gallery-group" role="group" aria-label="Former och linjer"><span className="insert-gallery-label">Former och linjer</span><div className="insert-gallery-actions"><details className="insert-more shape-picker"><summary>Former ▾</summary><div className="shape-picker-items" aria-label="Välj form">{shapeChoices.map(choice=><button type="button" key={choice.id} disabled={state.readOnly||safety.locked||safety.busy} onClick={event=>{run(()=>{if(choice.id==='line'||choice.id==='arrow')store.add(choice.id);else store.add('shape',choice.id);});event.currentTarget.closest('details')?.removeAttribute('open');}}><ShapeIcon kind={choice.id}/><span>{choice.label}</span></button>)}</div></details></div></div>
 <div className="insert-gallery-group" role="group" aria-label="Tabeller och diagram"><span className="insert-gallery-label">Tabeller och diagram</span><div className="insert-gallery-actions"><button id="insert-table" type="button" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>run(()=>store.add('table'))}>Tabell</button><button id="insert-chart" type="button" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>run(()=>store.add('chart'))}>Diagram</button></div></div>
 <div className="insert-gallery-group" role="group" aria-label="Ikoner"><span className="insert-gallery-label">Ikoner</span><div className="insert-gallery-actions"><details className="insert-more icon-picker"><summary>Ikoner ▾</summary><div className="icon-picker-items" aria-label="Välj ikon"><label className="icon-search-label">Sök ikoner<input aria-label="Sök ikoner" type="search" autoComplete="off" maxLength={120} placeholder="Sök symbol..." value={iconSearch} onChange={event=>setIconSearch(event.target.value)}/></label><div className="icon-category-filter" role="group" aria-label="Ikonkategori">{(['Alla','IT','Verksamhet'] as const).map(group=><button type="button" key={group} aria-pressed={iconGroup===group} onClick={()=>setIconGroup(group)}>{group}</button>)}</div><div className="icon-filter-status" role="status">{filterIcons(iconSearch,iconGroup).length} ikoner</div>{filterIcons(iconSearch,iconGroup).map(icon=><button type="button" key={icon.id} title={icon.group} disabled={state.readOnly||safety.locked||safety.busy} onClick={event=>{run(()=>store.insert(iconElement(icon.id,uid('icon'))));event.currentTarget.closest('details')?.removeAttribute('open');}}><svg aria-hidden="true" viewBox="0 0 100 100" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d={icon.path}/></svg><span>{icon.label}</span></button>)}{filterIcons(iconSearch,iconGroup).length===0&&<p className="icon-empty-state">Inga ikoner matchar sökningen.</p>}</div></details></div></div>
 <div className="insert-gallery-group" role="group" aria-label="Fler objekt"><span className="insert-gallery-label">Fler objekt</span><div className="insert-gallery-actions"><details className="insert-more"><summary>Fler objekt ▾</summary><div className="insert-more-items">{[['semanticDiagram','Process'],['equation','Formel'],['vectorPath','Vektor']].map(([type,name])=><button type="button" disabled={state.readOnly||safety.locked||safety.busy} key={type} onClick={event=>{run(()=>store.add(type));event.currentTarget.closest('details')?.removeAttribute('open');}}>{name}</button>)}</div></details></div></div>
 </div>:ribbonTab==='Start'?<div className="ribbon-actions ribbon-start-actions" role="group" aria-label="Vanliga kommandon">{renderRibbonCommands("Start")}<button onClick={()=>{openProperties('design');}}>Layout</button>{state.selected.length>0&&<div className="ribbon-start-selection" aria-label="Formatera markering"><span className="ribbon-selection-label">{state.selected.length>1?`${state.selected.length} objekt markerade`:selectedFormatType==='text'?'Markerad text':selectedFormatType==='image'?'Markerad bild':selectedFormatType==='shape'?'Markerad form':'Markerat objekt'}</span>{formatRibbon()}{dataRibbon()}<button className="ribbon-open-format" type="button" onClick={()=>setRibbonTab('Formatera')}>Visa Formatera</button></div>}</div>:ribbonTab==='Rita'?<div className="ribbon-actions draw-formatting" aria-label="Formatering av ritobjekt"><label>Fyllning<input aria-label="Rita fyllning" type="color" disabled={!element||element.type!=='shape'||state.readOnly} value={selected?.style?.fill?.color??'#ffffff'} onChange={e=>patch({style:{...selected?.style,fill:{...selected?.style?.fill,color:e.target.value}}})}/></label><label>Linje<input aria-label="Rita linjefärg" type="color" disabled={!element||!['shape','line','arrow','connector'].includes(element.type)||state.readOnly} value={readOutline(selected?.style).paint?.color??'#183641'} onChange={e=>patch({style:patchOutline(selected?.style,{paint:{...readOutline(selected?.style).paint,color:e.target.value}},doc.schemaVersion)})}/></label><label>Linjetjocklek<input aria-label="Rita linjetjocklek" type="number" min="0" max="50" step="1" disabled={!element||!['shape','line','arrow','connector'].includes(element.type)||state.readOnly} value={readOutline(selected?.style).width??2} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))patch({style:patchOutline(selected?.style,{width:Math.max(0,Math.min(50,n))},doc.schemaVersion)});}}/></label><label>Linjestil<select aria-label="Rita linjestil" disabled={!element||!['shape','line','arrow','connector'].includes(element.type)||state.readOnly} value={element?currentStrokeStyle(element):'solid'} onChange={e=>{if(element)patch(editStrokeStyle(element,e.target.value as 'solid'|'dashed'|'dotted'|'dashdot',doc.schemaVersion));}}><option value="solid">Heldragen</option><option value="dashed">Streckad</option><option value="dotted">Prickad</option><option value="dashdot">Streck–punkt</option></select></label>{element&&['line','arrow','connector'].includes(element.type)&&(['start','end'] as const).map(which=><label key={which}>{which==='start'?'Startsymbol':'Slutsymbol'}<select aria-label={which==='start'?'Rita startsymbol':'Rita slutsymbol'} disabled={state.readOnly} value={currentEndMarkers(element)[which]} onChange={event=>patch(editEndMarker(element,which,event.target.value as 'none'|'openArrow'|'filledArrow'|'circle'|'diamond'|'bar',doc.schemaVersion))}><option value="none">Ingen</option><option value="openArrow">Öppen pil</option><option value="filledArrow">Fylld pil</option><option value="circle">Cirkel</option><option value="diamond">Diamant</option><option value="bar">Tvärstreck</option></select></label>)}<label>Opacitet<input aria-label="Rita opacitet" type="number" min="0" max="1" step="0.1" disabled={!element||!['shape','line','arrow','connector'].includes(element.type)||state.readOnly} value={selected?.style?.opacity??1} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))patch({style:{...selected?.style,opacity:Math.max(0,Math.min(1,n))}});}}/></label></div>:['Övergångar','Animeringar','Bildspel'].includes(ribbonTab)?<RibbonMotion mode={ribbonTab as 'Övergångar'|'Animeringar'|'Bildspel'} doc={doc} slide={slide} selected={state.selected} disabled={state.readOnly||safety.locked||safety.busy} onTransition={(type,duration)=>run(()=>store.setTransition(type,duration))} onAdd={(id,effect)=>run(()=>store.addAnimation(id,effect))} onDetails={()=>{openProperties('animations');}} onPreview={()=>{if(ribbonTab==='Bildspel'){setFragment(0);setPresent(true);}else{setPreviewStep(0);setAnimationPreview(true);}}} onStart={()=>{store.selectSlide(doc.slides[0].id);setFragment(0);setPresent(true);}}/>:ribbonTab==='Formatera'?<>{formatRibbon()}{dataRibbon()}<div className="ribbon-actions">{renderRibbonCommands("Formatera")}<details className="ribbon-dropdown"><summary>Fler objektval</summary><div className="ribbon-dropdown-items"><button disabled={!selected||state.readOnly} onClick={()=>run(()=>store.removeSelected())}>Ta bort markerat</button></div></details></div></>:ribbonTab==='Design'?<><RibbonDesign doc={doc} slide={slide} disabled={state.readOnly||safety.locked||safety.busy} onLayout={id=>run(()=>store.applyLayout(id))} onTheme={choice=>run(()=>store.applyTheme(choice))} onReset={()=>run(()=>store.resetLayout())} onBackground={(color,scope)=>run(()=>store.setBackgroundColor(color,scope))} onResetBackground={scope=>run(()=>store.resetBackground(scope))} onDetails={()=>{openProperties('design');}}/><div className="ribbon-actions design-ribbon-secondary">{renderRibbonCommands("Design")}<button onClick={()=>show('help')}>Hjälp med design</button></div></>:<div className="ribbon-actions"><details className="workspace-controls-disclosure"><summary>Paneler och anteckningar</summary><div className="workspace-layout-controls" role="group" aria-label="Visa eller dölj paneler"><button aria-pressed={showSlides} aria-controls="slide-filmstrip" onClick={()=>{if(showSlides&&panel==='slides')setPanel('canvas');else if(!showSlides)setPanel('slides');setShowSlides(v=>!v);}}>{showSlides?"Dölj bilder":"Visa bilder"}</button><button aria-pressed={showNotes} aria-controls="slide-notes" onClick={()=>setShowNotes(v=>!v)}>{showNotes?"Dölj anteckningar":"Visa anteckningar"}</button></div></details><div className="canvas-controls"><label>Zoom <select value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[.5,.75,1,1.5,2,3].map(n=><option key={n} value={n}>{n===1?'Anpassa':n*100+'%'}</option>)}</select></label><label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)}/> Fäst mot objekt och bild</label><button type="button" aria-pressed={touchMarqueeMode} disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>{setTouchMarqueeMode(mode=>!mode);setSelectionMarquee(null);}} title="Växla mellan fingerpanorering och markeringsrektangel">Markera med finger: {touchMarqueeMode?'På':'Av'}</button></div>{renderRibbonCommands("Visa")}</div>}</div><div className="canvas-scroll" ref={viewport} onDragOver={event=>{const data=event.dataTransfer;if(!data)return;if(data.types.includes('Files')||data.types.includes('text/plain')||data.types.includes('text/html')){event.preventDefault();data.dropEffect=state.readOnly||safety.locked||safety.busy||present?'none':'copy';}}} onDrop={event=>{const data=event.dataTransfer;if(!data)return;const files=data.files.length>0||data.types.includes('Files');const text=data.types.includes('text/plain')||data.types.includes('text/html');if(!files&&!text&&!hasExternalContent(data))return;/* Never let a browser navigate to a dropped file, including when editing is busy/locked. */event.preventDefault();if(state.readOnly||safety.locked||safety.busy||present)return;if(files&&!transferableImage(data.files)){setMessage('Släpp en PNG-, JPEG- eller WebP-bild.');return;}if(hasExternalContent(data))void importTransfer(data);}} onPointerDown={e=>{setObjectMenu(null);startMarquee(e);}} onContextMenu={event=>{const target=event.target as HTMLElement;const object=target.closest<HTMLElement>('.render-element[data-element-id]');if(!object?.dataset.elementId)return;event.preventDefault();openObjectMenu(object.dataset.elementId,event.clientX,event.clientY);}}><div className={`stage-space${touchMarqueeMode?' touch-marquee-mode':''}`} style={{width:doc.document.canvas.width*scale,height:doc.document.canvas.height*scale}}><div className="stage" style={{transform:`scale(${scale})`}}>{selectionMarquee&&<><div className="selection-marquee" aria-hidden="true" style={{left:selectionMarquee.x,top:selectionMarquee.y,width:selectionMarquee.width,height:selectionMarquee.height}}><span className="selection-marquee-count">{marqueeCandidateIds.length} objekt</span></div>{marqueeCandidateIds.map(id=>{const element=slide.view.elements.find((e:D)=>e.id===id);if(!element)return null;const b=effective(doc,slide,element).geometry;return <div key={id} className="selection-marquee-candidate" aria-hidden="true" style={{left:b.x,top:b.y,width:b.width,height:b.height}}/>;})}</>}<SlideView doc={doc} slide={slide} selected={state.selected} onPress={(id,event)=>{if(id!==editingTextId)startDrag(id,event);}} onEditText={id=>{if(!state.readOnly&&!safety.locked&&!safety.busy){store.select([id]);setEditingTextId(id);}}} onExpandText={(id,height)=>{
  if(state.readOnly||safety.locked||safety.busy||editingTextId===id)return;
  const current=store.slide.view.elements.find((e:D)=>e.id===id);
  if(!current||current.locked||!['text','shape'].includes(current.type))return;
  const text=textOf(store.slide,current);
  if(typeof text==='string'||text.overflow!=='expand-height')return;
  const geometry=effective(store.getSnapshot().doc,store.slide,current).geometry;
  const available=Math.max(geometry.height,store.getSnapshot().doc.document.canvas.height-geometry.y);
  const next=Math.min(available,Math.ceil(height));
  if(next>geometry.height+1)run(()=>store.updateElement(id,{geometry:{...geometry,height:next}}));
 }}/>{editingTextId&&(()=>{const target=slide.view.elements.find((e:D)=>e.id===editingTextId);if(!target||!['text','shape'].includes(target.type))return null;const rendered=effective(doc,slide,target),geometry=rendered.geometry,inlineStyle=rendered.style??{};return <div className="canvas-inline-editor" role="group" aria-label="Redigera text på bilden" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setEditingTextId(null);}}} style={{left:geometry.x,top:geometry.y,width:geometry.width,height:geometry.height,fontSize:inlineStyle.fontSize??36,fontFamily:inlineStyle.fontFamily??"Fable, sans-serif",fontWeight:inlineStyle.fontWeight??400,color:inlineStyle.color??doc.theme.colors?.[inlineStyle.colorToken]??"#183641",textAlign:inlineStyle.align??(target.type==='shape'?'center':'left'),padding:target.type==='shape'?inlineStyle.padding??14:undefined}} onPointerDown={e=>e.stopPropagation()}><button className="inline-text-done" onClick={()=>setEditingTextId(null)}>Klar</button><RichEditor inline id={target.id} value={textOf(slide,target)} onDraft={value=>run(()=>store.editText(target.id,value))} onCommit={value=>{if(JSON.stringify(value)!==JSON.stringify(textOf(store.slide,target)))run(()=>store.editText(target.id,value));}}/></div>;})()}{selected&&!element.locked&&['line','arrow','connector'].includes(element.type)&&(['start','end'] as const).map(which=>{const b=selected.geometry,pAbs=resolveLinePoints(element,slide.view.elements.filter((item:D)=>item.id!==element.id).map((item:D)=>({id:item.id,geometry:effective(doc,slide,item).geometry})))[which],p={x:pAbs.x-b.x,y:pAbs.y-b.y};return <button key={which} className="resize-handle line-endpoint-handle" data-endpoint={which} aria-label={which==='start'?'Flytta linjens startpunkt':'Flytta linjens slutpunkt'} style={{left:b.x+p.x-12,top:b.y+p.y-12}} onPointerDown={e=>{e.stopPropagation();dragLineEndpoint(element.id,which,e);}}/>;})}{selected&&state.selected.length===1&&!element.locked&&!['line','arrow','connector'].includes(element.type)&&resizeDirections.map(direction=>{const g=selected.geometry,x=direction.includes('w')?g.x:direction.includes('e')?g.x+g.width:g.x+g.width/2,y=direction.includes('n')?g.y:direction.includes('s')?g.y+g.height:g.y+g.height/2;return <button key={direction} className="resize-handle" data-direction={direction} aria-label={direction==='se'?'Ändra objektstorlek':'Ändra storlek '+direction} style={{left:x-12,top:y-12,cursor:direction==='n'||direction==='s'?'ns-resize':direction==='e'||direction==='w'?'ew-resize':direction==='nw'||direction==='se'?'nwse-resize':'nesw-resize'}} onPointerDown={e=>{e.stopPropagation();startDrag(element.id,e,direction);}}/>;})}{(()=>{const items=slide.view.elements.filter((e:D)=>state.selected.includes(e.id)&&!e.locked&&!['line','arrow','connector'].includes(e.type)).map((e:D)=>({id:e.id,geometry:effective(doc,slide,e).geometry}));if(items.length<2||state.readOnly||safety.locked||safety.busy||editingTextId)return null;const b=selectionBounds(items);return <><div className="selection-scale-frame" aria-label="Gemensam markeringsram" style={{left:b.x,top:b.y,width:b.width,height:b.height}}><span className="selection-scale-percent" aria-hidden="true"/>{(['nw','ne','sw','se'] as const).map(corner=><button key={corner} type="button" className={'selection-scale-handle corner-'+corner} aria-label={'Skala markerade objekt '+corner} onPointerDown={e=>{e.stopPropagation();startSelectionScale(corner,e);}}/>)}</div><div className="selection-scale-guide vertical" aria-hidden="true"/><div className="selection-scale-guide horizontal" aria-hidden="true"/></>;})()}{alignmentGuides.x!==undefined&&<div className="alignment-guide vertical" aria-hidden="true" style={{left:alignmentGuides.x}}/>}{alignmentGuides.y!==undefined&&<div className="alignment-guide horizontal" aria-hidden="true" style={{top:alignmentGuides.y}}/>}{alignmentGuides.spacingX&&[alignmentGuides.spacingX.first,alignmentGuides.spacingX.second].map((segment,i)=><div key={'gap-x-'+i} className="spacing-guide horizontal" aria-hidden="true" data-gap={i===0?Math.round(alignmentGuides.spacingX!.gap):undefined} style={{left:segment.from,top:alignmentGuides.spacingX!.cross,width:segment.to-segment.from}}/>)}{alignmentGuides.spacingY&&[alignmentGuides.spacingY.first,alignmentGuides.spacingY.second].map((segment,i)=><div key={'gap-y-'+i} className="spacing-guide vertical" aria-hidden="true" data-gap={i===0?Math.round(alignmentGuides.spacingY!.gap):undefined} style={{left:alignmentGuides.spacingY!.cross,top:segment.from,height:segment.to-segment.from}}/>)}</div></div></div>{objectMenu&&<div className="object-context-menu" role="menu" aria-label="Objektåtgärder" style={{left:objectMenu.x,top:objectMenu.y}}>
 <button type="button" role="menuitem" onClick={()=>{setObjectMenu(null);clipboard.current=store.copySelected();}}>Kopiera</button>
 <button type="button" role="menuitem" disabled={!state.selected.length||state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.duplicateSelected())}>Duplicera (Ctrl/Cmd+D)</button>
 <button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.removeSelected())}>Ta bort</button>
 <div className="object-menu-divider" role="separator"/>
 <button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy||slide.view.elements.find((e:D)=>e.id===objectMenu.id)?.locked} onClick={()=>menuAction(()=>store.reorder(objectMenu.id,'front'))}>Lägg längst fram</button>
 <button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy||slide.view.elements.find((e:D)=>e.id===objectMenu.id)?.locked} onClick={()=>menuAction(()=>store.reorder(objectMenu.id,'back'))}>Lägg längst bak</button>
 <button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy||slide.view.elements.find((e:D)=>e.id===objectMenu.id)?.locked} onClick={()=>menuAction(()=>store.reorder(objectMenu.id,'up'))}>Flytta framåt</button>
 <button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy||slide.view.elements.find((e:D)=>e.id===objectMenu.id)?.locked} onClick={()=>menuAction(()=>store.reorder(objectMenu.id,'down'))}>Flytta bakåt</button>
 <div className="object-menu-divider" role="separator"/>
 {state.selected.length>=2&&<><button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.align('left'))}>Vänsterjustera</button><button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.align('top'))}>Överkantsjustera</button><button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.group())}>Gruppera</button></>}
 {state.selected.length===1&&slide.view.elements.find((e:D)=>e.id===objectMenu.id)?.type==='group'&&<button type="button" role="menuitem" disabled={state.readOnly||safety.locked||safety.busy} onClick={()=>menuAction(()=>store.ungroup())}>Avgruppera</button>}
 <button type="button" role="menuitem" onClick={()=>{setObjectMenu(null);openProperties('object');}}>Formatera objekt</button>
 <button type="button" role="menuitem" onClick={()=>setObjectMenu(null)}>Stäng menyn</button>
 </div>}<div className="canvas-status"><span>{state.selected.length?state.selected.length+' markerade':'Välj ett objekt för att redigera'}</span><span>{state.dirty?'Ändrad sedan HTML-export':'Oförändrad sedan öppning/export'}</span></div><label id="slide-notes" className="notes" hidden={!showNotes}>Talaranteckningar<textarea aria-label="Talaranteckningar" key={slide.id} defaultValue={slide.delivery?.speakerNotes??''} onBlur={e=>{if(e.target.value!==(slide.delivery?.speakerNotes??''))run(()=>store.updateSlide({delivery:{...slide.delivery,speakerNotes:e.target.value}}));}} disabled={state.readOnly}/></label></section>
 <aside id="slide-properties" className="properties" aria-label="Egenskaper"><div className="properties-heading"><h2>{state.selected.length>1?'Flera objekt':state.selected.length===1?'Objektegenskaper':'Egenskaper'}</h2><button type="button" aria-label="Stäng egenskapspanel" onClick={()=>{setShowProperties(false);if(panel==='properties')setPanel('canvas');}}>Stäng ×</button></div><nav className="property-tabs">{[['object','Objekt'],['slide','Bild'],['design','Design'],['animations','Effekter']].map(([v,t])=><button key={v} aria-pressed={tab===v} onClick={()=>setTab(v)}>{t}</button>)}</nav><fieldset disabled={state.readOnly||safety.locked||safety.busy}>
 {tab==='object'&&<>{state.selected.length>1?<section className="multi-selection-properties" aria-label="Flera markerade objekt"><h2>{state.selected.length} markerade objekt</h2><MultiSelectionFormatting doc={doc} slide={slide} ids={state.selected} onChange={change=>run(()=>store.formatSelected(change))}/><div className="button-row"><button disabled={state.readOnly} onClick={()=>run(()=>store.group())}>Gruppera</button><button disabled={state.readOnly} onClick={()=>run(()=>store.makeComponent())}>Skapa komponent</button><button disabled={state.readOnly} onClick={()=>run(()=>store.removeSelected())}>Ta bort markerade</button></div><h3>Justera inom markeringen</h3><div className="button-row" role="group" aria-label="Justera markerade objekt">{[['left','Vänsterjustera'],['center','Centrera vågrätt'],['right','Högerjustera'],['top','Överkantsjustera'],['middle','Centrera lodrätt'],['bottom','Underkantsjustera']].map(([mode,label])=><button key={mode} type="button" disabled={state.readOnly||safety.locked||safety.busy||state.selected.filter(id=>!slide.view.elements.find((e:D)=>e.id===id)?.locked).length<2} onClick={()=>run(()=>store.align(mode))}>{label}</button>)}</div><h3>Samma storlek</h3><p>Det först markerade, olåsta objektet är referens. Positionerna ändras inte.</p><div className="button-row" role="group" aria-label="Samma storlek på markerade objekt">{[['width','Samma bredd'],['height','Samma höjd'],['both','Samma storlek']].map(([mode,label])=><button key={mode} type="button" disabled={state.readOnly||safety.locked||safety.busy||state.selected.filter(id=>{const e=slide.view.elements.find((e:D)=>e.id===id);return e&&!e.locked&&!['line','arrow','connector'].includes(e.type);}).length<2} onClick={()=>run(()=>store.matchSize(mode as 'width'|'height'|'both'))}>{label}</button>)}</div><h3>Skala markeringen proportionellt</h3><p>Skalar objektens storlek och inbördes avstånd kring markeringens mittpunkt. Låsta objekt och linjer påverkas inte.</p><div className="button-row" role="group" aria-label="Skala markerade objekt proportionellt">{[[0.75,'75 %'],[0.9,'90 %'],[1.1,'110 %'],[1.25,'125 %'],[1.5,'150 %']].map(([factor,label])=><button key={String(factor)} type="button" disabled={state.readOnly||safety.locked||safety.busy||state.selected.filter(id=>{const e=slide.view.elements.find((e:D)=>e.id===id);return e&&!e.locked&&!['line','arrow','connector'].includes(e.type);}).length<2} onClick={()=>run(()=>store.scaleSelected(Number(factor)))}>{label}</button>)}</div><h3>Fördela mellan ytterobjekten</h3><div className="button-row" role="group" aria-label="Fördela markerade objekt"><button type="button" disabled={state.readOnly||safety.locked||safety.busy||state.selected.filter(id=>!slide.view.elements.find((e:D)=>e.id===id)?.locked).length<3} onClick={()=>run(()=>store.align('distribute-x'))}>Fördela vågrätt</button><button type="button" disabled={state.readOnly||safety.locked||safety.busy||state.selected.filter(id=>!slide.view.elements.find((e:D)=>e.id===id)?.locked).length<3} onClick={()=>run(()=>store.align('distribute-y'))}>Fördela lodrätt</button></div></section>:!selected?<p>Markera ett objekt på bilden eller i lagerlistan.</p>:<><h2>{element.name??element.type}</h2><div className="geometry-fields">{['x','y','width','height','rotation'].map((k,i)=><NumberField key={k} name={['X','Y','Bredd','Höjd','Rotation'][i]} value={selected.geometry[k]??0} min={['width','height'].includes(k)?1:undefined} onChange={n=>patch({geometry:{...selected.geometry,[k]:n}})}/>)}</div><div className="button-row"><label><input type="checkbox" aria-label="Spegla horisontellt" checked={Boolean(element.flipX)} disabled={state.readOnly||element.locked} onChange={e=>patch({flipX:e.target.checked})}/> Spegla horisontellt</label><label><input type="checkbox" aria-label="Spegla vertikalt" checked={Boolean(element.flipY)} disabled={state.readOnly||element.locked} onChange={e=>patch({flipY:e.target.checked})}/> Spegla vertikalt</label></div><label>Namn<input defaultValue={element.name??''} key={element.id} onBlur={e=>patch({name:e.target.value})}/></label><div className="button-row"><button onClick={()=>patch({locked:!element.locked})}>{element.locked?'Lås upp':'Lås'}</button><button onClick={()=>patch({visible:element.visible===false})}>{element.visible===false?'Visa':'Dölj'}</button><button onClick={()=>run(()=>store.removeSelected())}>Ta bort objekt</button></div>
 {['text','shape'].includes(element.type)&&<label>Text som inte ryms<select aria-label="Hantering av textöverflöd" value={textOverflowPolicy(textOf(slide,element))} disabled={state.readOnly||element.locked} onChange={e=>updateOverflow(element.id,e.target.value as TextOverflowPolicy)}>{textOverflowOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
 {['text','shape'].includes(element.type)&&<RichEditor id={element.id} value={textOf(slide,element)} onDraft={value=>run(()=>store.editText(element.id,value))} onCommit={value=>{if(JSON.stringify(value)!==JSON.stringify(textOf(store.slide,element)))run(()=>store.editText(element.id,value));}}/>}
 {['text','shape'].includes(element.type)&&<ObjectTextFormatting doc={doc} slide={slide} id={element.id} disabled={state.readOnly||element.locked||safety.locked||safety.busy} onChange={change=>run(()=>store.formatSelected(change))}/>}
 <div className="button-row"><button onClick={()=>{paint.current=copy(selected.style);setMessage('Format kopierat.');}}>Kopiera format</button><button onClick={()=>{if(paint.current)patch({style:copy(paint.current)});}}>Måla format</button></div>{['text','shape','callout'].includes(element.type)&&<div className="object-surface-fields"><h3>Yta och ram</h3><label><input type="checkbox" checked={!!selected.style?.fill} onChange={e=>{const next={...selected.style};if(e.target.checked)next.fill={color:'#ffffff'};else delete next.fill;patch({style:next});}}/> Bakgrundsfärg</label>{selected.style?.fill&&<label>Bakgrundsfärg<input aria-label="Bakgrundsfärg" type="color" value={selected.style.fill.color??'#ffffff'} onChange={e=>patch({style:{...selected.style,fill:{...selected.style.fill,color:e.target.value}}})}/></label>}<label>Ramfärg<input aria-label="Ramfärg" type="color" value={readOutline(selected.style).paint?.color??'#183641'} onChange={e=>patch({style:patchOutline(selected.style,{paint:{...readOutline(selected.style).paint,color:e.target.value},width:readOutline(selected.style).width||1},doc.schemaVersion)})}/></label><NumberField name="Ramtjocklek" min={0} value={readOutline(selected.style).width??0} onChange={n=>patch({style:patchOutline(selected.style,{paint:{color:readOutline(selected.style).paint?.color??'#183641'},width:Math.max(0,n)},doc.schemaVersion)})}/></div>}<NumberField name="Opacitet" value={selected.style?.opacity??1} min={0} onChange={n=>patch({style:{...selected.style,opacity:Math.min(1,n)}})}/>
 {element.type==='shape'&&<><label>Textjustering<select aria-label="Formtext horisontellt" value={selected.style?.align??'center'} onChange={e=>patch({style:{...selected.style,align:e.target.value}})}><option value="left">Vänster</option><option value="center">Centrerad</option><option value="right">Höger</option></select></label><label>Textplacering<select aria-label="Formtext vertikalt" value={selected.style?.verticalAlign??'middle'} onChange={e=>patch({style:{...selected.style,verticalAlign:e.target.value}})}><option value="top">Överst</option><option value="middle">Mitten</option><option value="bottom">Nederst</option></select></label><NumberField name="Textmarginal" value={selected.style?.padding??14} min={0} onChange={n=>patch({style:{...selected.style,padding:Math.max(0,n)}})}/></>}
 {element.type==='shape'&&<p className="shape-type-readonly">Formtyp: {element.shapeType==='rect'?'Rektangel':element.shapeType==='ellipse'?'Ellips':element.shapeType==='triangle'?'Triangel':shapeChoices.find(choice=>choice.id===element.shapeType)?.label??element.shapeType??'Okänd'} (väljs när formen skapas)</p>}
 {element.type==='image'&&<>{doc.assets[element.assetRef]?.storage==='embedded'&&<ImageCropEditor key={element.id} element={selected} source={doc.assets[element.assetRef].uri} onApply={crop=>patch({crop:crop??undefined,fit:'cover'})}/>}<button onClick={()=>{replaceImage.current=true;image.current?.click();}}>Ersätt bild</button><label>Mask<select value={element.constraints?.mask??''} onChange={e=>patch({constraints:{...element.constraints,mask:e.target.value||undefined}})}><option value="">Rektangel</option><option value="circle">Cirkel</option></select></label><label>Passning<select value={element.fit??'cover'} onChange={e=>patch({fit:e.target.value})}><option>cover</option><option>contain</option><option>fill</option></select></label><details className="advanced-image-settings"><summary>Avancerade bildinställningar</summary><JsonField label="Beskärning" value={element.crop??{x:0,y:0,width:1,height:1}} onSave={v=>patch({crop:v})}/><JsonField label="Fokuspunkt" value={element.focalPoint??{x:.5,y:.5}} onSave={v=>patch({focalPoint:v})}/></details></>}
 {element.type==='table'&&<><TableEditor element={element} onChange={patch}/><p>Varje cell har text, valfria rowSpan/colSpan och format. Sammanfoga genom att öka spannet och ta bort täckta celler.</p><JsonField label="Tabellceller" value={element.cells} onSave={v=>patch({cells:v})}/></>}
 {element.type==='chart'&&<><ChartEditor element={element} onChange={patch}/><label>Diagramtyp<select value={element.chartType} onChange={e=>patch({chartType:e.target.value})}>{['bar','line','pie'].map(t=><option key={t}>{t}</option>)}</select></label><JsonField label="Diagramdata" value={element.dataset} onSave={v=>patch({dataset:v})}/></>}
 {element.type==='semanticDiagram'&&<><DiagramEditor element={element} onChange={patch}/><JsonField label="Diagramstruktur" value={element.semanticDiagram} onSave={v=>patch({semanticDiagram:v})}/></>}
 {element.type==='equation'&&<><label>LaTeX / MathML<textarea value={element.equation.source} onChange={e=>patch({equation:{...element.equation,source:e.target.value}})}/></label><JsonField label="Formelkälla" value={element.equation} onSave={v=>patch({equation:v})}/></>}
 {element.type==='vectorPath'&&<JsonField label="Vektorkälla" value={element.vectorPath} onSave={v=>patch({vectorPath:v})}/>}
 <label>Alternativtext<textarea key={element.id+'alt'} defaultValue={element.accessibility?.altText??''} onBlur={e=>patch({accessibility:{...element.accessibility,altText:e.target.value}})}/></label><label><input type="checkbox" checked={element.accessibility?.decorative??false} onChange={e=>patch({accessibility:{...element.accessibility,decorative:e.target.checked}})}/> Dekorativt objekt</label><JsonField label="Effekter" value={element.effects??[]} onSave={v=>patch({effects:v})}/><JsonField label="Interaktioner" value={element.actions??[]} onSave={v=>patch({actions:v})}/>
 <div className="button-row">{[['front','Främst'],['back','Bakerst'],['up','Framåt'],['down','Bakåt']].map(([v,t])=><button key={v} onClick={()=>run(()=>store.reorder(element.id,v))}>{t}</button>)}</div></>}
 <h3>Markering</h3><p className="selection-shortcuts">Piltangenter: flytta markering · Skift + pil: större steg · Ctrl/Cmd + D: duplicera · Ctrl/Cmd + G: gruppera · Ctrl/Cmd + Skift + G: avgruppera</p><div className="button-row"><button onClick={()=>run(()=>store.group())} disabled={state.selected.length<2}>Gruppera</button><button onClick={()=>run(()=>store.ungroup())} disabled={element?.type!=='group'}>Avgruppera</button><button onClick={()=>run(()=>store.makeComponent())} disabled={!state.selected.length}>Skapa komponent</button></div><h3>Lager</h3><ol className="layers">{[...slide.view.elements].reverse().map((e:D)=><li key={e.id}><button aria-pressed={state.selected.includes(e.id)} onContextMenu={event=>{event.preventDefault();openObjectMenu(e.id,event.clientX,event.clientY);}} onClick={event=>store.select(resolveSelection(state.selected,e.id,event.shiftKey).ids)}>{e.locked?'▣ ':''}{e.visible===false?'Dolt · ':''}{e.name??(e.type==='text'?plain(textOf(slide,e)).slice(0,32):e.type)}</button><button className="layer-more" id={'object-options-'+e.id} type="button" aria-label={'Objektmeny för '+(e.name??e.type)} onClick={event=>{const bounds=event.currentTarget.getBoundingClientRect();openObjectMenu(e.id,bounds.right,bounds.bottom);}}>⋯</button></li>)}</ol></>}
 {tab==='animations'&&<AnimationPanel doc={doc} slide={slide} selected={state.selected} disabled={state.readOnly||safety.locked||safety.busy} onTransition={(type,duration)=>run(()=>store.setTransition(type,duration))} onAdd={(id,effect)=>run(()=>store.addAnimation(id,effect))} onUpdate={(id,patch)=>run(()=>store.updateAnimation(id,patch))} onRemove={id=>run(()=>store.removeAnimation(id))} onMove={(id,delta)=>run(()=>store.moveAnimation(id,delta))} onPreview={()=>{setPreviewStep(0);setAnimationPreview(true);}}/>}
 {tab==='slide'&&<><label>Dokumentnamn<input id="title" key={doc.document.id} defaultValue={doc.document.title} onBlur={e=>{if(e.target.value!==doc.document.title)run(()=>store.updateDocument({title:e.target.value}));}}/></label><label>Bildrubrik<input key={slide.id+'title'} defaultValue={slide.title??''} onBlur={e=>run(()=>store.updateSlide({title:e.target.value}))}/></label><label>Sektion<select value={slide.sectionId??''} onChange={e=>run(()=>store.updateSlide({sectionId:e.target.value||undefined}))}><option value="">Ingen sektion</option>{(doc.presentation.sections??[]).map((s:D)=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><button onClick={()=>run(()=>store.transaction((d,s)=>{const id=uid('section');d.presentation.sections??=[];d.presentation.sections.push({id,title:'Sektion '+(d.presentation.sections.length+1)});s.sectionId=id;}))}>Ny sektion</button><label>Språk<input defaultValue={doc.document.language??'sv-SE'} onBlur={e=>run(()=>store.updateDocument({language:e.target.value}))}/></label><label><input type="checkbox" checked={slide.hidden??false} onChange={e=>run(()=>store.updateSlide({hidden:e.target.checked}))}/> Dölj vid presentation och export</label><label>Bakgrund<input type="color" value={slide.view.background?.color??'#faf8f2'} onChange={e=>run(()=>store.updateSlide({view:{...slide.view,background:{type:'color',color:e.target.value}}}))}/></label><JsonField label="Läsordning" value={slide.view.accessibilityOrder??slide.view.elements.map((e:D)=>e.id)} onSave={v=>run(()=>store.updateSlide({view:{...slide.view,accessibilityOrder:v}}))}/><JsonField label="Fragment" value={slide.delivery?.fragments??[]} onSave={v=>run(()=>store.updateSlide({delivery:{...slide.delivery,fragments:v}}))}/><label>Sök<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Ersätt med<input value={replacement} onChange={e=>setReplacement(e.target.value)}/></label><button onClick={()=>run(()=>store.replaceAll(search,replacement))}>Ersätt alla</button></>}
 {tab==='design'&&<><DesignGallery doc={doc} slide={slide} onLayout={id=>run(()=>store.applyLayout(id))} onTheme={choice=>run(()=>store.applyTheme(choice))} onSave={()=>void saveDesignTemplate()}/><MasterLayoutEditor doc={doc} slide={slide} disabled={state.readOnly||safety.locked||safety.busy}
 onRename={(masterId,layoutId,name)=>run(()=>store.transaction(d=>updateLayoutName(d,masterId,layoutId,name)))}
 onMasterBackground={(masterId,color)=>run(()=>store.transaction(d=>setTemplateBackground(d,masterId,undefined,color)))}
 onLayoutBackground={(masterId,layoutId,color)=>run(()=>store.transaction(d=>setTemplateBackground(d,masterId,layoutId,color)))}
 onPlaceholder={(masterId,layoutId,id,g)=>run(()=>store.transaction(d=>updatePlaceholderGeometry(d,masterId,layoutId,id,g)))}
 onDuplicate={(masterId,layoutId)=>run(()=>store.transaction(d=>{duplicateLayout(d,masterId,layoutId);}))}/>
<button onClick={()=>run(()=>store.resetLayout())}>Återställ layout</button><button onClick={()=>run(()=>store.detachLayout())}>Frikoppla layout</button><h3>Komponentbibliotek</h3>{(doc.components??[]).map((c:D)=><button key={c.id} onClick={()=>run(()=>store.insertComponent(c.id))}>Infoga {c.name??c.id}</button>)}<details><summary>Avancerad design</summary><JsonField label="Tema" value={doc.theme} onSave={v=>run(()=>store.transaction(d=>d.theme=v))}/><JsonField label="Master och layouter" value={doc.masters} onSave={v=>run(()=>store.transaction(d=>d.masters=v))}/><JsonField label="Komponentdefinitioner" value={doc.components??[]} onSave={v=>run(()=>store.transaction(d=>d.components=v))}/></details></>}
 </fieldset></aside></main>
 <section className="editor-footer"><span role="status">{pwa.message}</span><div>{pwa.waiting?<button disabled={safety.dirty||safety.busy||safety.locked} onClick={()=>void applyUpdate()}>Uppdatera nu</button>:<button onClick={()=>void checkForUpdate()}>Sök uppdatering</button>}<span>Version {__BUILD_ID__}</span></div></section>{message&&<div className="toast" role="status">{message}<button aria-label="Stäng meddelande" onClick={()=>setMessage('')}>×</button></div>}
 <dialog ref={modal} className={['overview','reuse'].includes(dialog)?'overview-dialog':undefined} onClose={()=>{setDialog('');setReuseSource(null);}}><button className="dialog-close" onClick={()=>modal.current?.close()} aria-label="Stäng dialog">×</button>{dialog==='overview'&&<SlideOverview error={reuseError} doc={doc} activeId={slide.id} disabled={state.readOnly||safety.locked||safety.busy} onOpen={id=>{store.selectSlide(id);setPanel('canvas');modal.current?.close();}} onDuplicate={ids=>runSlideAction(()=>store.duplicateSlides(ids),ids)} onDelete={ids=>runSlideAction(()=>store.removeSlides(ids),undefined)} onHide={(ids,hidden)=>runSlideAction(()=>store.setSlidesHidden(ids,hidden),undefined)} onMove={(ids,direction)=>runSlideAction(()=>store.moveSlides(ids,direction),undefined)} onDrop={(ids,target)=>runSlideAction(()=>store.reorderSlides(ids,target),undefined)} onLayout={(ids,layout)=>runSlideAction(()=>store.applyLayouts(ids,layout),undefined)} onReuse={()=>reuseFile.current?.click()}/>}{dialog==='reuse'&&reuseSource&&<ReuseSlidePicker error={reuseError} source={reuseSource} disabled={state.readOnly||safety.locked||safety.busy} onInsert={ids=>void insertReused(ids)}/>}{dialog==='drafts'&&<><h2>Lokala arbetskopior</h2><p>Här finns automatiskt sparade presentationer på den här enheten. Till skillnad från Ångra öppnas en hel sparad presentation. Arbetskopior är inte samma sak som hämtade HTML-filer.</p>{draftError&&<p role="alert">{draftError}</p>}{drafts.length===0?<p>Inga sparade arbetskopior hittades.</p>:<div className="draft-recovery-list">{drafts.map(d=><div key={d.id} className="draft-recovery-entry" data-draft-id={d.id}><span><strong>{d.model.document.title}</strong> · {new Date(d.updatedAt).toLocaleString('sv-SE')}</span><button disabled={safety.busy} onClick={()=>{setDraftError('');setDraftAction({kind:'restore',id:d.id});}}>Öppna</button><button disabled={safety.busy} onClick={()=>{setDraftError('');setDraftAction({kind:'delete',id:d.id});}}>Ta bort</button></div>)}</div>}{draftAction&&drafts.some(d=>d.id===draftAction.id)&&<section className="draft-recovery-confirm"><p>{draftAction.kind==='restore'?'Öppna denna arbetskopia? Den ersätter presentationen på arbetsytan. Ångra kan inte användas för att gå tillbaka. Spara gärna den nuvarande presentationen som HTML först.':'Ta bort denna arbetskopia permanent från den här enheten? Det går inte att ångra.'}</p><button className="primary" disabled={safety.busy} onClick={()=>void confirmDraftAction()}>{draftAction.kind==='restore'?'Bekräfta öppning':'Bekräfta borttagning'}</button><button onClick={()=>setDraftAction(null)}>Avbryt</button></section>}</>}{dialog==='save-as'&&<><h2>Spara som</h2><p>Hämta en <strong>ny, separat redigerbar HTML-kopia</strong>. Den presentation du arbetar i ändras inte.</p><label>Namn på kopian<input aria-label="Namn på kopian" maxLength={120} value={saveAsTitle} onChange={e=>{setSaveAsTitle(e.target.value);setSaveAsError('');}} onKeyDown={e=>{if(e.key==='Enter')void saveAsHtml();}}/></label>{saveAsError&&<p role="alert">{saveAsError}</p>}<button className="primary" disabled={safety.busy||!saveAsTitle.trim()} onClick={()=>void saveAsHtml()}>Hämta separat kopia</button><button onClick={()=>modal.current?.close()}>Avbryt</button></>}{dialog==='new'&&<><h2>Ny presentation</h2><p>Den nuvarande presentationen ersätts på arbetsytan. Välj Arkiv → Spara om du vill hämta en flyttbar HTML-fil först. En lokal arbetskopia kan finnas kvar på enheten.</p><button onClick={()=>{replaceWithNew();modal.current?.close();}}>Skapa ny presentation</button></>}{dialog==='export'&&<><h2>Exportera presentation</h2><label>Format<select value={format} onChange={e=>setFormat(e.target.value)}>{['html','pdf','pptx','png','jpg'].map(f=><option key={f}>{f}</option>)}</select></label>{['pdf','pptx'].includes(format)&&<label>Profil<select value={profile} onChange={e=>setProfile(e.target.value)}><option value="editable-first">Redigerbarhet först</option><option value="visual-first">Visuellt först, redigerbar huvudtext</option><option value="flattened">Platt bild per sida</option></select></label>}{['png','jpg'].includes(format)&&<NumberField name="Bildbredd i pixlar" value={imageWidth} onChange={setImageWidth}/>}<label><input type="checkbox" checked={includePrivate} onChange={e=>setIncludePrivate(e.target.checked)}/>{format==='html'?'Ta med talaranteckningar och proveniens':'Bifoga redigeringskällor för diagram och formler'}</label>{format!=='html'&&<label>Bildurval<select value={exportScope} onChange={e=>setExportScope(e.target.value)}><option value="all">Alla synliga bilder</option><option value="current">Aktuell bild</option></select></label>}<p>Exportera skapar en fil för delning eller användning i andra program. Arkiv → Spara och Spara som ger redigerbara HTML-original. HTML innehåller hela den redigerbara modellen, även dolda objekt. PDF, PPTX och bilder innehåller synliga bilder. Typsnitt och effekter kan avvika; en rapport medföljer.</p><button className="primary" disabled={safety.busy} onClick={()=>void exportFile()}>{safety.busy?'Exporterar…':'Skapa export'}</button>{report&&<details><summary>Senaste rapporten</summary><pre>{report}</pre></details>}</>}{dialog==='install'&&<><h2>Installera Slide Fable</h2><p>På iPhone och iPad: öppna Dela-menyn och välj Lägg till på hemskärmen. På dator: använd webbläsarens installationsmeny. Öppna appen uppkopplad första gången och invänta ”redo för offline”.</p><p>{pwa.message}</p></>}{dialog==='help'&&<><h2>Arbeta med din berättelse</h2><p>Infoga objekt, dra för att flytta och använd hörnhandtaget för storlek. Håll Skift för flerval. Alt förbikopplar rutnätet. Piltangenter flyttar ett objekt; Skift ger större steg.</p><p>Text redigeras i objektpanelen. Ctrl/Cmd+Z ångrar, Ctrl/Cmd+C kopierar objekt inom appen; Ctrl/Cmd+V kan även klistra in text och bilder från andra program och Ctrl/Cmd+S hämtar en redigerbar HTML-fil. Arbetskopior sparas automatiskt på denna enhet. Arkiv → Spara som hämtar en separat kopia utan att ändra den öppna presentationen.</p><p>I presentation: pilar eller mellanslag byter bild/fragment, B ger svart skärm och Esc avslutar. Avancerade diagram, master och effekter redigeras som validerad JSON i respektive panel.</p><p>Det här är en verifieringsversion. Läs medföljande acceptansrapport för kvarvarande begränsningar.</p></>}</dialog>
 {animationPreview&&!present&&<div className="animation-preview-backdrop" role="presentation">
  <section className="animation-preview-dialog" role="dialog" aria-modal="true" aria-label="Förhandsvisa animationer" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setAnimationPreview(false);}}>
   <div className="animation-preview-heading"><strong>Förhandsvisa animationer · {slide.title??'Aktuell bild'}</strong><button type="button" autoFocus onClick={()=>setAnimationPreview(false)} aria-label="Stäng animationsförhandsvisning">Stäng</button></div>
   <div className="animation-preview-stage" data-preview-step={previewStep} style={{aspectRatio:`${doc.document.canvas.width} / ${doc.document.canvas.height}`}}>
    <PresentationSlide doc={doc} slide={slide} step={previewStep} onNavigate={()=>{}}/>
   </div>
   <div className="animation-preview-controls"><button type="button" disabled={previewStep===0} onClick={()=>setPreviewStep(step=>Math.max(0,step-1))}>← Föregående steg</button><span role="status">Steg {previewStep} av {playbackSteps(slide)}</span><button type="button" disabled={previewStep>=playbackSteps(slide)} onClick={()=>setPreviewStep(step=>Math.min(playbackSteps(slide),step+1))}>Nästa steg →</button><button type="button" onClick={()=>setPreviewStep(0)}>Börja om</button></div>
  </section>
 </div>}
 {present&&<div className={`presenter ${isAudience?'audience':''}`}><div className="presentation-screen" onTouchStart={e=>e.currentTarget.dataset.touch=String(e.changedTouches[0].clientX)} onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-Number(e.currentTarget.dataset.touch);if(Math.abs(dx)>60)navigate(dx<0?1:-1);}}>{black?<div className="black-screen"/>:<div className="presentation-fit"><PresentationSlide doc={doc} slide={slide} step={fragment} onNavigate={id=>{store.selectSlide(id);setFragment(0);}}/></div>}</div>{!isAudience&&<aside className="presenter-tools"><div className="button-row"><button onClick={()=>navigate(-1)}>← Föregående</button><button onClick={()=>navigate(1)}>Nästa →</button><button onClick={()=>setBlack(!black)}>{black?'Visa bild':'Svart skärm'}</button><button onClick={()=>void document.documentElement.requestFullscreen().catch(()=>setMessage('Helskärm är inte tillgänglig.'))}>Helskärm</button><button onClick={()=>{window.open(location.pathname+'?audience=1','slide-fable-audience');}}>Publikfönster</button><button onClick={()=>{setPresent(false);if(document.fullscreenElement)void document.exitFullscreen();}}>Avsluta</button></div><p>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')} · Bild {doc.slides.indexOf(slide)+1} av {doc.slides.length}</p><div className="next-slide"><span>Nästa bild: {doc.slides[doc.slides.indexOf(slide)+1]?.title??'Slut på presentationen'}</span></div><h2>Talaranteckningar</h2><p className="speaker-note">{slide.delivery?.speakerNotes??'Inga anteckningar'}</p></aside>}</div>}
 </div>;
}
