/** A single list of the persisted PPD text overflow policies for editor controls. */
export const textOverflowOptions=[
 {value:'clip',label:'Klipp texten'},
 {value:'warn',label:'Varna när text inte ryms'},
 {value:'shrink-to-fit',label:'Minska texten så den ryms'},
 {value:'expand-height',label:'Öka textrutans höjd'}
] as const;
export type TextOverflowPolicy=(typeof textOverflowOptions)[number]['value'];
export function textOverflowPolicy(text:unknown):TextOverflowPolicy{
 if(text&&typeof text==='object'&&'overflow' in text){
  const policy=(text as {overflow?:unknown}).overflow;
  if(textOverflowOptions.some(option=>option.value===policy))return policy as TextOverflowPolicy;
 }
 return 'clip';
}
