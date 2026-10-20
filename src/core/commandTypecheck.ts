import type {EditorStore} from './editor.ts';
// This file is compiled by tsc, but never imported or executed.
export function verifyCommandTypes(editor:EditorStore){
 editor.setSlideTitle('Rubrik');
 editor.setElementGeometry('element',{x:0,y:0,width:100,height:50});
 // @ts-expect-error title must be a string
 editor.setSlideTitle(42);
 // @ts-expect-error width must be numeric
 editor.setElementGeometry('element',{x:0,y:0,width:'large',height:50});
}
