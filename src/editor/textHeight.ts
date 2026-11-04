/** Expand only when text overflows; never shrink an existing user-sized box. */
export function expandedTextHeight(currentHeight:number,contentHeight:number,paddingTop:number,paddingBottom:number,maxHeight:number):number{
 const numbers=[currentHeight,contentHeight,paddingTop,paddingBottom,maxHeight];
 if(numbers.some(n=>!Number.isFinite(n))||currentHeight<=0||contentHeight<0||paddingTop<0||paddingBottom<0||maxHeight<=0)throw Error('INVALID_TEXT_HEIGHT');
 const desired=Math.ceil(contentHeight+paddingTop+paddingBottom+1);
 return Math.max(currentHeight,Math.min(maxHeight,desired));
}
