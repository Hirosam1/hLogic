const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const GLOBAL_RATIO = {x: 4, y: 3};
const SQUARE_RATIO = {x: 4, y: 4};
const H_SQUARE_RATIO = {x: 2, y: 2};

let canvasWidth = 1000;
let canvasHeight = 900;
let gridSize = 20;
let zoom = 1;
let panX = 0;
let panY = 0;

let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
let draggedObject = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let selectedTool = null;
let placingMode = false;
const editorStates = {operatorEditor : 0, nodeEditor : 1};
let editorState = editorStates.operatorEditor;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function screenToCanvas(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - panX) / zoom;
    const y = (screenY - rect.top - panY) / zoom;
    return { x, y };
}

function updateInfo(){
//Update Mode field.
   if(draggedObject){
        document.getElementById('modeInfo').textContent = 'Mode: Dragging (' + draggedObject.logic + ') operator';
   }else if(placingMode){
        document.getElementById('modeInfo').textContent = 'Mode: Place (' + selectedTool.logic + ') operator';
   }
   else{
        document.getElementById('modeInfo').textContent = editorState == editorStates.operatorEditor ? 'Mode: Pan (Click & Drag)' : 'Mode: Pan (Node mode)';
   }
   //Mue position
   let pos = screenToCanvas(lastMouseX, lastMouseY);
   document.getElementById('mousePositionX').textContent = clamp(Math.floor(pos.x), 0, canvasWidth);
   document.getElementById('mousePositionY').textContent = clamp(Math.floor(pos.y), 0, canvasHeight);

}

function addOperatorToPalette(operator){
    const img = new Image();
    img.onload = () => {
        let imgSrc = operator.imgSrc;
        let logicVal = operator.logicType;
        let ratioVal = operator.ratio;

        const paletteDiv = document.getElementById('objectPalette');
        const item = document.createElement('div');
        item.className = 'palette-item';
        
        const imgElement = document.createElement('img');
        imgElement.src = imgSrc;
        item.appendChild(imgElement);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';

        item.onclick = () => {
            if(editorState == editorStates.operatorEditor){
                document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedTool = {
                    type: 'image',
                    img: img,
                    imgSrc: imgSrc,
                    logic: logicVal,
                    ratio:ratioVal
                };
                placingMode = true;
                canvas.classList.add('placing');
                canvas.style.cursor = 'crosshair';
                document.getElementById('modeInfo').textContent = 'Mode: Place (' + logicVal + ') operator';
            }
        };

        paletteDiv.appendChild(item);
        paletteImages.push({ img, src: imgSrc });

    };
    img.onerror = () => {
    console.error(`Failed to load image: ${operator.imgSrc}`);
    };
    img.src = operator.imgSrc;
}

function preloadOperators(){
    const operators = [
        {logicType:'debug', imgSrc:'imgs/circle_white.svg', ratio: SQUARE_RATIO},
        {logicType:'debug', imgSrc:'imgs/square_white.svg', ratio: SQUARE_RATIO},
        {logicType:'switch', imgSrc:'imgs/switch_2x2.svg', ratio: H_SQUARE_RATIO},
        {logicType:'output', imgSrc:'imgs/output_2x2.svg', ratio: H_SQUARE_RATIO},
        {logicType:'not', imgSrc:'imgs/not_2x2.svg', ratio: H_SQUARE_RATIO},
        {logicType:'and', imgSrc:'imgs/and_4x3.svg', ratio: GLOBAL_RATIO},
        {logicType: 'or', imgSrc: 'imgs/or_4x3.svg', ratio: GLOBAL_RATIO},
    ];
    operators.forEach(operator =>{
        addOperatorToPalette(operator);
    });

    const node_mode_imgSrc = "imgs/nodes_icon.svg";
    const node_mode_img = new Image();
    node_mode_img.onload = () => {
        addNodeMode(node_mode_img, node_mode_imgSrc);
    };
    node_mode_img.onerror = () => {
    console.error(`Failed to load node mode image`);
    };
    node_mode_img.src = node_mode_imgSrc;
}

function cancelSelectedTool(){
    // Cancel placing mode
    placingMode = false;
    selectedTool = null;
    canvas.classList.remove('placing');
    canvas.style.cursor = 'grab';
    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
    editorState = editorStates.operatorEditor;
    nodeEditor = document.getElementById("nodeEditor");
    nodeEditor.classList.remove('active');
    updateInfo();
}

function addNodeMode(img, imgSrc){
    const paletteDiv = document.getElementById('toolsPalette');
    const item = document.createElement('div');
    item.className = 'palette-item';
    
    const imgElement = document.createElement('img');
    imgElement.src = imgSrc;
    item.id = "nodeEditor";
    item.appendChild(imgElement);

    item.onclick = () => {
        selectedTool = null;
        document.getElementById('modeInfo').textContent = 'Mode: Node selector';
        if(editorState == editorStates.operatorEditor){
            cancelSelectedTool();
            editorState = editorStates.nodeEditor;
            item.classList.add('active');
            updateInfo();
        }
        else if(editorState == editorStates.nodeEditor){
            cancelSelectedTool();
            updateInfo();
        }
    };

    paletteDiv.appendChild(item);
    paletteImages.push({ img, src: imgSrc });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = '#333';
    lineWidth = 2;
    ctx.lineWidth = lineWidth / zoom;

    for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }

    // Draw objects
    objects.forEach(obj => {
        if (obj.type === 'image' && obj.img.complete) {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
        }
    });

    ctx.restore();

    document.getElementById('objectCount').textContent = objects.length;
}

function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize;
}

function getObjectAt(x, y) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.type === 'image') {
            if (x >= obj.x && x <= obj.x + obj.width &&
                y >= obj.y && y <= obj.y + obj.height) {
                return obj;
            }
        }
    }
    return null;
}

function initCanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    draw();
}