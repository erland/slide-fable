import {useState} from 'react';
import {backgroundColor,backgroundPresets,type BackgroundScope} from '../core/backgroundControls';
import {layoutOf,masterOf,type D} from '../core/model';
import {themeChoices,type ThemeChoice} from '../core/designGallery';
import {LayoutPreview} from './LayoutPreview';

/** Common design actions belong in the ribbon; detailed customization stays in DesignGallery. */
export function RibbonDesign({doc,slide,disabled,onLayout,onTheme,onReset,onDetails,onBackground,onResetBackground}:{
 doc:D;slide:D;disabled:boolean;onLayout:(id:string)=>void;onTheme:(choice:ThemeChoice)=>void;onReset:()=>void;onDetails:()=>void;onBackground:(color:string,scope:BackgroundScope)=>void;onResetBackground:(scope:BackgroundScope)=>void;
}){
 const [scope,setScope]=useState<BackgroundScope>('current');
 const background=backgroundColor(doc,slide);
 const overridden=scope==='all'?doc.slides.some((s:D)=>s.view.background!==undefined):slide.view.background!==undefined;
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
  <div className="design-ribbon-group design-background-tools" role="group" aria-label="Bildbakgrund">
   <label className="design-background-scope">Gäller
    <select aria-label="Bakgrund gäller" value={scope} onChange={e=>setScope(e.target.value as BackgroundScope)}>
     <option value="current">Aktuell bild</option><option value="all">Alla bilder</option>
    </select>
   </label>
   <div className="design-background-swatches" role="group" aria-label="Bakgrundsfärger">
    {backgroundPresets.map(preset=><button type="button" key={preset.color} disabled={disabled} aria-label={'Bakgrund '+preset.name} title={preset.name} style={{background:preset.color}} onClick={()=>onBackground(preset.color,scope)}/>)}
   </div>
   <label className="design-background-picker">Egen färg
    <input type="color" aria-label="Välj bakgrundsfärg" disabled={disabled} value={background.slice(0,7)} onChange={e=>onBackground(e.target.value,scope)}/>
   </label>
   <button type="button" disabled={disabled||!overridden} onClick={()=>onResetBackground(scope)} title="Ta bort explicit bakgrund och använd layoutens, masterns eller temats bakgrund">Återställ bakgrund</button>
   <span className="design-ribbon-caption">Bakgrund · {scope==='all'?'hela presentationen':'aktuell bild'}</span>
  </div>
  <div className="design-ribbon-group" role="group" aria-label="Fler designval"><button type="button" onClick={onDetails}>Anpassa design…</button><span className="design-ribbon-caption">Färger, typsnitt och mallar</span></div>
 </div>;
}
