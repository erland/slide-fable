/** Self-contained original line icons. No remote assets, inline HTML or external SVG imports.
 * Paths use a 100x100 coordinate system and are validated by the existing PPD SVG path parser.
 */
export const iconCatalog=[
 {id:'computer',label:'Dator',group:'IT',path:'M 18 20 H 82 V 67 H 18 Z M 50 67 V 80 M 32 80 H 68'},
 {id:'database',label:'Databas',group:'IT',path:'M 17 24 C 17 9 83 9 83 24 C 83 39 17 39 17 24 M 17 24 V 75 C 17 91 83 91 83 75 V 24 M 17 49 C 17 65 83 65 83 49'},
 {id:'cloud',label:'Moln',group:'IT',path:'M 30 75 H 76 C 97 75 97 46 78 42 C 74 12 37 13 30 39 C 5 36 3 75 30 75 Z'},
 {id:'network',label:'Nätverk',group:'IT',path:'M 42 12 H 58 V 30 H 42 Z M 14 66 H 30 V 84 H 14 Z M 70 66 H 86 V 84 H 70 Z M 50 30 V 49 H 22 V 66 M 50 49 H 78 V 66'},
 {id:'person',label:'Person',group:'Verksamhet',path:'M 50 13 A 17 17 0 1 1 49.99 13 M 18 87 C 18 49 82 49 82 87 Z'},
 {id:'team',label:'Arbetsgrupp',group:'Verksamhet',path:'M 50 14 A 13 13 0 1 1 49.99 14 M 16 32 A 10 10 0 1 1 15.99 32 M 83 32 A 10 10 0 1 1 82.99 32 M 27 87 C 27 51 73 51 73 87 M 8 78 C 8 57 21 53 33 57 M 92 78 C 92 57 79 53 67 57'},
 {id:'shield',label:'Säkerhet',group:'IT',path:'M 50 9 L 83 20 V 48 C 83 72 68 86 50 93 C 32 86 17 72 17 48 V 20 Z M 35 49 L 45 59 L 66 36'},
 {id:'gear',label:'Inställningar',group:'IT',path:'M 44 10 H 56 L 60 22 L 71 27 L 83 21 L 91 31 L 83 41 L 84 53 L 92 64 L 84 75 L 71 71 L 60 78 L 56 91 H 44 L 40 78 L 29 71 L 16 75 L 8 64 L 16 53 L 17 41 L 9 31 L 17 21 L 29 27 L 40 22 Z M 50 38 A 12 12 0 1 1 49.99 38'},
 {id:'flow',label:'Process',group:'Verksamhet',path:'M 10 36 H 36 V 65 H 10 Z M 64 12 H 90 V 41 H 64 Z M 64 62 H 90 V 91 H 64 Z M 36 50 H 49 V 26 H 64 M 49 50 V 76 H 64'}
] as const;
export type IconChoice=(typeof iconCatalog)[number];
export function findIcon(id:string):IconChoice|undefined{return iconCatalog.find(icon=>icon.id===id);}
export function iconElement(id:string,elementId:string){
 const icon=findIcon(id);
 if(!icon)throw Error('UNKNOWN_ICON');
 return {id:elementId,type:'vectorPath',geometry:{x:240,y:230,width:260,height:260,rotation:0,unit:'logical'},
   vectorPath:{format:'svg-path',pathData:icon.path,viewBox:'0 0 100 100',closed:false},
   style:{fill:{color:'#ffffff',opacity:0},stroke:{color:'#183641'},strokeWidth:5},
   accessibility:{altText:icon.label}};
}
