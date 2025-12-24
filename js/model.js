class Icon{
    constructor(imgSrc, ratio, img=null, type='image'){
        this.imgSrc = imgSrc;
        this.ratio = ratio;
        this.img = img;
        this.type =type;
    }
}

class CanvasItem{
    constructor(x, y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = 'canvasItem';
    }
}

class Operator{
    constructor(name, logic, icon=null){
        this.name = name;
        this.logic = logic;
        this.icon = icon;
    }
};

class OperatorCanvasItem extends CanvasItem{
    constructor(operator, x, y, width, height){
        super(x, y, width, height);
        this.operator = operator;
        this.type='operator';
        this.inputsYPos = [0.25,0.75];
        this.outputYPos = 0.25;
    }
}

class LineSegmentCanvasItem extends CanvasItem{
    constructor(startX, startY, endX, endY){
        super(Math.min(startX, endX), Math.min(startY, endY), 
              Math.abs(startX - endX), Math.abs(startY - endY));
        this.startPos = {x: startX, y: startY};
        this.endPos = {x: endX, y: endY};
        this.type = 'lineSegment';
        this.isStraight = startX == endX || startY == endY;
        this.edge = new Edge(undefined, undefined);
    }

    checkVertices(){
        __iterationsMade++; 
        //Connect vertices orthogonally to itself.
        let endX = this.x+this.width;
        let endY = this.y+this.height;
        this.edge.vertexA = checkPosVertex(this.x, this.y);
        //Check for the end points connections,
        if(!this.edge.vertexA){
            this.edge.vertexB = new Vertex();
            addVertex(this.edge.vertexB , {x : this.x, y: this.y});
        }else{
                __verticesMatch++;
        }
        this.edge.vertexB = checkPosVertex(endX, endY);
        if(!this.edge.vertexB){
            this.edge.vertexB = new Vertex();
            addVertex(this.edge.vertexB , {x : endX, y: endY});
        }else{
                __verticesMatch++;
        }
    }
}