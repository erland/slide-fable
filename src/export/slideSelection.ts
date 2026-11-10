import type {D} from '../core/model.ts';

/** Shared selection rule for PDF, PPTX and raster exports.
 * The active slide can be hidden; never export it in that case.
 */
export function selectExportSlides(doc:Pick<D,'slides'>,slideId:string,scope:string):D[]{
 if(scope!=='all'&&scope!=='current')throw Error('Okänt bildurval: '+scope);
 const slides=doc.slides.filter((slide:D)=>!slide.hidden&&(scope==='all'||slide.id===slideId));
 if(!slides.length)throw Error('Minst en synlig bild behövs.');
 return slides;
}
