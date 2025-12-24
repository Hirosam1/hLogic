const canvas = document.getElementById('canvas');
const canvasControls = document.getElementById('canvasControls');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const widthSlider = document.getElementById('widthSlider');
const heightSlider = document.getElementById('heightSlider');
const resetView = document.getElementById('resetView');
const zoomLevel = document.getElementById('zoomLevel');
const clearCanvas = document.getElementById('clearCanvas');

function drawLine(startPosVec, endPosVec, lineWidth = 3, strokeStyle='#100ae5'){
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth / zoom;

        ctx.beginPath();
        ctx.moveTo(startPosVec.x, startPosVec.y);
        ctx.lineTo(endPosVec.x, endPosVec.y);
        ctx.stroke();
}

function drawPoint(posVec, radius=4, fillStyle='#e60a41'){
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    // Parameters: centerX, centerY, radius, startAngle (radians), endAngle (radians), counterclockwise (boolean)
    ctx.arc(posVec.x, posVec.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}

function screenToCanvas(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    const x = clamp(((screenX - rect.left + panX) / zoom),0, canvasWidth);
    const y = clamp(((screenY - rect.top + panY) / zoom),0, canvasHeight);
    return {x, y};
}

function canvasToScreen(canvasX, canvasY) {
    const rect = canvas.getBoundingClientRect();
    const x = canvasX * zoom + panX + rect.left;
    const y = canvasY * zoom + panY + rect.top;
    return {x, y};
}

function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize;
}

function updateInfo(){
//Update Mode field.
    if (editorState == editorStates.operatorEditor){
        if(draggedObject){
            if(draggedObject.operator){
                document.getElementById('modeInfo').textContent = 'Edit Mode: Dragging (' + draggedObject.operator.name + ') operator';
            }else{
                document.getElementById('modeInfo').textContent = 'Edit Mode: Dragging ' + (draggedObject.isStraight ? 'straight' : 'diagonal') + ' line segment';
            }
        }else if(placingMode){
            document.getElementById('modeInfo').textContent = 'EditMode: Place (' + selectedOperator.name + ') operator';
        }else{
            document.getElementById('modeInfo').textContent ='Edit Mode: Pan (Click & Drag)';
        }
    }else if(editorState == editorStates.nodeEditor){
        if(nodeStartPos){
            document.getElementById('modeInfo').textContent ='Node mode: Connect from: x:' + nodeStartPos.x + ' y:' + nodeStartPos.y;
        }else{
            document.getElementById('modeInfo').textContent ='Node mode: Start connection';
        }
    }
    //Mouse position
    let pos = this.screenToCanvas(lastMouseX, lastMouseY);
    document.getElementById('mousePositionX').textContent = clamp(this.snapToGrid(pos.x) , 0, canvasWidth);
    document.getElementById('mousePositionY').textContent = clamp(this.snapToGrid(pos.y) , 0, canvasHeight);
}