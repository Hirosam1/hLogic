class Vec2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

const verticesTypes = {node : 'node', input: 'input', output: 'output',
                       source : 'source', sink : 'sink'}

class Vertex{
    //Vertex information
    constructor(value=undefined, type=verticesTypes.node){
        this.value = value;
        this.type = type;
        this.nextVertices=[];
    }

    addNextVertex(nextVertex){ this.nextVertices.push(nextVertex); }
}

class Edge{
    //Create connection between vertices
    constructor(vertexA, vertexB, twoWay=true){
        vertexA.addNextVertex(vertexB);
        if(twoWay){
            vertexB.addNextVertex(vertexA);
        }
        this.vertexA = vertexA;
        this.vertexB = vertexB;
    }
}

/*Graph rules:
* One output can link to one and multiple input.
* One input can link to one and only one.
*/
const maxIt = 20;
let __verticesMatch = 0;
let __iterationsMade = 0;

let verticesSaved = false;
let verticesPosList = [];
let edgesList = [];

function addVertex(vertex, pos){
    verticesPosList.push({pos, vertex});
    verticesSaved = false;
}

function checkPosVertex(x, y){
    let rtrn = undefined;
    verticesPosList.forEach(v => {
        if(v.pos.x == x && v.pos.y == y){
            rtrn = v;
        }
    });
    return rtrn;
}

function clearVertices(){
    verticesPosList = [];
    __verticesMatch = 0;
    __iterationsMade = 0;
    verticesSaved = false;
    edgesList = [];
}

const propMaxIterations = 25;

function propagateUtilNull(startVertex){
    let gIt = 0;
    let nextVert = startVertex;
    const sVal = startVertex.value;
    let lastVert = undefined;
    console.log('Start propagation of value: ' + sVal);
    //Recursive operation
    while(nextVert && gIt < propMaxIterations){
        gIt++;
        nextVert.value = sVal;
        let nextVerts = [];
        nextVert.nextVertices.forEach(v => {
            if(v != lastVert){
                nextVerts.push(v);
            };
        });
        lastVert = nextVert;
        //Broadcast to all edges ??
        nextVert = nextVerts[0];
    }
    return lastVert;
}

const propagateMaxIterations = 100;
let propagateIterations = 0;

function propagateUtilNullR(value, nextVertices, lastVert=undefined){
    if(propagateIterations >= propagateMaxIterations){
        console.error('Max iterations reached!!');
        return undefined;
    }
    if(nextVertices.length > 0){
        let lastVerts = [];
        nextVertices.forEach(nextVert =>{
            //console.log(nextVert.type);
            propagateIterations++;
            nextVert.value = value;
            //Remove lastVert use filter??
            let nextVerts = [];
            nextVert.nextVertices.forEach(v => {if(v != lastVert){nextVerts.push(v);}});
            //Recursive operation
            let newLasts = propagateUtilNullR(value, nextVerts, nextVert);
            if(newLasts){lastVerts.push(newLasts);}else{
                return undefined;
            }
        });
        return lastVerts;
    }else{return [lastVert];}
}