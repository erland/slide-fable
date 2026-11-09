/** Normalized polygon geometry shared by insert icons and the rendered editable shapes.
 * The native PowerPoint counterparts use the same conventional preset names.
 */
export const polygonShapes={
 diamond:[[50,0],[100,50],[50,100],[0,50]],
 hexagon:[[25,0],[75,0],[100,50],[75,100],[25,100],[0,50]],
 pentagon:[[50,0],[100,38],[82,100],[18,100],[0,38]],
 chevron:[[0,0],[72,0],[100,50],[72,100],[0,100],[28,50]]
} as const;

export type PolygonShape=keyof typeof polygonShapes;
export function isPolygonShape(shape:string):shape is PolygonShape{return Object.prototype.hasOwnProperty.call(polygonShapes,shape);}
export function shapePolygonPoints(shape:PolygonShape,width:number,height:number):string{
 return polygonShapes[shape].map(([x,y])=>`${(x*width/100).toFixed(3)},${(y*height/100).toFixed(3)}`).join(' ');
}
