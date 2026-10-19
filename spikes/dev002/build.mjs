import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
process.chdir(root);
await mkdir('generated',{recursive:true});
const result=await build({entryPoints:['browser.js'],bundle:true,write:false,format:'iife',platform:'browser',target:['safari17','chrome120'],minify:true,legalComments:'eof'});
const regular=await readFile('fonts/DejaVuSans.ttf');
const bold=await readFile('fonts/DejaVuSans-Bold.ttf');
const fonts={regular:regular.toString('base64'),bold:bold.toString('base64')};
const css=`@font-face{font-family:Spike;src:url(data:font/ttf;base64,${fonts.regular})} @font-face{font-family:Spike;font-weight:700;src:url(data:font/ttf;base64,${fonts.bold})}
*{box-sizing:border-box}body{margin:0;background:#e9edf1;font-family:Spike,sans-serif;color:#142533}main{padding:24px;max-width:1200px;margin:auto}h1{font-size:28px}button{padding:12px 18px;margin:6px;font:inherit;border:1px solid #bbc4cc;background:white;border-radius:8px;min-height:44px}.stage{position:relative;width:1600px;height:900px;overflow:hidden;background:white}.text{position:absolute;white-space:pre-wrap;overflow:hidden}.text p{margin:0;line-height:1.3}.text strong{font-weight:700}.shape{position:absolute}.preview{width:100%;aspect-ratio:16/9;overflow:hidden;border:1px solid #c5ccd2;margin:16px 0}.preview .stage{transform-origin:top left}#measure{position:absolute;left:-20000px;top:0}#editor{padding:16px;background:white;min-height:100px;border:1px solid #bbc4cc}.ProseMirror{outline:none}.status{padding:10px 0}a{color:#164ba0} @media(max-width:600px){main{padding:12px}}`;
const html=`<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slide Fable – exportprov</title><style>${css}</style><main><h1>Slide Fable – tekniskt exportprov</h1><p>DEV-002. Prova lokal export; detta är ingen färdig presentationseditor.</p><button id="pdf">Ladda ned sökbar PDF</button><button id="pptx">Ladda ned redigerbar PPTX</button><p class="status" id="status">Förbereder…</p><div id="previews"></div><h2>Rik text: separat teknikprov</h2><div id="editor"></div></main><div id="measure" aria-hidden="true"></div><script>window.SPIKE_FONTS=${JSON.stringify(fonts)};</script><script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></html>`;
await writeFile('generated/index.html',html.replace('DEV-002. Prova lokal export; detta är ingen färdig presentationseditor.','DEV-002. Prova lokal export; detta är ingen färdig presentationseditor. Glaseffekten är förenklad i exporten.'));
console.log(JSON.stringify({htmlBytes:Buffer.byteLength(html),selfContained:true}));
