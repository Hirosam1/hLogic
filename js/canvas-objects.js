const defaultValue = false;

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
        this.inputsVertices.forEach(i => inputVec.push(i.value ? i.value : defaultValue));
        let o = this.logic.process(inputVec);
        //Propagate result value to output
        if(this.outputVertex){
            this.outputVertex.value = o;
        }
        return o;
    }

    checkProcess(){
        let o = undefined;
        //this.isReady = true;
        this.inputsVertices.forEach(vert =>{
            if(vert.value !== undefined){
                this.isReady = true;
            }
        });
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
    }

    process(){
        return this.graphItem.checkProcess();
    }

    updatePos(x, y){
        super.updatePos(x,y);
        this.graphItem.x = x;
        this.graphItem.y = y;
    }

    drawEffects(){}
}

const lineSegmentObj = new AbsObject();

class LineSegmentCanvasItem extends CanvasItem{
    constructor(startX, startY, endX, endY){
        super(lineSegmentObj, Math.min(startX, endX), Math.min(startY, endY), 
              Math.abs(startX - endX), Math.abs(startY - endY));
        this.x = Math.min(startX, endX);
        this.y = Math.min(startY, endY);
        this.startPos = {x: startX, y: startY, vertex: null};
        this.endPos = {x: endX, y: endY, vertex: null};
        this.type = 'lineSegment';
        this.graphItem = new CanvasGraphItem(this.x, this.y, this.width, this.height, this.type);
        this.edge = null;
        this.graphItem.createVertices = ()=>{this.createVertices();};
    }

    createVertices(){
         let newVertex = this.graphItem.checkAndAddVertex(this.startPos.x, this.startPos.y, 'node');
         this.startPos.vertex = newVertex;
         newVertex = this.graphItem.checkAndAddVertex(this.endPos.x, this.endPos.y, 'node');
         this.endPos.vertex = newVertex;
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
        let vA = this.startPos.vertex;
        let vB = this.endPos.vertex;
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

function operatorCanvasFactory(operatorObj, x, y, width, height, type ='operator'){
    let newOp = new OperatorCanvasItem(operatorObj, x, y, width,height, type);
    if(operatorObj.name === 'switch'){
        newOp.ledsPos = {high: new Vec2(0.55, 0.3), low : new Vec2(0.55, 0.7)};
        newOp.graphItem.outputYPos=1/2;
        newOp.graphItem.inputsYPos= [];
        newOp.drawEffects = () =>{
            let fillStyle = newOp.graphItem.isReady? newOp.graphItem.logic.enabled? '#c7bb17ff': '#e60a41' : '#74738bff';
            drawPoint(new Vec2(newOp.x+newOp.ledsPos.high.x*newOp.width,
                            newOp.y+newOp.ledsPos.high.y*newOp.height), 6, fillStyle);
            fillStyle = newOp.graphItem.isReady?  newOp.graphItem.logic.enabled? '#e60a41' : '#100ae5': '#74738bff';
            drawPoint(new Vec2(newOp.x+newOp.ledsPos.low.x*newOp.width,
                            newOp.y+newOp.ledsPos.low.y*newOp.height), 6, fillStyle);
        };
    }else if(operatorObj.name == 'outputLed'){
        newOp.ledOutputPos = {x : 0.6 , y: 0.5};
        newOp.graphItem.logic = createLogic('output');
        newOp.graphItem.outputYPos=0;
        newOp.graphItem.inputsYPos= [1/2];
        newOp.process = ()=>{
                let o = newOp.graphItem.checkProcess();
                return o !== undefined;
            };
            newOp.drawEffects = ()=>{
                let fillStyle = newOp.graphItem.isReady? newOp.graphItem.logic.value? '#11c08cff' : '#e60a41' : '#100ae5';
                drawPoint(new Vec2(newOp.x+newOp.ledOutputPos.x*newOp.width,
                                    newOp.y+newOp.ledOutputPos.y*newOp.height), 9.5, fillStyle);
            };
    }else if(operatorObj.name == '5bDisplay'){
        newOp.graphItem.logic = createLogic('output');   
        newOp.graphItem.outputYPos=0;
        newOp.graphItem.inputsYPos= [0,1/4,2/4,3/4,1];
        newOp.graphItem.isReady = true;
        newOp.displayVal = 0;
        newOp.outputDisplayPos = {x: 0.37   , y: 0.82};
        newOp.process = ()=>{
            let newVal = 0;
            newOp.graphItem.checkProcess();
            for(let i = 0; i < newOp.graphItem.inputsVertices.length; i++){
                if(newOp.graphItem.inputsVertices[i].value !== undefined){
                    newVal |= (1 << i) * newOp.graphItem.inputsVertices[i].value;
                    newOp.displayVal = newVal;
                }else{
                    newOp.graphItem.isReady = false;
                }
            }
            return newOp.graphItem.isReady;
        };
        newOp.drawEffects = ()=>{
            const fontSize = clamp(19/zoom, 19, 36);
            ctx.font = `${fontSize}px Monospace`;
            ctx.fillStyle = '#11c08cff';
            const textWidth = ctx.measureText(newOp.displayVal).width;
            ctx.fillText(`${newOp.displayVal}`, newOp.x+newOp.outputDisplayPos.x*newOp.width,
                                newOp.y+newOp.outputDisplayPos.y*newOp.height);
        };
    }else if(operatorObj.name == 'not'){
            newOp.graphItem.outputYPos=1/2;  
            newOp.graphItem.inputsYPos= [1/2];
    }
    return newOp;
}