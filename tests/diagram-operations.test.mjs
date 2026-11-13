import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveDiagramNode,removeDiagramNode,createDiagramEdge,retargetDiagramEdge,removeDiagramEdge} from '../src/editor/diagramOperations.ts';

const fixture=()=>({
 kind:'hierarchy',
 nodes:[{id:'a',label:'A'},{id:'b',label:'B',parentId:'a'},{id:'c',label:'C',parentId:'b'}],
 edges:[{id:'ab',from:'a',to:'b',label:'Samband'},{id:'bc',from:'b',to:'c'}],
 layout:{direction:'lr'}
});
test('reorder preserves identities, parents and connections',()=>{
 const original=fixture(),before=structuredClone(original);
 const moved=moveDiagramNode(original,0,1);
 assert.deepEqual(moved.nodes.map(n=>n.id),['b','a','c']);
 assert.deepEqual(moved.edges,original.edges);
 assert.equal(moved.nodes[0].parentId,'a');
 assert.deepEqual(original,before);
 assert.equal(moveDiagramNode(original,0,-1),null);
 assert.equal(moveDiagramNode(original,2,1),null);
});
test('removing a node cleans dangling edges and direct parent references',()=>{
 const original=fixture(),next=removeDiagramNode(original,'b');
 assert.deepEqual(next.nodes.map(n=>n.id),['a','c']);
 assert.equal(next.nodes[1].parentId,undefined);
 assert.deepEqual(next.edges,[]);
 assert.equal(original.nodes.length,3);
 assert.equal(removeDiagramNode(original,'missing'),null);
 assert.equal(removeDiagramNode({...original,nodes:[original.nodes[0]]},'a'),null);
});
test('connections have unique IDs and endpoints, cannot self-reference or duplicate',()=>{
 const original=fixture();
 assert.equal(createDiagramEdge(original,'a','x','new'),null);
 assert.equal(createDiagramEdge(original,'a','a','new'),null);
 assert.equal(createDiagramEdge(original,'a','b','new'),null);
 const linked=createDiagramEdge(original,'a','c','ac');
 assert.equal(linked.edges.length,3);
 assert.equal(retargetDiagramEdge(linked,'ac','b','c'),null);
 const updated=retargetDiagramEdge(linked,'ac','c','a');
 assert.deepEqual(updated.edges[2],{id:'ac',from:'c',to:'a'});
 assert.equal(updated.edges[0].label,'Samband');
 const removed=removeDiagramEdge(updated,'ab');
 assert.deepEqual(removed.edges.map(e=>e.id),['bc','ac']);
 assert.equal(removeDiagramEdge(original,'missing'),null);
 assert.equal(original.edges.length,2);
});
