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
        if(value===undefined){
            this.value = crypto.randomUUID();
        }
    }

    addNextVertex(nextVertex){
        this.nextVertices.push(nextVertex);
    }
}

class Edge{
    //Create connection between vertices
    constructor(vertexA, vertexB, twoWay=true){
        vertexA.addNextVertex(vertexA);
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