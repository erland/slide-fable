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
