let _canvasObjects = [];

class UICommand{
    execute(){
        throw new Error('Execute method must be implemented');
    }
    undo(){
        throw new Error('Undo method must be implemented');
    }
}

class CommandHistory{
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
    }

    execute(command){
        // Remove any commands after current index (when undoing then doing new action)
        this.history = this.history.slice(0, this.currentIndex + 1);
        // Execute the command
        command.execute();
        // Add to history
        this.history.push(command);
        this.currentIndex++;
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    canUndo() {
        return this.currentIndex >= 0;
    }
    
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    undo() {
        if (!this.canUndo()) return false;
        this.history[this.currentIndex].undo();
        this.currentIndex--;
        return true;
    }
  
    redo() {
        if (!this.canRedo()) return false;
        this.currentIndex++;
        this.history[this.currentIndex].execute();
        return true;
    }
    
    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}

class MoveObjectCommand extends UICommand{
    /**
     * @param {CanvasItem} canvasObject 
     * @param {{x: number, y: number}} oldPos 
     * @param {{x: number, y: number}} newPos 
     */
    constructor(canvasObject, oldPos, newPos){
        this.canvasObject = canvasObject;
        super();
        this.oldPos = oldPos;
        this.newPos = newPos;
    }
    execute(){ this.canvasObject.updatePos(this.newPos.x, this.newPos.y);}
    undo(){ this.canvasObject.updatePos(this.oldPos.x, this.oldPos.y);}
}

class AddObjectCommand extends UICommand{
    constructor(object, startPos){
        super();
        this.object = object;
        this.startPos = startPos;
        this.canvasObject = undefined;
    }

    execute(){
        let imgSize = [gridSize*this.object.icon.ratio.x, gridSize*this.object.icon.ratio.y];
        let opr = null;
        if(this.object.type == 'operatorObject'){
            opr = operatorCanvasFactory(this.object,
                                snapToGrid(this.startPos.x - imgSize[0]/2),
                                snapToGrid(this.startPos.y - imgSize[1]/2),
                                imgSize[0],
                                imgSize[1]);
                                
        }else{
            opr = new ObjectCanvasItem(this.object,  
                snapToGrid(this.startPos.x - imgSize[0]/2),
                snapToGrid(this.startPos.y - imgSize[1]/2),
                imgSize[0],
                imgSize[1]);
        }
        this.canvasObject = opr;
        _canvasObjects.push(opr);
    }

    undo(){
        if(this.canvasObject.type == 'operator' || this.canvasObject.type == 'object'){
            _canvasObjects = _canvasObjects.filter(obj => obj !== this.canvasObject);
        }/*else if(object.type == 'lineSegment'){
            this.canvasLineSegments = this.canvasLineSegments.filter(obj => obj !== object);
        }*/
    }
}

class DeleteObjectCommand extends UICommand{
    constructor(object, canvasObjects){
        super();
        this.object = object;
    }

    execute(){
        if(this.object.type == 'operator' || this.object.type == 'object'){
            _canvasObjects = _canvasObjects.filter(obj => obj !== this.object);
        }
    }

    undo(){
        let imgSize = [gridSize*this.object.icon.ratio.x, gridSize*this.object.icon.ratio.y];
        let opr = null;
        if(this.object.type == 'operatorObject'){
            opr = operatorCanvasFactory(this.object,
                                snapToGrid(this.startPos.x - imgSize[0]/2),
                                snapToGrid(this.startPos.y - imgSize[1]/2),
                                imgSize[0],
                                imgSize[1]);
                                
        }else{
            opr = new ObjectCanvasItem(this.object,  
                snapToGrid(this.startPos.x - imgSize[0]/2),
                snapToGrid(this.startPos.y - imgSize[1]/2),
                imgSize[0],
                imgSize[1]);
        }
        _canvasObjects.push(opr);
    }
}