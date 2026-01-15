//Ui elements
const canvas = document.getElementById('canvasArea');
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
    if (editorState == editorStates.objectEditor){
        if(draggedObject){
            if(draggedObject.object){
                document.getElementById('modeInfo').textContent = 'Edit Mode: Dragging (' + draggedObject.object.name + ') ' + draggedObject.object.type;
            }else{
                document.getElementById('modeInfo').textContent = 'Edit Mode: Dragging line segment';
            }
        }else if(placingMode){
            document.getElementById('modeInfo').textContent = 'Edit Mode: Place (' + selectedObject.name + ') operator';
        }else{
            document.getElementById('modeInfo').textContent ='Edit Mode: Pan (Click & Drag)';
        }
    }else if(editorState == editorStates.nodeEditor){
        if(nodeStartPos){
            document.getElementById('modeInfo').textContent ='Node mode: Connect from: x:' + nodeStartPos.x + ' y:' + nodeStartPos.y;
        }else{
            document.getElementById('modeInfo').textContent ='Node mode: Start connection';
        }
    }else if(editorState == editorStates.simulating){
        document.getElementById('modeInfo').textContent = 'Simulating Mode: (' + selectedObject?.object.name + ') operator';
    }
    //Mouse position
    let pos = this.screenToCanvas(lastMouseX, lastMouseY);
    document.getElementById('mousePositionX').textContent = clamp(this.snapToGrid(pos.x) , 0, canvasWidth);
    document.getElementById('mousePositionY').textContent = clamp(this.snapToGrid(pos.y) , 0, canvasHeight);
}

const globalRatio = {x: 4, y: 3};
const squareRatio = {x: 4, y: 4};
const gridRatio = {x: 1, y:1};
const rectRatio = {x: 2, y: 4};
const hSquareRatio = {x: 2, y: 2};
const gridSize = 30;
const maxZoom = 7;
const minZoom = 0.2;
//Canvas settings and view state.
let canvasWidth = 1000;
let canvasHeight = 900;
let zoom = 1;
let panX = 0;
let panY = 0;
//Loaded items on Pallet Objects
let paletteImages = [];
//Input information
let lastMouseX = 0;
let lastMouseY = 0;
let dragTranslationLast = {x: 0, y: 0};
//Editor states and settings
const editorStates = {operatorEditor : 0, nodeEditor : 1, simulating: 2};
let editorState = editorStates.objectEditor;
let isPanning = false;
let draggedObject = null;
let selectedObject = null;
let placingMode = false;
let nodeStartPos = null;