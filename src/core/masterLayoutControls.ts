import {copy,uid,type D} from './model.ts';

/** Changes are transactional through EditorStore.transaction. No slide content is rewritten. */
const find=(doc:D,masterId:string,layoutId:string)=>{
 const master=doc.masters?.find((m:D)=>m.id===masterId);
 const layout=master?.layouts?.find((l:D)=>l.id===layoutId);
 if(!master||!layout)throw Error('LAYOUT_NOT_FOUND');
 return {master,layout};
};
export function updateLayoutName(doc:D,masterId:string,layoutId:string,name:string){
 const clean=name.trim();if(!clean||clean.length>100)throw Error('INVALID_LAYOUT_NAME');
 find(doc,masterId,layoutId).layout.name=clean;
}
export function setTemplateBackground(doc:D,masterId:string,layoutId:string|undefined,color:string|undefined){
 if(color!==undefined&&!/^#[0-9a-fA-F]{6}$/.test(color))throw Error('INVALID_BACKGROUND_COLOR');
 const master=doc.masters?.find((m:D)=>m.id===masterId);
 if(!master)throw Error('MASTER_NOT_FOUND');
 const target=layoutId?find(doc,masterId,layoutId).layout:master;
 if(color===undefined)delete target.background;else target.background={type:'color',color:color.toLowerCase()};
}
export function updatePlaceholderGeometry(doc:D,masterId:string,layoutId:string,placeholderId:string,values:Partial<{x:number;y:number;width:number;height:number}>){
 const layout=find(doc,masterId,layoutId).layout;
 const placeholder=layout.placeholders?.find((p:D)=>p.id===placeholderId);
 if(!placeholder)throw Error('PLACEHOLDER_NOT_FOUND');
 const geometry={...placeholder.geometry,...values},canvas=doc.document.canvas;
 for(const key of ['x','y','width','height'])if(!Number.isFinite(geometry[key]))throw Error('INVALID_PLACEHOLDER_GEOMETRY');
 if(geometry.width<12||geometry.height<12||geometry.x<0||geometry.y<0||geometry.x+geometry.width>canvas.width+.001||geometry.y+geometry.height>canvas.height+.001)throw Error('PLACEHOLDER_OUT_OF_BOUNDS');
 placeholder.geometry=geometry;
}
export function duplicateLayout(doc:D,masterId:string,layoutId:string){
 const {master,layout}=find(doc,masterId,layoutId);
 const existing=new Set(master.layouts.map((l:D)=>l.id));let id=uid('layout');while(existing.has(id))id=uid('layout');
 const next=copy(layout);next.id=id;next.name=String(layout.name??'Layout')+' – kopia';
 // Placeholder IDs are referenced only inside a layout. Keeping them preserves its structure.
 master.layouts.push(next);return id;
}
