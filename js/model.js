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
    constructor(name, icon=null){
        this.name = name;
        this.icon = icon;
    }
}

class OperatorCanvasItem extends CanvasItem{
    constructor(operator, x, y, width, height){
        super(x, y, width, height);
        this.operator = operator;
        this.type='operator';
        this.graphItem = new CanvasGraphItem(x, y, width, height);
        this.logic = null;
        if(logicFactory[this.operator.name]){
            this.logic = logicFactory[this.operator.name]();
        }
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
        this.graphItem = new CanvasGraphItem(this.x, this.y, 
            this.width, this.height);
        //this.edge = new Edge(undefined, undefined);
        this.graphItem.inputsYPos = [0];
        this.graphItem.outputYPos = 1;
    }

    updatePos(x, y){
        let deltaX = x - this.x;
        let deltaY = y - this.y;
        this.startPos.x += deltaX;
        this.startPos.y += deltaY;
        this.endPos.x += deltaX;
        this.endPos.y += deltaY;
        this.x = x;
        this.y = y;
        this.graphItem.x = x;
        this.graphItem.y = y;
    }

    createVertices(){
        super.createVertices();
        this.inputsVertices[0].addNextVertex(this.outputVertex);
    }
}