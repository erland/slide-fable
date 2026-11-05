import type {D} from '../core/model.ts';
export type ParagraphFormatKey='lineSpacing'|'marginBefore'|'marginAfter'|'indent';
export function paragraphFormat(style:D,key:ParagraphFormatKey,value:number):D{
 const minimum=key==='lineSpacing'?.5:0,maximum=key==='lineSpacing'?4:200;
 if(!['lineSpacing','marginBefore','marginAfter','indent'].includes(key)||!Number.isFinite(value)||value<minimum||value>maximum)throw Error('INVALID_PARAGRAPH_FORMAT');
 return {...style,[key]:value};
}
export function paragraphCss(style:D={}):string{
 return [style.lineSpacing!==undefined?'line-height: '+style.lineSpacing:undefined,style.marginBefore!==undefined?'margin-top: '+style.marginBefore+'px':undefined,style.marginAfter!==undefined?'margin-bottom: '+style.marginAfter+'px':undefined,style.indent!==undefined?'padding-left: '+style.indent+'px':undefined].filter(Boolean).join('; ');
}
