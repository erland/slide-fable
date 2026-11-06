import {layoutOf,masterOf,type D} from './model.ts';

export type BackgroundScope='current'|'all';
export const backgroundPresets=[
 {name:'Vit',color:'#ffffff'},
 {name:'Ljus',color:'#faf8f2'},
 {name:'Mörk',color:'#173944'},
 {name:'Blå',color:'#dceafa'},
 {name:'Varm',color:'#fff0df'}
];

/** The visible color may come from the slide, layout, master or theme, in that order. */
export function effectiveBackground(doc:D,slide:D):D {
 return slide.view.background??layoutOf(doc,slide)?.background??masterOf(doc,slide)?.background??{type:'color',color:doc.theme.colors?.surface??'#ffffff'};
}
export function backgroundColor(doc:D,slide:D):string{
 const background=effectiveBackground(doc,slide);
 return background.type==='color'&&/^#[0-9a-f]{6}$/i.test(background.color??'')?background.color:doc.theme.colors?.surface??'#ffffff';
}
export function applySlideBackground(doc:D,selectedId:string,color:string,scope:BackgroundScope):void{
 if(!/^#[\da-f]{6}$/i.test(color))throw Error('INVALID_BACKGROUND_COLOR');
 for(const slide of doc.slides)if(scope==='all'||slide.id===selectedId){
  slide.view.background={type:'color',color:color.toLowerCase()};
 }
}
export function resetSlideBackground(doc:D,selectedId:string,scope:BackgroundScope):void{
 for(const slide of doc.slides)if(scope==='all'||slide.id===selectedId)delete slide.view.background;
}
