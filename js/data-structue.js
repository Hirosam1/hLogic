class Vec2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class Vertex{
    constructor(value=0, edgesN=0, type='vertex'){
        this.value = value;
        this.edgesN=edgesN;
        this.type = type;
        this.nextVertices=[];
        if(!value){
            this.value = crypto.randomUUID();
        }
    }

    addNextVertex(vertex){
        this.nextVertices.push(vertex);
        this.edgesN++;
    }
}

class Edge{
    constructor(vertexA, vertexB){
        this.vertexA = vertexA;
        this.vertexB = vertexB;
    }
}

let __verticesMatch = 0;
let __iterationsMade = 0;

let verticesSaved = false;
let verticesPosList = [];

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
}