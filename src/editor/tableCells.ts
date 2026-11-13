/** Re-expand a horizontal colspan without changing the logical table width.
 * Complex vertical spans are intentionally unsupported until the grid model can
 * resolve occupied coordinates across rows. Never mutate input on rejection.
 */
export function splitHorizontalCell<T extends {id:string;colSpan?:number;rowSpan?:number;text?:unknown}>(
 cells:T[][], rowIndex:number, cellIndex:number, makeId:()=>string
):T[][] | null {
 if (!Array.isArray(cells)||cells.length===0||cells.some(row=>!Array.isArray(row)||row.some(cell=>!cell||!Number.isInteger(cell.colSpan??1)||(cell.colSpan??1)<1||!Number.isInteger(cell.rowSpan??1)||(cell.rowSpan??1)!==1))) return null;
 const widths=cells.map(row=>row.reduce((sum,cell)=>sum+(cell.colSpan??1),0));
 if(widths.some(width=>width!==widths[0]))return null;
 const target=cells[rowIndex]?.[cellIndex];
 const span=target?.colSpan??1;
 if(!target||span<=1)return null;
 const used=new Set(cells.flat().map(cell=>cell.id));
 const nextId=()=>{for(let attempt=0;attempt<100;attempt++){const id=makeId();if(id&&!used.has(id)){used.add(id);return id;}}throw new Error('Could not allocate unique table cell ID');};
 const result=cells.map(row=>row.map(cell=>({...cell})));
 const original=result[rowIndex][cellIndex];
 delete original.colSpan;
 const blank=Array.from({length:span-1},()=>({...original,id:nextId(),text:''}));
 result[rowIndex].splice(cellIndex+1,0,...blank);
 return result;
}


/** A conservative structural guard. A deletion must never silently rewrite
 * vertical spans or break the rectangular logical grid. */
function safeGrid<T extends {id:string;colSpan?:number;rowSpan?:number}>(cells:T[][]):number|null{
 if(!Array.isArray(cells)||!cells.length)return null;
 let expected:number|null=null;
 const ids=new Set<string>();
 for(const row of cells){
  if(!Array.isArray(row)||!row.length)return null;
  let width=0;
  for(const cell of row){
   if(!cell||typeof cell.id!=='string'||!cell.id||ids.has(cell.id)||
      !Number.isInteger(cell.colSpan??1)||(cell.colSpan??1)<1||
      !Number.isInteger(cell.rowSpan??1)||(cell.rowSpan??1)!==1)return null;
   ids.add(cell.id);
   width+=cell.colSpan??1;
  }
  if(expected!==null&&width!==expected)return null;
  expected=width;
 }
 return expected;
}

/** Delete a row without changing the other rows, their cells or their IDs. */
export function removeTableRow<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],rowIndex:number
):T[][]|null{
 if(!Number.isInteger(rowIndex)||rowIndex<0||rowIndex>=cells?.length||cells.length<=1||safeGrid(cells)===null)return null;
 return cells.filter((_,index)=>index!==rowIndex).map(row=>row.map(cell=>({...cell})));
}

/** Delete one logical column, preserving unaffected merged cells and updating
 * corresponding explicit widths. Reject a column cutting through a colspan. */
export function removeTableColumn<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],columnIndex:number,columnWidths?:number[]
):{cells:T[][];columnWidths?:number[]}|null{
 const width=safeGrid(cells);
 if(width===null||width<=1||!Number.isInteger(columnIndex)||columnIndex<0||columnIndex>=width)return null;
 if(columnWidths!==undefined&&(!Array.isArray(columnWidths)||columnWidths.length!==width||columnWidths.some(value=>!Number.isFinite(value)||value<=0)))return null;
 const result:T[][]=[];
 for(const row of cells){
  let position=0,remove=-1;
  for(let index=0;index<row.length;index++){
   const span=row[index].colSpan??1;
   if(position<=columnIndex&&columnIndex<position+span){
    if(span!==1)return null;
    remove=index;break;
   }
   position+=span;
  }
  if(remove<0)return null;
  result.push(row.filter((_,index)=>index!==remove).map(cell=>({...cell})));
 }
 return {cells:result,...(columnWidths?{columnWidths:columnWidths.filter((_,index)=>index!==columnIndex)}:{})};
}

