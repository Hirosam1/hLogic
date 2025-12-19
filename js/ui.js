const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const GLOBAL_RATIO = {x: 4, y: 3};
const SQUARE_RATIO = {x: 4, y: 4};
const H_SQUARE_RATIO = {x: 2, y: 2};

//Canvas settings and view state.
let canvasWidth = 1000;
let canvasHeight = 900;
let gridSize = 20;
let zoom = 1;
let panX = 0;
let panY = 0;
//Loaded items on Canvas
let paletteImages = [];
let objects = [];
let canvasItems = [];
let nodes = []
//Input information
let lastMouseX = 0;
let lastMouseY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
//Editor states and settings
const editorStates = {operatorEditor : 0, nodeEditor : 1};
let editorState = editorStates.operatorEditor;
let isPanning = false;
let draggedObject = null;
let selectedOperator = null;
let placingMode = false;
//Resources?
let operators = []


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
        document.getElementById('modeInfo').textContent = 'Mode: Dragging (' + draggedObject.name + ') operator';
   }else if(placingMode){
        document.getElementById('modeInfo').textContent = 'Mode: Place (' + selectedOperator.name + ') operator';
   }
   else{
        document.getElementById('modeInfo').textContent = editorState == editorStates.operatorEditor ? 'Mode: Pan (Click & Drag)' : 'Mode: Connect (Node mode)';
   }
   //Mue position
   let pos = screenToCanvas(lastMouseX, lastMouseY);
   document.getElementById('mousePositionX').textContent = clamp(Math.floor(pos.x), 0, canvasWidth);
   document.getElementById('mousePositionY').textContent = clamp(Math.floor(pos.y), 0, canvasHeight);

}

function addOperatorToPalette(operator){
    const img = new Image();
    img.onload = () => {
        const paletteDiv = document.getElementById('objectPalette');
        const item = document.createElement('div');
        item.className = 'palette-item';
        
        const imgElement = document.createElement('img');
        imgElement.src = operator.icon.imgSrc;
        item.appendChild(imgElement);
        //Load img data to operator icon field
        operator.icon.img = img;
        item.onclick = () => {
            if(editorState == editorStates.operatorEditor){
                document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedOperator = operator;
                placingMode = true;
                canvas.classList.add('placing');
                canvas.style.cursor = 'crosshair';
                updateInfo();
            }
        };

        paletteDiv.appendChild(item);
        paletteImages.push({ img, src: operator.icon.imgSrc });

    };
    img.onerror = () => {
    console.error(`Failed to load image: ${operator.icon.imgSrc}`);
    };
    img.src = operator.icon.imgSrc;
}

function preloadPalletMenu(){
    operators = [
        new Operator('circleDebug', 'none', new Icon('imgs/circle_white.svg', SQUARE_RATIO)),
        new Operator('squareDebug', 'none', new Icon('imgs/square_white.svg', SQUARE_RATIO)),
        new Operator('switch', 'switch', new Icon('imgs/switch_2x2.svg', H_SQUARE_RATIO)),
        new Operator('output', 'output', new Icon('imgs/output_2x2.svg', H_SQUARE_RATIO)),
        new Operator('not', 'not', new Icon('imgs/not_2x2.svg', H_SQUARE_RATIO)),
        new Operator('and', 'and', new Icon('imgs/and_4x3.svg', GLOBAL_RATIO)),
        new Operator('or', 'or', new Icon('imgs/or_4x3.svg', GLOBAL_RATIO)),
        new Operator('xor', 'xor', new Icon('imgs/xor_4x3.svg', GLOBAL_RATIO)),
    ];
    operators.forEach(operator =>{
        addOperatorToPalette(operator);
    });
    //Node Tool menu
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

function cancelSelectedOperator(){
    if(editorState == editorStates.nodeEditor){
        editorState = editorStates.operatorEditor;
        console.log("Editor mode activated");
    }
    placingMode = false;
    selectedOperator = null;
    canvas.classList.remove('placing');
    canvas.style.cursor = 'grab';
    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
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
        selectedOperator = null;
        if(editorState == editorStates.operatorEditor){
            cancelSelectedOperator();
            console.log("Node mode activated");
            editorState = editorStates.nodeEditor;
            item.classList.add('active');
            canvas.classList.add('placing');
            canvas.style.cursor = 'crosshair';
            updateInfo();
        }
        else if(editorState == editorStates.nodeEditor){
            cancelSelectedOperator();
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
    canvasItems.forEach(obj => {
        if (obj.icon.type === 'image' && obj.icon.img.complete) {
            ctx.drawImage(obj.icon.img, obj.x, obj.y, obj.width, obj.height);
        }
    });

    ctx.restore();

    document.getElementById('objectCount').textContent = canvasItems.length;
}

function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize;
}

function getObjectAt(x, y) {
    for (let i = canvasItems.length - 1; i >= 0; i--) {
        const obj = canvasItems[i];
        if (obj.icon.type === 'image') {
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