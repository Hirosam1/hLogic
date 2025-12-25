const globalRatio = {x: 4, y: 3};
const squareRatio = {x: 4, y: 4};
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

class UIEditor{
    constructor(){
        //Resources====
        this._objects = [];
        this._canvasLineSegments = [];
        this._canvasObjects = [];
    }

    addObjectToPalette(operator){
        const img = new Image();
        img.onload = () => {
            const paletteDiv = document.getElementById('objectPalette');
            const item = document.createElement('div');
            item.className = 'palette-item';
            const imgElement = document.createElement('img');
            imgElement.src = operator.icon.imgSrc;
            imgElement.setAttribute('draggable', false);
            item.appendChild(imgElement);
            //Load img data to operator icon field
            operator.icon.img = img;
            item.onclick = () => {
                if(editorState == editorStates.objectEditor){
                    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedObject = operator;
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

    addToolToPalette(img, imgSrc, id){
        const paletteDiv = document.getElementById('toolsPalette');
        const item = document.createElement('div');
        item.className = 'palette-item';

        const imgElement = document.createElement('img');
        imgElement.setAttribute('draggable', false);
        imgElement.src = imgSrc;
        item.id = id;
        item.appendChild(imgElement);
        item.onclick = () => {
            selectedObject = null;
            if(editorState == editorStates.objectEditor){
                this.cancelSelectedOperator();
                editorState = editorStates.nodeEditor;
                item.classList.add('active');
                canvas.classList.add('placing');
                canvas.style.cursor = 'crosshair';
                updateInfo();
            }
            else if(editorState == editorStates.nodeEditor){
                this.cancelSelectedOperator();
                updateInfo();
            }
        };

        paletteDiv.appendChild(item);
        paletteImages.push({ img, src: imgSrc });
    }

    preloadPalletMenu(){
        this._objects = [
            new AbsObject('circleDebug', new Icon('imgs/circle_white.svg', squareRatio)),
            new AbsObject('squareDebug', new Icon('imgs/square_white.svg', squareRatio)),
            new AbsObject('switch', new Icon('imgs/switch_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('outputLed', new Icon('imgs/output_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('not', new Icon('imgs/not_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('and', new Icon('imgs/and_4x3.svg', globalRatio), 'operatorObject'),
            new AbsObject('or', new Icon('imgs/or_4x3.svg', globalRatio), 'operatorObject'),
            new AbsObject('xor'  , new Icon('imgs/xor_4x3.svg', globalRatio), 'operatorObject'),
        ];
        this._objects.forEach(operator =>{
            this.addObjectToPalette(operator);
        });
        //Node Tool menu
        const node_mode_imgSrc = "imgs/nodes_icon.svg";
        const node_mode_img = new Image();
        node_mode_img.onload = () => {
            this.addToolToPalette(node_mode_img, node_mode_imgSrc, "nodeEditor");
        };
        node_mode_img.onerror = () => {
            console.error(`Failed to load node mode image`);
        };
        node_mode_img.src = node_mode_imgSrc;
    }

    cancelSelectedOperator(){
        if(editorState == editorStates.nodeEditor){
            editorState = editorStates.objectEditor;
        }
        nodeStartPos=null;
        placingMode = false;
        selectedObject = null;
        canvas.classList.remove('placing');
        canvas.style.cursor = 'grab';
        document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
        let nodeEditor = document.getElementById("nodeEditor");
        nodeEditor.classList.remove('active');
        updateInfo();
        this.draw();
    }

    drawGrid(){
        let lineWidth = 0.75;
        let lineWidthZ = lineWidth / zoom;
        for (let x = 0; x <= canvasWidth; x += gridSize) {
            drawLine(new Vec2(x,0), new Vec2(x,canvasHeight),lineWidthZ,'#555');
        }

        for (let y = 0; y <= canvasHeight; y += gridSize) {
            drawLine(new Vec2(0,y), new Vec2(canvasWidth,y),lineWidthZ,'#555');
        }
    }

    drawResources(){
        //Draw Lines
        this._canvasLineSegments.forEach(line => {
            let strokeStroke = '#100ae5';
            if(!line.isStraight){
                strokeStroke = '#738eb8ff';
            }
            else if(editorState == editorStates.simulating){
                let vA = line.edge.vertexA;
                let vB = line.edge.vertexB;
                if(vA.value && vB.value){strokeStroke='#c7bb17ff';}
            }
            drawLine(line.startPos, line.endPos, 5, strokeStroke);
    
        });
        ctx.closePath();

        // Draw objects
        this._canvasObjects.forEach(obj => {
            if (obj.object.icon.type === 'image' && obj.object.icon.img.complete) {
                ctx.drawImage(obj.object.icon.img, obj.x, obj.y, obj.width, obj.height);
            }
        });
        if(editorState == editorStates.simulating){
            verticesPosList.forEach(vertPos => {
                let fillStyle = vertPos.vertex.value ? '#11c08cff' : '#bc1bd1ff';
                drawPoint(vertPos.pos, 2, fillStyle);
            });
        }else{
            //Draw nodes
            this._canvasLineSegments.forEach(node => {
                let fillStyle = '#11c08cff';
                drawPoint(node.startPos, 2, fillStyle);
                drawPoint(node.endPos, 2, fillStyle);
            });
        }
    }

    draw(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-panX, -panY);
        ctx.scale(zoom, zoom);
        
        this.drawGrid();
        this.drawResources();

        let canvasPos = screenToCanvas(lastMouseX,lastMouseY);
        canvasPos.x = snapToGrid(canvasPos.x);
        canvasPos.y = snapToGrid(canvasPos.y);
        if(editorState == editorStates.nodeEditor && !nodeStartPos){
            drawPoint(canvasPos, 4);
        }
        //Draw live creation
        if(nodeStartPos){
            drawLine(nodeStartPos, canvasPos);
            drawPoint(nodeStartPos);
        }

        ctx.restore();
        document.getElementById('objectCount').textContent = this._canvasObjects.length + this._canvasLineSegments.length;
    }

    clearCanvas(){
        this._canvasObjects = [];
        this._canvasLineSegments = [];
        this.draw();
    }

    getObjectAt(x, y) {
        for (let i = this._canvasObjects.length - 1; i >= 0; i--) {
            const obj = this._canvasObjects[i];
            if (obj.object) {
                if (x >= obj.x && x <= obj.x + obj.width &&
                    y >= obj.y && y <= obj.y + obj.height) {
                    return obj;
                }
            }
        }
        return null;
    }

    getLineSegmentAt(x, y){
        for (let i = this._canvasLineSegments.length - 1; i >= 0; i--) {
            const node = this._canvasLineSegments[i];
            if (node.type === 'lineSegment') {
                if (x >= node.x && x <= node.x + node.width &&
                    y >= node.y && y <= node.y + node.height){
                    return node;
                }
            }
        }
        return null;
    }

    initCanvas() {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        this.draw();   
    }
}

let mainCanvas = undefined;