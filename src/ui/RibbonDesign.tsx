import {layoutOf,masterOf,type D} from '../core/model';
import {themeChoices,type ThemeChoice} from '../core/designGallery';
import {LayoutPreview} from './LayoutPreview';

/** Common design actions belong in the ribbon; detailed customization stays in DesignGallery. */
export function RibbonDesign({doc,slide,disabled,onLayout,onTheme,onReset,onDetails}:{
 doc:D;slide:D;disabled:boolean;onLayout:(id:string)=>void;onTheme:(choice:ThemeChoice)=>void;onReset:()=>void;onDetails:()=>void;
}){
 const master=masterOf(doc,slide)??doc.masters?.[0];
 const current=layoutOf(doc,slide);
 const colors=doc.theme.colors??{};
 const currentTheme=themeChoices.find(t=>t.ink.toLowerCase()===String(colors.ink??'').toLowerCase()&&t.surface.toLowerCase()===String(colors.surface??'').toLowerCase()&&t.accent.toLowerCase()===String(colors.accent??'').toLowerCase());
 return <div className="design-ribbon" aria-label="Designverktyg">
  <div className="design-ribbon-group" role="group" aria-label="Teman">
   <div className="design-ribbon-themes">{themeChoices.map(choice=><button key={choice.id} type="button" disabled={disabled} aria-label={'Använd tema '+choice.name} aria-pressed={currentTheme?.id===choice.id} title={'Tema: '+choice.name} className="design-ribbon-theme" onClick={()=>onTheme(choice)}><span aria-hidden="true" style={{background:choice.surface,color:choice.ink,fontFamily:choice.headingFont}}>Aa<span style={{background:choice.accent}}/></span><small>{choice.name}</small></button>)}</div>
   <span className="design-ribbon-caption">Teman · hela presentationen</span>
  </div>
  <div className="design-ribbon-group" role="group" aria-label="Bildlayout">
   <div className="design-layout-previews" role="group" aria-label="Välj bildlayout">
    {(master?.layouts??[]).map((layout:D)=><button type="button" key={layout.id} className="design-layout-choice" aria-label={'Använd layout '+(layout.name??layout.id)} aria-pressed={current?.id===layout.id} disabled={disabled} title={'Välj layout: '+(layout.name??layout.id)} onClick={()=>onLayout(layout.id)}><LayoutPreview doc={doc} layout={layout} surface={String(colors.surface??'#faf8f2')} ink={String(colors.ink??'#183641')} accent={String(colors.accent??'#cf694c')}/><span>{layout.name??layout.id}</span></button>)}
   </div>
   <button type="button" disabled={disabled||!current} onClick={onReset} title="Återställ platshållarnas placering och formatering">Återställ layout</button>
   <span className="design-ribbon-caption">Aktuell bild</span>
  </div>
  <div className="design-ribbon-group" role="group" aria-label="Fler designval"><button type="button" onClick={onDetails}>Anpassa design…</button><span className="design-ribbon-caption">Färger, typsnitt och mallar</span></div>
 </div>;
}
