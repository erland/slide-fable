import {mkdir,readFile,copyFile,writeFile,readdir,rm} from 'node:fs/promises';
import sharp from 'sharp';
// Remove only this project's reproducible output; Vite 8 may retain old chunks.
await rm(new URL('../dist',import.meta.url),{recursive:true,force:true});
await mkdir('public/icons',{recursive:true});await mkdir('public/fonts',{recursive:true});
const svg=await readFile('public/icons/icon.svg');
for(const size of [192,512])await sharp(svg).resize(size,size).png().toFile(`public/icons/icon-${size}.png`);
await sharp({create:{width:512,height:512,channels:4,background:'#152d39'}}).composite([{input:await sharp(svg).resize(380,380).png().toBuffer(),left:66,top:66}]).png().toFile('public/icons/maskable-512.png');
for(const file of ['DejaVuSans.ttf','DejaVuSans-Bold.ttf','LICENSE.txt'])await copyFile('spikes/dev002/fonts/'+file,'public/fonts/'+file);
let notices='Slide Fable runtime dependency notices\nFont license: fonts/LICENSE.txt\n';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
for(const [folder,info] of Object.entries(lock.packages)){if(!folder||info.dev)continue;const files=await readdir(folder);const licenses=files.filter(f=>/^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i.test(f));notices+='\n\n=== '+folder.replace(/^node_modules\//,'')+' '+info.version+' ('+(info.license??'see package')+') ===\n';for(const file of licenses)try{notices+=await readFile(folder+'/'+file,'utf8')+'\n';}catch{/* license directory is covered by its package metadata */}}
await writeFile('public/THIRD_PARTY_NOTICES.txt',notices);
