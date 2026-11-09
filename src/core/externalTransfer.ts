import type {D} from './model';
const uid=(prefix:string)=>prefix+'-'+crypto.randomUUID();

/** Convert foreign clipboard HTML to a small subset of PPD rich text.
 * The HTML is never mounted in the editor; only text and approved inline marks survive.
 */
export function externalRichText(text:string,html='',parseHtml?: (markup:string)=>Document):D{
 if(text.length>100000||html.length>500000)throw Error('Urklippets text är för stor.');
 const paragraphs:D[]=[];
 const addParagraph=(runs:D[])=>{
  const clean=runs.filter(run=>typeof run.text==='string'&&run.text.length);
  if(clean.length)paragraphs.push({id:uid('p'),runs:clean});
 };
 if(html&&parseHtml){
  const page=parseHtml(html),root=page.body;
  let runs:D[]=[];
  const flush=()=>{addParagraph(runs);runs=[];};
  const append=(value:string,marks:string[])=>{
   if(value)runs.push({text:value,...(marks.length?{marks:Object.fromEntries(marks.map(mark=>[mark,true]))}:{})});
  };
  const walk=(node:Node,marks:string[],depth:number)=>{
   if(depth>40)return;
   if(node.nodeType===3){append(node.textContent??'',marks);return;}
   if(node.nodeType!==1)return;
   const el=node as Element,tag=el.tagName.toLowerCase();
   if(['script','style','template','svg','iframe','object','embed','form','input','button','noscript','head'].includes(tag))return;
   if(tag==='br'){flush();return;}
   const next=[...marks];
   if(['b','strong'].includes(tag)&&!next.includes('bold'))next.push('bold');
   if(['em','i'].includes(tag)&&!next.includes('italic'))next.push('italic');
   if(tag==='u'&&!next.includes('underline'))next.push('underline');
   if(['s','strike','del'].includes(tag)&&!next.includes('strike'))next.push('strike');
   const block=['div','p','h1','h2','h3','h4','h5','h6','li','blockquote'].includes(tag);
   if(block&&runs.length)flush();
   if(tag==='li')append('• ',next);
   for(const child of Array.from(el.childNodes))walk(child,next,depth+1);
   if(block&&runs.length)flush();
  };
  for(const child of Array.from(root.childNodes))walk(child,[],0);
  flush();
 }
 if(!paragraphs.length){
  for(const line of text.split(/\r\n|\r|\n/))addParagraph([{text:line}]);
 }
 if(!paragraphs.length)throw Error('Urklippet innehåller ingen användbar text.');
 // Cap the actual inserted content even when HTML has a lot of hidden text.
 if(paragraphs.length>300||paragraphs.reduce((n,p)=>n+p.runs.reduce((sum:number,r:D)=>sum+r.text.length,0),0)>100000)
  throw Error('Urklippets text är för stor.');
 return {paragraphs};
}

export function transferableImage(files:Iterable<File>):File|undefined{
 return Array.from(files).find(file=>['image/png','image/jpeg','image/webp'].includes(file.type));
}

export function hasExternalContent(data:Pick<DataTransfer,'getData'|'files'>){
 return !!transferableImage(data.files)||!!data.getData('text/plain')||!!data.getData('text/html');
}
