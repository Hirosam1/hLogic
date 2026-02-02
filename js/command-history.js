let _canvasObjects = [];
let _canvasLineSegments = [];

class UICommand{
    execute(){
        throw new Error('Execute method must be implemented');
    }
    undo(){
        throw new Error('Undo method must be implemented');
    }
}

class CommandHistory{
    constructor(maxHistorySize = 75) {
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

//UI Commands ===
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

class AddCanvasObjectCommand extends UICommand{
    constructor(canvasObject){
        super();
        this.canvasObject = canvasObject;
    }

    execute(){
        if(this.canvasObject.type === 'lineSegment'){_canvasLineSegments.push(this.canvasObject);}
        else{_canvasObjects.push(this.canvasObject);}
    }

    undo(){
        if(this.canvasObject.type == 'operator' || this.canvasObject.type == 'object'){
            _canvasObjects = _canvasObjects.filter(obj => obj !== this.canvasObject);
        }else if(this.canvasObject.type === 'lineSegment'){
            _canvasLineSegments = _canvasLineSegments.filter(obj => obj !== this.canvasObject);
        }
    }
}

class DeleteCanvasObjectCommand extends UICommand{
    constructor(canvasObject){
        super();
        this.canvasObject = canvasObject;
    }

    execute(){
        if(this.canvasObject.type == 'operator' || this.canvasObject.type == 'object'){
            _canvasObjects = _canvasObjects.filter(obj => obj !== this.canvasObject);
        }else if(this.canvasObject.type == 'lineSegment'){
            _canvasLineSegments = _canvasLineSegments.filter(obj => obj !== this.canvasObject);
        }
    }

    undo(){
        if(this.canvasObject.type === 'lineSegment'){_canvasLineSegments.push(this.canvasObject);}
        else{_canvasObjects.push(this.canvasObject);}
    }
}