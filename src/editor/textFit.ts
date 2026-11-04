/**
 * Finds the largest uniform text scale that fits both dimensions.
 * The renderer supplies actual browser measurements at each scale, so
 * mixed-size runs and line wrapping are included in the calculation.
 */
export function findTextFitScale(fits:(scale:number)=>boolean,minScale=.5,steps=12):number{
 if(!Number.isFinite(minScale)||minScale<=0||minScale>1)throw Error('INVALID_MIN_TEXT_SCALE');
 if(fits(1))return 1;
 if(!fits(minScale))return minScale;
 let low=minScale,high=1;
 for(let i=0;i<steps;i++){
  const mid=(low+high)/2;
  if(fits(mid))low=mid;else high=mid;
 }
 return Math.floor(low*1000)/1000;
}
