/** SF-QUAL-10: diagnostic RGB difference metrics. No release/Office attestations. */
export function compareRgb(editor,pdf,width,height,threshold=24){
 if(!Number.isInteger(width)||width<1||!Number.isInteger(height)||height<1)throw Error('INVALID_IMAGE_SIZE');
 if(!Number.isFinite(threshold)||threshold<0||threshold>255)throw Error('INVALID_DIFFERENCE_THRESHOLD');
 const count=width*height;
 if(editor.length!==count*3||pdf.length!==count*3)throw Error('DIFFERENCE_DIMENSIONS_MISMATCH');
 const difference=new Uint8Array(count*3);
 let sum=0,changed=0,max=0;
 for(let i=0;i<count;i++){
  const pos=i*3;
  const d0=Math.abs(editor[pos]-pdf[pos]),d1=Math.abs(editor[pos+1]-pdf[pos+1]),d2=Math.abs(editor[pos+2]-pdf[pos+2]);
  const peak=Math.max(d0,d1,d2);
  sum+=d0+d1+d2;max=Math.max(max,peak);
  if(peak>threshold){changed++;difference[pos]=255;difference[pos+1]=Math.max(0,225-peak);difference[pos+2]=Math.max(0,225-peak);}
  else{difference[pos]=239;difference[pos+1]=239;difference[pos+2]=239;}
 }
 return {width,height,threshold,meanAbsoluteChannelError:Number((sum/(count*3)).toFixed(4)),
  changedPixelPercent:Number((changed/count*100).toFixed(4)),maxChannelError:max,
  difference};
}
