/** Graph-safe edits for semantic diagrams. Never mutate supplied PPD.
 * Existing node/edge identities and author-defined links survive reordering. */
export type DiagramNode={id:string;label:string;parentId?:string;[key:string]:unknown};
export type DiagramEdge={id:string;from:string;to:string;[key:string]:unknown};
export type DiagramData={nodes:DiagramNode[];edges?:DiagramEdge[];[key:string]:unknown};

export function moveDiagramNode<T extends DiagramData>(diagram:T,index:number,delta:-1|1):T|null{
 const target=index+delta;
 if(!Number.isInteger(index)||target<0||target>=diagram.nodes.length)return null;
 const next=structuredClone(diagram);
 [next.nodes[index],next.nodes[target]]=[next.nodes[target],next.nodes[index]];
 return next;
}
export function removeDiagramNode<T extends DiagramData>(diagram:T,id:string):T|null{
 if(!diagram.nodes.some(node=>node.id===id)||diagram.nodes.length<=1)return null;
 const next=structuredClone(diagram);
 next.nodes=next.nodes.filter(node=>node.id!==id);
 // A deleted parent must not leave invalid references in surviving nodes.
 next.nodes.forEach(node=>{if(node.parentId===id)delete node.parentId;});
 next.edges=(next.edges??[]).filter(edge=>edge.from!==id&&edge.to!==id);
 return next;
}
export function createDiagramEdge<T extends DiagramData>(diagram:T,from:string,to:string,id:string):T|null{
 const ids=new Set(diagram.nodes.map(node=>node.id));
 if(!from||!to||from===to||!ids.has(from)||!ids.has(to)||!id||
  (diagram.edges??[]).some(edge=>edge.id===id||(edge.from===from&&edge.to===to)))return null;
 const next=structuredClone(diagram);
 next.edges=[...(next.edges??[]),{id,from,to}];
 return next;
}
export function retargetDiagramEdge<T extends DiagramData>(diagram:T,id:string,from:string,to:string):T|null{
 const ids=new Set(diagram.nodes.map(node=>node.id));
 if(!ids.has(from)||!ids.has(to)||from===to||
  (diagram.edges??[]).some(edge=>edge.id!==id&&edge.from===from&&edge.to===to))return null;
 if(!(diagram.edges??[]).some(edge=>edge.id===id))return null;
 const next=structuredClone(diagram);
 next.edges=(next.edges??[]).map(edge=>edge.id===id?{...edge,from,to}:edge);
 return next;
}
export function removeDiagramEdge<T extends DiagramData>(diagram:T,id:string):T|null{
 if(!(diagram.edges??[]).some(edge=>edge.id===id))return null;
 const next=structuredClone(diagram);
 next.edges=(next.edges??[]).filter(edge=>edge.id!==id);
 return next;
}
