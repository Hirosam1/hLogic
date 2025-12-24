class Icon{
    constructor(imgSrc, ratio, img=null, type='image'){
        this.imgSrc = imgSrc;
        this.ratio = ratio;
        this.img = img;
        this.type =type;
    }
}

class CanvasGraphItem{
    constructor(x, y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        //Graph logic.
        this.inputsYPos=[1/3.0,2/3.0]
        this.outputYPos=1/3.0;
        this.inputsVertices=[];
        this.outputVertex=undefined;
    }

    checkAndAddVertex(x, y, type){
        let v = checkPosVertex(x, y);
        if(!v){
            v =  new Vertex(type=type);
            addVertex(v, {x, y});
        }else{
            __verticesMatch++;
        }
        return v;
    }

    createVertices(){
        this.inputsVertices=[];
        this.inputsYPos.forEach(yPos => {
            this.inputsVertices.push(this.checkAndAddVertex(this.x, 
                Math.round(yPos*this.height)+this.y, 'input'));
        });
        if(this.outputYPos > 0){
            this.outputVertex = this.checkAndAddVertex(this.x+this.width,
                Math.round(this.outputYPos*this.height)+this.y, 'output')
        }
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
}

class OperatorCanvasItem extends CanvasItem{
    constructor(operator, x, y, width, height){
        super(x, y, width, height);
        this.operator = operator;
        this.type='operator';
        this.graphItem = new CanvasGraphItem(x, y, width, height);
        //!!! BAD!! MOVE THIS !!!
        if(this.operator.name == 'switch'){
            this.graphItem.outputYPos=1/2;
            this.graphItem.inputsYPos= [];
        }else if(this.operator.name == 'output'){
            this.graphItem.outputYPos=0;
            this.graphItem.inputsYPos= [1/2];
        }
    }

    updatePos(x, y){
        this.x = x;
        this.y = y;
        this.graphItem.x = x;
        this.graphItem.y = y;
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

    createVertices(){
        if(this.isStraight){
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
}