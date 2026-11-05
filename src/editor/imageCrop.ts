export type Crop={x:number;y:number;width:number;height:number};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function coverCrop(imageWidth:number,imageHeight:number,frameWidth:number,frameHeight:number):Crop{
 if(![imageWidth,imageHeight,frameWidth,frameHeight].every(n=>Number.isFinite(n)&&n>0))throw Error('INVALID_CROP_DIMENSIONS');
 const ratio=(frameWidth/frameHeight)/(imageWidth/imageHeight);
 const width=Math.min(1,ratio),height=Math.min(1,1/ratio);
 return {x:(1-width)/2,y:(1-height)/2,width,height};
}
export function normalizeCrop(crop:Crop):Crop{
 if(![crop.x,crop.y,crop.width,crop.height].every(Number.isFinite)||crop.width<=0||crop.height<=0)throw Error('INVALID_CROP');
 const width=clamp(crop.width,.001,1),height=clamp(crop.height,.001,1);
 return {x:clamp(crop.x,0,1-width),y:clamp(crop.y,0,1-height),width,height};
}
export function panCrop(crop:Crop,dx:number,dy:number,viewportWidth:number,viewportHeight:number):Crop{
 if(![dx,dy,viewportWidth,viewportHeight].every(Number.isFinite)||viewportWidth<=0||viewportHeight<=0)throw Error('INVALID_CROP_PAN');
 return normalizeCrop({...crop,x:crop.x-dx/viewportWidth*crop.width,y:crop.y-dy/viewportHeight*crop.height});
}
export function zoomCrop(crop:Crop,base:Crop,zoom:number):Crop{
 if(!Number.isFinite(zoom)||zoom<1||zoom>1000)throw Error('INVALID_CROP_ZOOM');
 const width=base.width/zoom,height=base.height/zoom;
 return normalizeCrop({x:crop.x+crop.width/2-width/2,y:crop.y+crop.height/2-height/2,width,height});
}
