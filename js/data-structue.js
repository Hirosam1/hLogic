class Vec2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class Node{
    constructor(value=0, edgesN=1, type=undefined){
        this.value = value;
        this.edgesN=edgesN;
        this.nextNodes=[];
        for(i=0; i < edgesN; i++){
            this.nextNodes.push(undefined);
        }
    }

}

class Edge{
    constructor(nodeA, nodeB){
        this.nodeA = nodeA;
        this.nodeB = nodeB;
    }
}