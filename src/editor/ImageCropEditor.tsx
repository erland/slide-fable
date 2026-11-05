import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {coverCrop,normalizeCrop,panCrop,zoomCrop,type Crop} from './imageCrop';
import type {D} from '../core/model';

export function ImageCropEditor({element,source,onApply}:{element:D;source:string;onApply:(crop:Crop|null)=>void}){
 const [open,setOpen]=useState(false),[base,setBase]=useState<Crop|null>(null),[crop,setCrop]=useState<Crop>({x:0,y:0,width:1,height:1}),[error,setError]=useState('');
 const gesture=useRef<{id:number;x:number;y:number;crop:Crop;width:number;height:number}|null>(null);
 useEffect(()=>{
  let active=true;const image=new Image();setBase(null);setError('');
  image.onload=()=>{if(active)try{setBase(coverCrop(image.naturalWidth,image.naturalHeight,element.geometry.width,element.geometry.height));}catch{setError('Bildens eller ramens mått kan inte beskäras.');}};
  image.onerror=()=>{if(active)setError('Bilden kunde inte läsas för beskärning.');};image.src=source;
  return ()=>{active=false;};
 },[source,element.geometry.width,element.geometry.height]);
 const begin=()=>{if(!base)return;try{setCrop(element.crop?normalizeCrop(element.crop):base);setError('');setOpen(true);}catch{setError('Det befintliga utsnittet är ogiltigt. Ta bort beskärningen och försök igen.');}};
 const start=(event:PointerEvent<HTMLDivElement>)=>{
  if(!event.isPrimary||event.button!==0)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,crop,width:bounds.width,height:bounds.height};
  event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();event.currentTarget.focus();
 };
 const move=(event:PointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(g?.id===event.pointerId)setCrop(panCrop(g.crop,event.clientX-g.x,event.clientY-g.y,g.width,g.height));};
 const finish=(event:PointerEvent<HTMLDivElement>,cancel=false)=>{const g=gesture.current;if(g?.id!==event.pointerId)return;if(cancel)setCrop(g.crop);else setCrop(panCrop(g.crop,event.clientX-g.x,event.clientY-g.y,g.width,g.height));gesture.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 const zoom=base?Math.max(1,base.width/crop.width,base.height/crop.height):1;
 return <div className="image-crop-editor"><button type="button" disabled={!base||element.locked} onClick={begin}>Beskär bild visuellt</button>{error&&<p role="alert">{error}</p>}{open&&base&&<section aria-label="Visuell bildbeskärning"><p>Dra motivet eller använd piltangenterna. Zooma och välj Tillämpa när utsnittet är klart.</p><div className="crop-preview" role="group" aria-label="Flytta motivet i beskärningen" tabIndex={0} style={{aspectRatio:element.geometry.width+'/'+element.geometry.height,maxWidth:Math.min(420,260*element.geometry.width/element.geometry.height)}} onPointerDown={start} onPointerMove={move} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={()=>{gesture.current=null;}} onKeyDown={e=>{
  const directions:Record<string,[number,number]>={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};
  const delta=directions[e.key];if(!delta)return;e.preventDefault();const bounds=e.currentTarget.getBoundingClientRect();setCrop(panCrop(crop,delta[0]*(e.shiftKey?5:1),delta[1]*(e.shiftKey?5:1),bounds.width,bounds.height));
 }}><img src={source} alt="" draggable={false} style={{position:'absolute',width:100/crop.width+'%',height:100/crop.height+'%',left:-crop.x/crop.width*100+'%',top:-crop.y/crop.height*100+'%',maxWidth:'none',pointerEvents:'none'}}/><span className="crop-grid" aria-hidden="true"/></div><label>Zooma motiv<input aria-label="Zooma bildbeskärning" type="range" min="1" max={Math.max(5,zoom)} step=".05" value={zoom} onChange={e=>setCrop(zoomCrop(crop,base,Number(e.target.value)))}/></label><output>{Math.round(zoom*100)} %</output><div className="button-row"><button type="button" onClick={()=>{onApply(crop);setOpen(false);}}>Tillämpa beskärning</button><button type="button" onClick={()=>setOpen(false)}>Avbryt beskärning</button><button type="button" onClick={()=>setCrop(base)}>Centrera och återställ zoom</button></div></section>}{element.crop&&<button type="button" disabled={element.locked} onClick={()=>{onApply(null);setOpen(false);}}>Ta bort beskärning</button>}</div>;
}