/** Swap adjacent complete rows without rewriting cell identities or contents.
 * Reject irregular grids and vertical spans rather than corrupting the table.
 */
export function moveTableRow<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],rowIndex:number,direction:-1|1
):T[][]|null{
 if(safeGrid(cells)===null||!Number.isInteger(rowIndex)||rowIndex<0||
   rowIndex>=cells.length||(direction!==-1&&direction!==1))return null;
 const target=rowIndex+direction;
 if(target<0||target>=cells.length)return null;
 const result=cells.map(row=>row.map(cell=>({...cell})));
 [result[rowIndex],result[target]]=[result[target],result[rowIndex]];
 return result;
}

/** Swap two adjacent logical columns across every row. A span covering either
 * column is rejected; spans elsewhere may be preserved unchanged.
 * Explicit column widths travel with their cells.
 */
export function moveTableColumn<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],columnIndex:number,direction:-1|1,columnWidths?:number[]
):{cells:T[][];columnWidths?:number[]}|null{
 const width=safeGrid(cells);
 if(width===null||width<=1||!Number.isInteger(columnIndex)||columnIndex<0||
   columnIndex>=width||(direction!==-1&&direction!==1))return null;
 const target=columnIndex+direction;
 if(target<0||target>=width)return null;
 if(columnWidths!==undefined&&(!Array.isArray(columnWidths)||columnWidths.length!==width||
   columnWidths.some(value=>!Number.isFinite(value)||value<=0)))return null;
 const result:T[][]=[];
 for(const row of cells){
  let position=0;
  const indices=new Map<number,number>();
  for(let i=0;i<row.length;i++){
   const span=row[i].colSpan??1;
   if(span===1)indices.set(position,i);
   position+=span;
  }
  const first=indices.get(columnIndex),second=indices.get(target);
  if(first===undefined||second===undefined)return null;
  const next=row.map(cell=>({...cell}));
  [next[first],next[second]]=[next[second],next[first]];
  result.push(next);
 }
 if(!columnWidths)return {cells:result};
 const nextWidths=[...columnWidths];
 [nextWidths[columnIndex],nextWidths[target]]=[nextWidths[target],nextWidths[columnIndex]];
 return {cells:result,columnWidths:nextWidths};
}

/** Whether a row can be duplicated without changing the logical grid. */
export function canDuplicateTableRow<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],rowIndex:number
):boolean{
 return safeGrid(cells)!==null&&Number.isInteger(rowIndex)&&rowIndex>=0&&rowIndex<cells.length;
}

/** Insert a deep copy of a row immediately after its source.
 * New cell IDs are mandatory; unsafe grids or exhausted ID generators are
 * rejected without modifying the original table.
 */
export function duplicateTableRow<T extends {id:string;colSpan?:number;rowSpan?:number}>(
 cells:T[][],rowIndex:number,makeId:()=>string
):T[][]|null{
 if(!canDuplicateTableRow(cells,rowIndex))return null;
 const used=new Set(cells.flat().map(cell=>cell.id));
 const duplicate:T[]=[];
 for(const cell of cells[rowIndex]){
  let nextId:string|undefined;
  for(let attempt=0;attempt<100;attempt++){
   const candidate=makeId();
   if(typeof candidate==='string'&&candidate.length>0&&!used.has(candidate)){
    used.add(candidate);
    nextId=candidate;
    break;
   }
  }
  if(!nextId)return null;
  duplicate.push({...structuredClone(cell),id:nextId});
 }
 const result=cells.map(row=>row.map(cell=>structuredClone(cell)));
 result.splice(rowIndex+1,0,duplicate);
 return result;
}
