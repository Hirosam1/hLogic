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

//=== Graph logic ===
const propagateMaxIterations = 2000;
let propagateIterations = 0;
let __verticesMatch = 0;
let verticesPosList = [];
let edgesList = [];

function addVertex(vertex, pos){
    verticesPosList.push({pos, vertex});
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

function getVertexPos(vertex){
    for(let i = 0; i < verticesPosList.length; i++){
        if(verticesPosList[i].vertex === vertex){
            return verticesPosList[i].pos;
        }
    }
    return undefined;
}

function clearVertices(){
    verticesPosList = [];
    __verticesMatch = 0;
    edgesList = [];
}

/**
 * Propagates the value of one vertices. It returns all the last vertices that had a
 * change of value, the vertex won't return if the has same value as the propagated vertex.
 * @param {Vertex} startVertex The starting point of the propagation.
 * @returns {Vertex[]} endVertices The last vertices that were updated.
 */
function propagateVertex(startVertex){
    const value = startVertex.value;
    let endVertices = [];
    let nextIterations = [{lastVertex: undefined, verts: [startVertex]}];
    let nextIt = nextIterations[0];
    while(nextIterations.length > 0){
        propagateIterations++;
        if(propagateIterations >= propagateMaxIterations){
            console.error('Max iterations reached!!');
            return undefined;
        }
        let vert = nextIt.verts.pop();
        let newVertices = vert.nextVertices.filter(v => v !== nextIt.lastVertex);
        if(newVertices.length == 0){
            if(vert.value !== value) endVertices.push(vert);
        }else{
            nextIterations.push({lastVertex: vert, verts: newVertices});
        }
        vert.value = value;
        if(nextIt.verts.length === 0){
             nextIterations.splice(0,1);
             nextIt = nextIterations[0];
        }
    }
    return endVertices;
}