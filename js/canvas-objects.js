class Icon{
    constructor(imgSrc, ratio, img=null, type='image'){
        this.imgSrc = imgSrc;
        this.ratio = ratio;
        this.img = img;
        this.type =type;
    }
}

class CanvasGraphItem{
    constructor(x, y, width, height, type='function', logic = undefined){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.logic = logic;
        //Graph logic from the ui.
        this.inputsYPos=[1/3.0,2/3.0];
        this.outputYPos=1/3.0;
        this.inputsVertices=[];
        this.outputVertex=undefined;
        this.isReady=false;
    }

    checkAndAddVertex(x, y, type){
        let v = checkPosVertex(x, y);
        if(!v){
            v =  new Vertex();
            v.type = type;
            addVertex(v, {x, y});
        }else{
            v = v.vertex;
            v.type = type;
            __verticesMatch++;
        }
        return v;
    }

    createVertices(){
        this.inputsVertices=[];
        this.inputsYPos.forEach(yPos => {
            let nodeType = this.type == 'sink' ? verticesTypes.sink : verticesTypes.input;
            let newVertex = this.checkAndAddVertex(this.x, Math.round(yPos*this.height)+this.y, nodeType);
            if(newVertex){
                this.inputsVertices.push(newVertex);
            }else{
                console.error('Could not create vertex!');
            }
        });
        let nodeType = this.type == 'source' ? verticesTypes.source : verticesTypes.output;
        if(this.outputYPos > 0){
            let newVertex = this.checkAndAddVertex(this.x+this.width, Math.round(this.outputYPos*this.height)+this.y, nodeType);
            if(newVertex){
                this.outputVertex = newVertex;
            }else{
                console.error('Could not create vertex!');
            }
        }
    }

    process(){
        let inputVec = [];
        this.inputsVertices.forEach(i => inputVec.push(i.value))
        let o = this.logic.process(inputVec);
        //Propagate result value to output
        if(this.outputVertex){
            this.outputVertex.value = o;
        }
        return o;
    }

    checkProcess(){
        let o = undefined;
        this.isReady = true;
        this.inputsVertices.forEach(vert =>{if(vert.value === undefined) this.isReady = false;});
        if(this.isReady && this.logic) o = this.process();
        return this.isReady;
    }
}

class AbsObject{
    constructor(name, icon=null, type='absObject'){
        this.name = name;
        this.icon = icon;
        this.type = type;
    }
}

class CanvasItem{
    constructor(object, x, y, width, height, type='canvasItem'){
        this.object = object;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    updatePos(x, y){
        this.x = x;
        this.y = y;
    }
}

class ObjectCanvasItem extends CanvasItem{
    constructor(object, x, y, width, height, type ='object'){
        super(object, x, y, width, height, type);
    }
}

class OperatorCanvasItem extends CanvasItem{
    constructor(operatorObj, x, y, width, height, type ='operator'){
        super(operatorObj, x, y, width, height, type);
        this.object = operatorObj;
        this.graphItem = new CanvasGraphItem(x, y, width, height, 'function', createLogic(this.object.name));
        //!!! BAD!! MOVE THIS !!!
        if(this.object.name == 'switch'){
            this.graphItem.outputYPos=1/2;
            this.graphItem.inputsYPos= [];
        }else if(this.object.name == 'outputLed'){
            this.graphItem.logic = createLogic('output');
            this.graphItem.outputYPos=0;
            this.graphItem.inputsYPos= [1/2];
            this.process = ()=>{
                    let o = this.graphItem.checkProcess();
                    if(this.graphItem.logic.value===true){console.log('sink activated!');}
                    return o !== undefined;
                };
        }else if(this.object.name == 'not'){
            this.graphItem.outputYPos=1/2;  
            this.graphItem.inputsYPos= [1/2];
        }else if(this.object.name == 'outputDisplay'){
            this.graphItem.logic = createLogic('output');
            this.graphItem.outputYPos=0;
            this.graphItem.inputsYPos= [0,1/4,2/4,3/4,1];
            this.process = ()=>{return true;};
        }
    }

    process(){
        return this.graphItem.checkProcess();
    }

    updatePos(x, y){
        super.updatePos(x,y);
        this.graphItem.x = x;
        this.graphItem.y = y;
    }
}

class LineSegmentCanvasItem extends CanvasItem{
    constructor(startX, startY, endX, endY){
        super(new AbsObject(), Math.min(startX, endX), Math.min(startY, endY), 
              Math.abs(startX - endX), Math.abs(startY - endY));
        this.startPos = {x: startX, y: startY};
        this.endPos = {x: endX, y: endY};
        this.type = 'lineSegment';
        this.isStraight = startX == endX || startY == endY;
        this.graphItem = new CanvasGraphItem(this.x, this.y, this.width, this.height, this.type);
        this.edge = null;
        this.graphItem.inputsYPos = [0];
        this.graphItem.outputYPos = 1;
        this.graphItem.createVertices = this.isStraight ? this.graphItem.createVertices : ()=>{};
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

    createEdge(){
        let vA = this.graphItem.inputsVertices[0];
        let vB = this.graphItem.outputVertex;
        if(this.isStraight){
            if(vA && vB){
                vA.type = verticesTypes.node;
                vB.type = verticesTypes.node;
                this.edge = new Edge(vA, vB);
                edgesList.push(this.edge);
            }else{
                console.error('Error creating edge!');
            }
         }
        }
}       