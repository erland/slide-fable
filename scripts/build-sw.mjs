import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir){let result=[];for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())result.push(...await files(dir+'/'+f.name));else result.push(dir+'/'+f.name);}return result;}
const paths=(await files('dist')).map(p=>p.slice(5)).filter(p=>p!=='sw.js').sort();
const hash=createHash('sha256');for(const p of paths){hash.update(p);hash.update(await readFile('dist/'+p));}
const release=hash.digest('hex').slice(0,20);
let code=await readFile('src/pwa/sw-template.js','utf8');
code=code.replace('@@RELEASE@@',release).replace('/*@FILES@*/[]',JSON.stringify(paths));
await writeFile('dist/sw.js',code);
console.log(JSON.stringify({release,precacheFiles:paths.length}));
