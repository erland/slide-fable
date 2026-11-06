import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {layoutOf,masterOf,type D} from '../core/model';
import {LayoutPreview} from './LayoutPreview';

type G={x:number;y:number;width:number;height:number};
type Drag={id:string;startX:number;startY:number;original:G;preview:G};
const validHex=(color:string)=>/^#[0-9a-f]{6}$/i.test(color);
/** An approachable layout/master editor. It intentionally edits templates, not slide-local overrides. */
export function MasterLayoutEditor({doc,slide,disabled,onRename,onMasterBackground,onLayoutBackground,onPlaceholder,onDuplicate}:{
 doc:D;slide:D;disabled:boolean;onRename:(masterId:string,layoutId:string,name:string)=>void;
 onMasterBackground:(masterId:string,color:string|undefined)=>void;
 onLayoutBackground:(masterId:string,layoutId:string,color:string|undefined)=>void;
 onPlaceholder:(masterId:string,layoutId:string,id:string,g:G)=>void;
 onDuplicate:(masterId:string,layoutId:string)=>void;
}){
 const master=masterOf(doc,slide)??doc.masters?.[0];
 const current=layoutOf(doc,slide)??master?.layouts?.[0];
 const [selectedLayout,setSelectedLayout]=useState('');
 const [selectedPlaceholder,setSelectedPlaceholder]=useState('');
 const [drag,setDrag]=useState<Drag|null>(null);
 const svg=useRef<SVGSVGElement>(null);
 const layout=master?.layouts?.find((l:D)=>l.id===selectedLayout)??current;
 const placeholder=layout?.placeholders?.find((p:D)=>p.id===selectedPlaceholder)??layout?.placeholders?.[0];
 const width=Number(doc.document.canvas.width),height=Number(doc.document.canvas.height);
 useEffect(()=>{setSelectedPlaceholder('');setDrag(null);},[layout?.id]);
 if(!master||!layout)return null;
 const safe=(g:G):G=>({x:Math.max(0,Math.min(width-g.width,Math.round(g.x))),y:Math.max(0,Math.min(height-g.height,Math.round(g.y))),width:g.width,height:g.height});
 const point=(event:PointerEvent<SVGSVGElement>)=>{const bounds=svg.current!.getBoundingClientRect();return {x:(event.clientX-bounds.left)*width/bounds.width,y:(event.clientY-bounds.top)*height/bounds.height};};
 const begin=(event:PointerEvent<SVGRectElement>,ph:D)=>{if(disabled)return;event.preventDefault();const p=point(event as unknown as PointerEvent<SVGSVGElement>);setSelectedPlaceholder(ph.id);setDrag({id:ph.id,startX:p.x,startY:p.y,original:{...ph.geometry},preview:{...ph.geometry}});svg.current?.setPointerCapture(event.pointerId);};
 const move=(event:PointerEvent<SVGSVGElement>)=>{if(!drag)return;const p=point(event);setDrag({...drag,preview:safe({...drag.original,x:drag.original.x+p.x-drag.startX,y:drag.original.y+p.y-drag.startY})});};
 const finish=(event:PointerEvent<SVGSVGElement>)=>{if(!drag)return;const g=drag.preview,id=drag.id;setDrag(null);if(svg.current?.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);if(g.x!==drag.original.x||g.y!==drag.original.y)onPlaceholder(master.id,layout.id,id,g);};
 const colors=doc.theme.colors??{};
 const bg=layout.background?.color??master.background?.color??colors.surface??'#ffffff';
 const setNumber=(key:keyof G,value:number)=>{if(!placeholder||!Number.isFinite(value))return;const g={...placeholder.geometry,[key]:value};onPlaceholder(master.id,layout.id,placeholder.id,g);};
 return <section className="master-layout-editor" aria-label="Redigera bildmaster och layouter">
  <h3>Redigera bildmaster och layouter</h3>
  <p>Ändringar i en layout gäller bilder som använder dess platshållare. Manuella justeringar på en bild behålls.</p>
  <div className="master-layout-editor-controls"><label>Layout att redigera
   <select aria-label="Välj layout att redigera" value={layout.id} onChange={e=>{setSelectedLayout(e.target.value);setSelectedPlaceholder('');}}>{(master.layouts??[]).map((l:D)=><option key={l.id} value={l.id}>{l.name??l.id}</option>)}</select></label>
   <button type="button" disabled={disabled} onClick={()=>onDuplicate(master.id,layout.id)}>Duplicera layout</button>
  </div>
  <label>Layoutnamn<input aria-label="Layoutnamn" key={layout.id} defaultValue={layout.name??''} maxLength={100} disabled={disabled} onBlur={e=>{if(e.target.value.trim()!==(layout.name??''))onRename(master.id,layout.id,e.target.value);}}/></label>
  <div className="master-layout-colors">
   <label>Bakgrund för hela bildmastern<input aria-label="Masterbakgrund" type="color" value={validHex(master.background?.color??'')?master.background.color:colors.surface??'#ffffff'} disabled={disabled} onChange={e=>onMasterBackground(master.id,e.target.value)}/></label>
   <label>Layoutens bakgrund<input aria-label="Layoutbakgrund" type="color" disabled={disabled} value={validHex(bg)?bg:'#ffffff'} onChange={e=>onLayoutBackground(master.id,layout.id,e.target.value)}/></label>
   <button type="button" disabled={disabled||!layout.background} onClick={()=>onLayoutBackground(master.id,layout.id,undefined)}>Ärv bakgrund från master</button>
  </div>
  <div className="master-layout-preview" role="group" aria-label="Visuell layoutredigering">
   <svg ref={svg} role="img" aria-label="Flytta platshållare för layouten" viewBox={`0 0 ${width} ${height}`} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>setDrag(null)}>
    <rect x={0} y={0} width={width} height={height} fill={bg}/>
    {(layout.placeholders??[]).map((ph:D)=>{const g=drag&&drag.id===ph.id?drag.preview:ph.geometry;const active=placeholder?.id===ph.id;return <g key={ph.id}>
     <rect className="master-layout-placeholder" data-placeholder-id={ph.id} x={g.x} y={g.y} width={g.width} height={g.height} fill={active?'#4c9da2':'#697f8a'} fillOpacity={active?.35:.18} stroke={active?'#176571':'#637a83'} strokeWidth={active?5:3} onPointerDown={e=>begin(e,ph)}/>
     <text x={g.x+14} y={g.y+Math.min(42,g.height*.55)} fontSize={Math.max(16,Math.min(32,g.height*.3))} fill={colors.ink??'#183641'} pointerEvents="none">{String(ph.role??ph.id)}</text>
    </g>;})}
   </svg>
  </div>
  <p className="master-layout-hint">Dra en platshållare i förhandsvisningen eller ange exakta mått nedan.</p>
  {placeholder?<fieldset className="master-layout-geometry"><legend>Placering: {placeholder.role??placeholder.id}</legend>{(['x','y','width','height'] as const).map(k=><label key={k}>{({x:'X',y:'Y',width:'Bredd',height:'Höjd'} as const)[k]}<input type="number" aria-label={'Platshållare '+k} min={k==='x'||k==='y'?0:12} max={k==='x'||k==='width'?width:height} disabled={disabled} value={placeholder.geometry[k]} onChange={e=>{if(e.target.value!=='')setNumber(k,Number(e.target.value));}}/></label>)}</fieldset>:<p>Den valda layouten saknar platshållare.</p>}
  <div className="master-layout-list" role="group" aria-label="Platshållare">{(layout.placeholders??[]).map((ph:D)=><button key={ph.id} type="button" aria-pressed={placeholder?.id===ph.id} onClick={()=>setSelectedPlaceholder(ph.id)}>{ph.role??ph.id}</button>)}</div>
  <p>Ändringar kan ångras. Duplicerade layouter blir tillgängliga i Design-flikens layoutgalleri.</p>
  <div className="master-layout-small-preview" aria-hidden="true"><LayoutPreview doc={doc} layout={layout} surface={String(colors.surface??'#ffffff')} ink={String(colors.ink??'#183641')} accent={String(colors.accent??'#cf694c')}/></div>
 </section>;
}
