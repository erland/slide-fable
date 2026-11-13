import {useState} from 'react';
import {copy,uid,type D} from '../core/model';
import {splitHorizontalCell,removeTableRow,removeTableColumn,moveTableRow,moveTableColumn,duplicateTableRow,canDuplicateTableRow,duplicateTableColumn,canDuplicateTableColumn,appendTableColumn,canAppendTableColumn,appendTableRow,canAppendTableRow} from './tableCells';
import {moveDiagramNode,removeDiagramNode,createDiagramEdge,retargetDiagramEdge,removeDiagramEdge,type DiagramData} from './diagramOperations';
export function TableEditor({element,onChange}:{element:D;onChange:(p:D)=>void}){
 const edit=(fn:(cells:D[][])=>void)=>{const cells=copy(element.cells);fn(cells);onChange({cells});};
 const setEdge=(row:number,col:number,side:'top'|'right'|'bottom'|'left',field:'width'|'color',value:string)=>edit(cells=>{const cell=cells[row][col];const edges=cell.borders??{};const prev=edges[side]??{width:2,paint:{color:'#70858a'}};edges[side]={...prev,...(field==='width'?{width:Math.max(0,Number(value))}:{paint:{color:value}})};cell.borders=edges;});

 const splitUnsupported=element.cells.some((row:D[])=>row.some((cell:D)=>(cell.rowSpan??1)!==1))||new Set(element.cells.map((row:D[])=>row.reduce((sum:number,cell:D)=>sum+(cell.colSpan??1),0))).size>1;
 const splitCell=(r:number,k:number)=>{const next=splitHorizontalCell(element.cells,r,k,()=>uid('cell'));if(next)onChange({cells:next});};
 const deleteRow=(index:number)=>{const cells=removeTableRow(element.cells,index);if(cells)onChange({cells});};
 const reorderRow=(index:number,direction:-1|1)=>{const cells=moveTableRow(element.cells,index,direction);if(cells)onChange({cells});};
 const cloneRow=(index:number)=>{const cells=duplicateTableRow(element.cells,index,()=>uid('cell'));if(cells)onChange({cells});};
 const deleteColumn=(index:number)=>{const next=removeTableColumn(element.cells,index,element.tableLayout?.columnWidths);if(next)onChange({cells:next.cells,...(next.columnWidths?{tableLayout:{...element.tableLayout,columnWidths:next.columnWidths}}:{})});};
 const reorderColumn=(index:number,direction:-1|1)=>{const next=moveTableColumn(element.cells,index,direction,element.tableLayout?.columnWidths);if(next)onChange({cells:next.cells,...(next.columnWidths?{tableLayout:{...element.tableLayout,columnWidths:next.columnWidths}}:{})});};
 const cloneColumn=(index:number)=>{const next=duplicateTableColumn(element.cells,index,()=>uid('cell'),element.tableLayout?.columnWidths);if(next)onChange({cells:next.cells,...(next.columnWidths?{tableLayout:{...element.tableLayout,columnWidths:next.columnWidths}}:{})});};
 const addColumn=()=>{const next=appendTableColumn(element.cells,id=>({id,text:''}),()=>uid('cell'),element.tableLayout?.columnWidths);if(next)onChange({cells:next.cells,...(next.columnWidths?{tableLayout:{...element.tableLayout,columnWidths:next.columnWidths}}:{})});};
 const addRow=()=>{const cells=appendTableRow(element.cells,id=>({id,text:''}),()=>uid('cell'));if(cells)onChange({cells});};
 const layout=element.tableLayout??{};
 const updateLayout=(change:D)=>onChange({tableLayout:{...layout,...change}});
 const columnCount=Math.max(0,...element.cells.map((row:D[])=>row.reduce((sum:number,cell:D)=>sum+(cell.colSpan??1),0)));
 const widths:Array<number>=layout.columnWidths??Array.from({length:columnCount},()=>Math.max(1,Math.round((element.geometry?.width??600)/Math.max(1,columnCount))));
 const setColumnWidth=(index:number,raw:string)=>{const value=Number(raw);if(!Number.isFinite(value)||value<=0)return;const next=[...widths];next[index]=value;updateLayout({columnWidths:next});};
 const pad=layout.cellPadding??12;
 const padding=Array.isArray(pad)?pad:[pad,pad,pad,pad];
 const updatePadding=(index:number,raw:string)=>{const value=Number(raw);if(!Number.isFinite(value)||value<0)return;const next=[...padding];next[index]=value;updateLayout({cellPadding:next});};
 return <div className="table-editor"><fieldset><legend>Tabellayout (PPD 0.4)</legend><label><input type="checkbox" aria-label="Sammanfoga cellramar" checked={layout.collapseBorders!==false} onChange={e=>updateLayout({collapseBorders:e.target.checked})}/> Sammanfoga cellramar</label><div className="button-row">{widths.map((width:number,i:number)=><div key={i} className="table-column-control"><label>Kolumn {i+1} bredd<input type="number" aria-label={`Kolumn ${i+1} bredd`} min="1" step="1" value={width} onChange={e=>setColumnWidth(i,e.target.value)}/></label><div className="table-structure-actions" role="group" aria-label={`Åtgärder för kolumn ${i+1}`}><button type="button" aria-label={`Flytta kolumn ${i+1} åt vänster`} disabled={!moveTableColumn(element.cells,i,-1,layout.columnWidths)} onClick={()=>reorderColumn(i,-1)}>←</button><button type="button" aria-label={`Flytta kolumn ${i+1} åt höger`} disabled={!moveTableColumn(element.cells,i,1,layout.columnWidths)} onClick={()=>reorderColumn(i,1)}>→</button><button type="button" aria-label={`Duplicera kolumn ${i+1}`} title="Kopierar kolumnen till höger med nya cell-ID:n" disabled={!canDuplicateTableColumn(element.cells,i,layout.columnWidths)} onClick={()=>cloneColumn(i)}>Duplicera</button><button type="button" aria-label={`Ta bort kolumn ${i+1}`} title="Tar bort kolumnen i hela tabellen. En kolumn som går genom en sammanslagen cell kan inte tas bort." disabled={!removeTableColumn(element.cells,i,layout.columnWidths)} onClick={()=>deleteColumn(i)}>Ta bort</button></div></div>)}</div><div className="button-row">{['Överkant','Högerkant','Underkant','Vänsterkant'].map((side,i)=><label key={side}>{side} marginal<input type="number" aria-label={side+' cellmarginal'} min="0" step="1" value={padding[i]} onChange={e=>updatePadding(i,e.target.value)}/></label>)}</div></fieldset><div className="table-grid">{element.cells.map((row:D[],r:number)=><div key={r} className="button-row">{row.map((c:D,k:number)=><label key={c.id}>R{r+1} K{k+1}<input aria-label={`Cell ${r+1} ${k+1}`} value={typeof c.text==='string'?c.text:''} onChange={e=>edit(rows=>rows[r][k].text=e.target.value)}/><button disabled={k===row.length-1||(c.rowSpan??1)>1||(row[k+1]?.rowSpan??1)>1} onClick={()=>edit(rows=>{const next=rows[r].splice(k+1,1)[0];rows[r][k].text=String(c.text)+' '+String(next.text);rows[r][k].colSpan=(c.colSpan??1)+(next.colSpan??1);})}>Sammanfoga →</button><button type="button" aria-label={`Dela cell ${r+1} ${k+1}`} title={splitUnsupported?'Tabellen har vertikala spann eller inkonsekvent kolumnstruktur och kan inte delas säkert':undefined} disabled={splitUnsupported||(c.colSpan??1)<=1} onClick={()=>splitCell(r,k)}>Dela cell</button><button onClick={()=>edit(rows=>rows[r][k].header=!c.header)}>{c.header?'Vanlig cell':'Rubrikcell'}</button><details><summary>Kantlinjer</summary>{(['top','right','bottom','left'] as const).map(side=><div key={side} className="button-row"><label>{side} bredd<input type="number" min="0" step="1" aria-label={`Cell ${r+1} ${k+1} ${side} bredd`} value={c.borders?.[side]?.width??2} onChange={e=>setEdge(r,k,side,'width',e.target.value)}/></label><label>{side} färg<input type="color" aria-label={`Cell ${r+1} ${k+1} ${side} färg`} value={c.borders?.[side]?.paint?.color??'#70858a'} onChange={e=>setEdge(r,k,side,'color',e.target.value)}/></label></div>)}</details></label>)}<div className="table-structure-actions" role="group" aria-label={`Åtgärder för rad ${r+1}`}><button type="button" aria-label={`Flytta rad ${r+1} uppåt`} disabled={!moveTableRow(element.cells,r,-1)} onClick={()=>reorderRow(r,-1)}>↑</button><button type="button" aria-label={`Flytta rad ${r+1} nedåt`} disabled={!moveTableRow(element.cells,r,1)} onClick={()=>reorderRow(r,1)}>↓</button><button type="button" aria-label={`Duplicera rad ${r+1}`} title="Kopierar raden med nytt cell-ID för varje cell" disabled={!canDuplicateTableRow(element.cells,r)} onClick={()=>cloneRow(r)}>Duplicera</button><button type="button" aria-label={`Ta bort rad ${r+1}`} title="Tar bort raden i hela tabellen. Vertikala cellspann måste hanteras separat." disabled={!removeTableRow(element.cells,r)} onClick={()=>deleteRow(r)}>Ta bort</button></div></div>)}</div><div className="button-row"><button type="button" disabled={!canAppendTableRow(element.cells)} title="Lägger till en rad med korrekt logisk kolumnstruktur" onClick={addRow}>Lägg till rad</button><button type="button" disabled={!canAppendTableColumn(element.cells,element.tableLayout?.columnWidths)} title="Lägger till en kolumn och uppdaterar eventuella kolumnbredder" onClick={addColumn}>Lägg till kolumn</button></div></div>;
}
export function ChartEditor({element,onChange}:{element:D;onChange:(p:D)=>void}){
 const ds=element.dataset;
 const edit=(fn:(data:D)=>void)=>{const next=copy(ds);fn(next);onChange({dataset:next});};
 const swap=(items:D[],a:number,b:number)=>{[items[a],items[b]]=[items[b],items[a]];};
 const moveSeries=(index:number,delta:number)=>edit(d=>swap(d.series,index,index+delta));
 const moveCategory=(index:number,delta:number)=>edit(d=>{swap(d.categories,index,index+delta);d.series.forEach((series:D)=>swap(series.values,index,index+delta));});
 return <div className="chart-editor">
  <p>Redigera serienamn, kategorier och tal. Tomma värden behandlas som noll.</p>
  <fieldset><legend>Diagramformatering</legend>
   <label><input type="checkbox" aria-label="Visa teckenförklaring" checked={element.legend?.visible!==false} onChange={e=>onChange({legend:{...element.legend,visible:e.target.checked}})}/> Visa teckenförklaring</label>
   <label><input type="checkbox" aria-label="Visa värdeetiketter" checked={element.legend?.showValues!==false} onChange={e=>onChange({legend:{...element.legend,showValues:e.target.checked}})}/> Visa värdeetiketter</label>
   {element.chartType!=='pie'&&<label>Y-axelns rubrik<input aria-label="Y-axelns rubrik" maxLength={100} value={element.yAxis?.title??''} onChange={event=>onChange({yAxis:{...element.yAxis,title:event.target.value}})}/></label>}
   {element.chartType!=='pie'&&<div className="button-row">{(['min','max'] as const).map(key=><label key={key}>{key==='min'?'Y-axel minimum':'Y-axel maximum'}<input type="number" aria-label={key==='min'?'Y-axel minimum':'Y-axel maximum'} value={element.yAxis?.[key]??''} onChange={event=>{const raw=event.target.value;const axis={...element.yAxis};if(raw==='')delete axis[key];else{const num=Number(raw);if(!Number.isFinite(num))return;if(key==='min'&&axis.max!==undefined&&num>=axis.max)return;if(key==='max'&&axis.min!==undefined&&num<=axis.min)return;axis[key]=num;}onChange({yAxis:axis});}}/></label>)}</div>}
  </fieldset>
  <div className="button-row">{ds.series.map((series:D,i:number)=><div key={series.id} className="button-row">
   <label>Serie {i+1} namn<input aria-label={`Serie ${i+1} namn`} value={series.name??''} onChange={e=>edit(d=>d.series[i].name=e.target.value)}/></label>
   {element.chartType!=='pie'&&<label>Serie {i+1} färg<input type="color" aria-label={`Serie ${i+1} färg`} value={element.legend?.seriesColors?.[series.id]??['#cf694c','#387f89','#d5af60','#697cbd','#6c9467','#bc7496'][i%6]} onChange={e=>onChange({legend:{...element.legend,seriesColors:{...element.legend?.seriesColors,[series.id]:e.target.value}}})}/></label>}
   <button type="button" aria-label={`Flytta serie ${i+1} uppåt`} disabled={i===0} onClick={()=>moveSeries(i,-1)}>Uppåt</button>
   <button type="button" aria-label={`Flytta serie ${i+1} nedåt`} disabled={i===ds.series.length-1} onClick={()=>moveSeries(i,1)}>Nedåt</button>
   <button type="button" aria-label={`Ta bort serie ${i+1}`} disabled={ds.series.length<=1} onClick={()=>edit(d=>{d.series.splice(i,1);})}>Ta bort serie</button>
  </div>)}</div>
  {ds.categories.map((label:string,i:number)=><div className="button-row" key={i}>
   <input aria-label={'Kategori '+(i+1)} value={label} onChange={e=>edit(d=>d.categories[i]=e.target.value)}/>
   {ds.series.map((s:D,j:number)=><input type="number" key={s.id} aria-label={`${s.name??s.id} värde ${i+1}`} value={s.values[i]??0} onChange={e=>{if(Number.isFinite(Number(e.target.value)))edit(d=>d.series[j].values[i]=Number(e.target.value));}}/>)}
   <button type="button" aria-label={`Flytta kategori ${i+1} uppåt`} disabled={i===0} onClick={()=>moveCategory(i,-1)}>Uppåt</button>
   <button type="button" aria-label={`Flytta kategori ${i+1} nedåt`} disabled={i===ds.categories.length-1} onClick={()=>moveCategory(i,1)}>Nedåt</button>
   <button type="button" aria-label={`Ta bort kategori ${i+1}`} disabled={ds.categories.length<=1} onClick={()=>edit(d=>{d.categories.splice(i,1);d.series.forEach((s:D)=>s.values.splice(i,1));})}>Ta bort kategori</button>
  </div>)}
  <div className="button-row"><button type="button" onClick={()=>edit(d=>{d.categories.push('Ny kategori');d.series.forEach((s:D)=>s.values.push(0));})}>Ny kategori</button><button type="button" onClick={()=>edit(d=>d.series.push({id:uid('series'),name:'Serie '+(d.series.length+1),values:d.categories.map(()=>0)}))}>Ny serie</button></div>
 </div>;
}
export function DiagramEditor({element,onChange}:{element:D;onChange:(p:D)=>void}){
 const d:D & DiagramData=element.semanticDiagram;
 const [from,setFrom]=useState(''),[to,setTo]=useState('');
 const nodes:D[]=d.nodes??[],edges:D[]=d.edges??[];
 const validFrom=nodes.some(n=>n.id===from)?from:nodes[0]?.id??'';
 const validTo=nodes.some(n=>n.id===to)?to:nodes.find(n=>n.id!==validFrom)?.id??'';
 const edit=(fn:(data:D)=>void)=>{const next=copy(d);fn(next);onChange({semanticDiagram:next});};
 const apply=(next:D|null)=>{if(next)onChange({semanticDiagram:next});};
 const nodeChoices=nodes.map((n:D,i:number)=><option key={n.id} value={n.id}>{i+1}. {n.label||'Namnlös nod'}</option>);
 return <section className="diagram-editor" aria-label="Redigera diagramstruktur">
  <label>Diagramstruktur<select aria-label="Diagramstruktur" value={d.kind} onChange={e=>edit(data=>data.kind=e.target.value)}>{['process','hierarchy','timeline'].map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Riktning<select aria-label="Riktning" value={d.layout?.direction??'lr'} onChange={e=>edit(data=>data.layout={...data.layout,direction:e.target.value})}>{['lr','rl','tb','bt'].map(v=><option key={v}>{v}</option>)}</select></label>
  <h3>Noder</h3>
  {nodes.map((node:D,i:number)=><div key={node.id} className="button-row" role="group" aria-label={'Redigera nod '+(i+1)}>
   <label>Nod {i+1}<input aria-label={'Nod '+(i+1)} value={node.label} onChange={e=>edit(data=>{data.nodes[i].label=e.target.value;})}/></label>
   <button type="button" aria-label={'Flytta nod '+(i+1)+' upp'} disabled={i===0} onClick={()=>apply(moveDiagramNode(d,i,-1))}>Uppåt</button>
   <button type="button" aria-label={'Flytta nod '+(i+1)+' ned'} disabled={i===nodes.length-1} onClick={()=>apply(moveDiagramNode(d,i,1))}>Nedåt</button>
   <button type="button" aria-label={'Ta bort nod '+(i+1)} disabled={nodes.length<=1} onClick={()=>apply(removeDiagramNode(d,node.id))}>Ta bort</button>
  </div>)}
  <button type="button" onClick={()=>edit(data=>{const id=uid('node'),previous=data.nodes.at(-1);data.nodes.push({id,label:'Nytt steg'});if(previous){data.edges??=[];data.edges.push({id:uid('edge'),from:previous.id,to:id});}})}>Lägg till nod</button>
  <h3>Kopplingar</h3>
  <p>Kopplingarna bevaras när noder flyttas. Kopplingar till en borttagen nod tas bort automatiskt.</p>
  {edges.map((edge:D,i:number)=><div key={edge.id} className="button-row" role="group" aria-label={'Koppling '+(i+1)}>
   <label>Från<select aria-label={'Koppling '+(i+1)+' från'} value={edge.from} onChange={e=>apply(retargetDiagramEdge(d,edge.id,e.target.value,edge.to))}>{nodeChoices}</select></label>
   <label>Till<select aria-label={'Koppling '+(i+1)+' till'} value={edge.to} onChange={e=>apply(retargetDiagramEdge(d,edge.id,edge.from,e.target.value))}>{nodeChoices}</select></label>
   <button type="button" aria-label={'Ta bort koppling '+(i+1)} onClick={()=>apply(removeDiagramEdge(d,edge.id))}>Ta bort koppling</button>
  </div>)}
  {nodes.length>1&&<div className="button-row" role="group" aria-label="Ny koppling">
   <label>Från<select aria-label="Ny koppling från" value={validFrom} onChange={e=>{setFrom(e.target.value);if(e.target.value===validTo)setTo(nodes.find(n=>n.id!==e.target.value)?.id??'');}}>{nodeChoices}</select></label>
   <label>Till<select aria-label="Ny koppling till" value={validTo} onChange={e=>setTo(e.target.value)}>{nodeChoices}</select></label>
   <button type="button" disabled={!validFrom||!validTo||validFrom===validTo||edges.some((edge:D)=>edge.from===validFrom&&edge.to===validTo)} onClick={()=>apply(createDiagramEdge(d,validFrom,validTo,uid('edge')))}>Lägg till koppling</button>
  </div>}
 </section>;
}
