/** A separately downloadable presentation must not replace the active local working copy. */
import {copy,uid,type D} from './model.ts';
export function saveAsDocument(source:D,requestedTitle:string):D{
 if([...requestedTitle].some(character=>{const code=character.charCodeAt(0);return code<=31||code===127;}))throw Error('Namnet innehåller otillåtna tecken.');
 const title=requestedTitle.trim().replace(/\s+/g,' ');
 if(!title)throw Error('Ange ett namn på den nya presentationen.');
 if(title.length>120)throw Error('Namnet får vara högst 120 tecken.');
 const result=copy(source);
 result.document.id=uid('doc');
 result.document.title=title;
 return result;
}
