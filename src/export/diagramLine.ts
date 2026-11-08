/** Return a PowerPoint line box with positive dimensions for all endpoint directions.
 * The flip flags retain the original start-to-end direction (also for vertical lines).
 */
export function pptxDiagramLine(start:{x:number;y:number},end:{x:number;y:number},units:number){
 if(!Number.isFinite(units)||units<=0||![start.x,start.y,end.x,end.y].every(Number.isFinite))throw new Error('Invalid diagram line geometry');
 return {
  x:Math.min(start.x,end.x)/units,
  y:Math.min(start.y,end.y)/units,
  w:Math.abs(end.x-start.x)/units,
  h:Math.abs(end.y-start.y)/units,
  flipH:end.x<start.x,
  flipV:end.y<start.y,
 };
}
