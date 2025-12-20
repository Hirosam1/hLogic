const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const widthSlider = document.getElementById('widthSlider');
const heightSlider = document.getElementById('heightSlider');
const resetView = document.getElementById('resetView');
const zoomLevel = document.getElementById('zoomLevel');
const clearCanvas = document.getElementById('clearCanvas');


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
const editorStates = {operatorEditor : 0, nodeEditor : 1};
let editorState = editorStates.operatorEditor;
let isPanning = false;
let draggedObject = null;
let selectedOperator = null;
let placingMode = false;
let nodeStartPos = null;

class Canvas{
    constructor(){
        //Resources
        this._operators = [];
        this._nodes = [];
        this._canvasItems = [];
    }

    screenToCanvas(screenX, screenY) {
        const rect = canvas.getBoundingClientRect();
        const x = clamp(((screenX - rect.left - panX) / zoom),0, canvasWidth);
        const y = clamp(((screenY - rect.top - panY) / zoom),0, canvasHeight);
        return {x, y};
    }

    snapToGrid(value) {
        return Math.round(value / gridSize) * gridSize;
    }

    updateInfo(){
    //Update Mode field.
        if (editorState == editorStates.operatorEditor){
            if(draggedObject){
                document.getElementById('modeInfo').textContent = 'Edit Mode: Dragging (' + draggedObject.operator?.name + ') operator';
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
        document.getElementById('mousePositionX').textContent = clamp(this.snapToGrid(pos.x) , 0, 'canvasWidth');
        document.getElementById('mousePositionY').textContent = clamp(this.snapToGrid(pos.y) , 0, canvasHeight);
    }

    addOperatorToPalette(operator){
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
                if(editorState == editorStates.operatorEditor){
                    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedOperator = operator;
                    placingMode = true;
                    canvas.classList.add('placing');
                    canvas.style.cursor = 'crosshair';
                    this.updateInfo();
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

    preloadPalletMenu(){
        this._operators = [
        new Operator('circleDebug', 'none', new Icon('imgs/circle_white.svg', squareRatio)),
            new Operator('squareDebug', 'none', new Icon('imgs/square_white.svg', squareRatio)),
            new Operator('switch', 'switch', new Icon('imgs/switch_2x2.svg', hSquareRatio)),
            new Operator('output', 'output', new Icon('imgs/output_2x2.svg', hSquareRatio)),
            new Operator('not', 'not', new Icon('imgs/not_2x2.svg', hSquareRatio)),
            new Operator('and', 'and', new Icon('imgs/and_4x3.svg', globalRatio)),
            new Operator('or', 'or', new Icon('imgs/or_4x3.svg', globalRatio)),
            new Operator('xor', 'xor', new Icon('imgs/xor_4x3.svg', globalRatio)),
        ];
        this._operators.forEach(operator =>{    
        this.addOperatorToPalette(operator);
        });
        //Node Tool menu
        const node_mode_imgSrc = "imgs/nodes_icon.svg";
        const node_mode_img = new Image();
        node_mode_img.onload = () => {
            this.addNodeMode(node_mode_img, node_mode_imgSrc);
        };
        node_mode_img.onerror = () => {
            console.error(`Failed to load node mode image`);
        };
        node_mode_img.src = node_mode_imgSrc;
    }

    cancelSelectedOperator(){
        if(editorState == editorStates.nodeEditor){
            editorState = editorStates.operatorEditor;
        }
        nodeStartPos=null;
        placingMode = false;
        selectedOperator = null;
        canvas.classList.remove('placing');
        canvas.style.cursor = 'grab';
        document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
        nodeEditor = document.getElementById("nodeEditor");
        nodeEditor.classList.remove('active');
        this.updateInfo();
        this.draw();
    }

        drawLine(startPos, endPos, lineWidth = 3){
        ctx.strokeStyle = '#100ae5';
        ctx.lineWidth = lineWidth / zoom;

        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
    }

    drawPoint(pos, radius, fillStyle='#e60a41'){
        ctx.fillStyle = fillStyle;
        // Parameters: centerX, centerY, radius, startAngle (radians), endAngle (radians), counterclockwise (boolean)
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    }

    addNodeMode(img, imgSrc){
        const paletteDiv = document.getElementById('toolsPalette');
        const item = document.createElement('div');
        item.className = 'palette-item';

        const imgElement = document.createElement('img');
        imgElement.setAttribute('draggable', false);
        imgElement.src = imgSrc;
        item.id = "nodeEditor";
        item.appendChild(imgElement);
        item.onclick = () => {
            selectedOperator = null;
            if(editorState == editorStates.operatorEditor){
                this.cancelSelectedOperator();
                editorState = editorStates.nodeEditor;
                item.classList.add('active');
                canvas.classList.add('placing');
                canvas.style.cursor = 'crosshair';
                this.updateInfo();
            }
            else if(editorState == editorStates.nodeEditor){
                this.cancelSelectedOperator();
                this.updateInfo();
            }
        };

        paletteDiv.appendChild(item);
        paletteImages.push({ img, src: imgSrc });
    }

    draw(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        // Draw grid
        ctx.strokeStyle = '#333';
        let lineWidth = 2;
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

        //Draw Nodes
        this._nodes.forEach(node => {
            this.drawLine(node.startPos, node.endPos, 5);
        })

        // Draw objects
        this._canvasItems.forEach(obj => {
            if (obj.operator.icon.type === 'image' && obj.operator.icon.img.complete) {
                ctx.drawImage(obj.operator.icon.img, obj.x, obj.y, obj.width, obj.height);
            }
        });
        ctx.closePath();
        let canvasPos = this.screenToCanvas(lastMouseX,lastMouseY);
        canvasPos.x = this.snapToGrid(canvasPos.x);
        canvasPos.y = this.snapToGrid(canvasPos.y);
        if(editorState == editorStates.nodeEditor && !nodeStartPos){
            this.drawPoint({x: canvasPos.x, y: canvasPos.y}, 4, '#100ae5');
        }
        //Draw live creation
        if(nodeStartPos){
            this.drawLine(nodeStartPos, canvasPos);
            this.drawPoint({x: nodeStartPos.x, x : nodeStartPos.y});
        }

        ctx.restore();

        document.getElementById('objectCount').textContent = this._canvasItems.length + this._nodes.length;
    }

    getObjectAt(x, y) {
        for (let i = this._canvasItems.length - 1; i >= 0; i--) {
            const obj = this._canvasItems[i];
            if (obj.operator.icon.type === 'image') {
                if (x >= obj.x && x <= obj.x + obj.width &&
                    y >= obj.y && y <= obj.y + obj.height) {
                    return obj;
                }
            }
        }
        return null;
    }

    getNodeAt(x, y){
            for (let i = this._nodes.length - 1; i >= 0; i--) {
            const node = this._nodes[i];
            if (node.type === 'node') {
                if (x >= node.x && x <= node.x + node.width &&
                    y >= node.y && y <= node.y + node.height){
                    return node;
                }
            }
        }
        return null;
    }

    // ##### Input actions and Canvas creation logic ######
    setUpCanvasControls(){
        // Canvas controls
       widthSlider.addEventListener('input', (e) => {
            canvasWidth = parseInt(e.target.value);
            document.getElementById('widthValue').textContent = canvasWidth;
            this.initCanvas();
        });

        heightSlider.addEventListener('input', (e) => {
            canvasHeight = parseInt(e.target.value);
            document.getElementById('heightValue').textContent = canvasHeight;
            this.initCanvas();
        });

        resetView.addEventListener('click', () => {
            zoom = 1;
            panX = 0;
            panY = 0;
            zoomLevel.textContent = 100;
            this.draw();
        });

        clearCanvas.addEventListener('click', () => {
            if (confirm('Clear all canvas Items?')) {
                this._canvasItems = [];
                this._nodes = [];
                this.draw();
            }
        });

        // Canvas mouse events ========
        //Mouse down
        canvas.addEventListener('mousedown', (e) => {
            const pos = this.screenToCanvas(e.clientX, e.clientY);
            if(editorState == editorStates.operatorEditor){
                this.mouseDownOperatorEdt(pos, e);
            }else if(editorState == editorStates.nodeEditor){
                this.mouseDownNodeEdt(pos, e);
            }

        });

        //Mouse move
        canvas.addEventListener('mousemove', (e) => {
            let shouldDraw = false;
            if(editorState == editorStates.operatorEditor){
                if (draggedObject) {
                    const pos = this.screenToCanvas(e.clientX, e.clientY);
                    let deltaX = this.snapToGrid(pos.x) - dragTranslationLast.x;
                    let deltaY = this.snapToGrid(pos.y) - dragTranslationLast.y;
                    if(draggedObject.type == 'canvasItem'){
                        draggedObject.x += deltaX;
                        draggedObject.y += deltaY;
                    }
                    else if(draggedObject.type == 'node'){
                        draggedObject.startPos.x += deltaX;
                        draggedObject.startPos.y += deltaY;
                        draggedObject.endPos.x += deltaX;
                        draggedObject.endPos.y += deltaY;
                        draggedObject.x += deltaX;
                        draggedObject.y += deltaY;
                    }
                    dragTranslationLast.x = this.snapToGrid(pos.x);
                    dragTranslationLast.y = this.snapToGrid(pos.y);
                    shouldDraw = true;
                } else if (isPanning && !selectedOperator) {
                    panX += e.clientX - lastMouseX;
                    panY += e.clientY - lastMouseY;
                    shouldDraw = true;
                } 
                }else if(editorState == editorStates.nodeEditor){
                //Live draw when in nodeEditor!
                shouldDraw=true;
            }
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            if(shouldDraw){
                this.draw();
            }
            this.updateInfo();
        });

        //Mouse up
        canvas.addEventListener('mouseup', () => {
            draggedObject = null;
            isPanning = false;
            if(editorState == editorStates.operatorEditor){
                if (!placingMode) {
                            draggedObject=null;
                    canvas.style.cursor = 'grab';
                    this.updateInfo();
                }
                canvas.classList.remove('panning');
            }else if(editorState == editorStates.nodeEditor){

            }
        });

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom = clamp(zoom*delta, minZoom, maxZoom);
            zoomLevel.textContent = Math.round(zoom * 100);
            this.draw();
        });

        //Mouse leave
        canvas.addEventListener('mouseleave', () => {
            draggedObject = null;
            isPanning = false;
            canvas.classList.remove('panning');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const panScale = 25;
            if (e.key === '+' || e.key === '=') {
                zoom = Math.min(zoom * 1.2, maxZoom);
                zoomLeveltextContent = Math.round(zoom * 100);
                this.draw();
            } else if (e.key === '-') {
                zoom = Math.max(zoom / 1.2, minZoom);
                zoomLevel.textContent = Math.round(zoom * 100);
                this.draw();
            } else if (e.key === 'Delete' && draggedObject) {
                if(draggedObject.type == 'canvasItem'){
                    this._canvasItems = this._canvasItems.filter(obj => obj !== draggedObject);
                }else if(draggedObject.type == 'node'){
                    this._nodes = this._nodes.filter(obj => obj !== draggedObject);
                }
                draggedObject = null;
                this.draw();
            } else if (e.key === 'Escape') {
                this.cancelSelectedOperator();
            }else if(e.key === 'd'){
                panX-=panScale;
                this.draw();
            }
            else if(e.key === 'w'){
                panY+=panScale;
                this.draw();
            }else if(e.key === 'a'){
                panX+=panScale;
                this.draw();
            }
            else if(e.key === 's'){
                panY-=panScale;
                this.draw();
            }
        });
    }

    initCanvas() {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        this.draw();   
    }

    mouseDownOperatorEdt(pos, e){
        if (placingMode && selectedOperator) {
            // Place the selected object
            if (pos.x >= 0 && pos.x <= canvasWidth &&
                pos.y >= 0 && pos.y <= canvasHeight) {
                if (selectedOperator.icon.type == 'image') {
                    let imgSize = [gridSize*selectedOperator.icon.ratio.x, gridSize*selectedOperator.icon.ratio.y];
                    this._canvasItems.push(new OperatorCanvasItem(selectedOperator,
                                        this.snapToGrid(pos.x - imgSize[0]/2),
                                        this.snapToGrid(pos.y - imgSize[1]/2),
                                        imgSize[0],
                                        imgSize[1]));
                }
                this.draw();
            }
            return;
        }

        const obj = this.getObjectAt(pos.x, pos.y);
        if (obj) {
            draggedObject = obj;
            canvas.style.cursor = 'grabbing';
            dragTranslationLast = {x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y)};
            this.updateInfo();
        }else{
            let node = this.getNodeAt(this.snapToGrid(pos.x), this.snapToGrid(pos.y));
            if(node){
                draggedObject = node;
                dragTranslationLast = {x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y)};
                this.updateInfo();
            }
        }
        //Panning
        if(!draggedObject){
            isPanning = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            canvas.classList.add('panning');
        }
    }

    mouseDownNodeEdt(pos, e){
        if(!nodeStartPos){
            nodeStartPos = {x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y)};
        }else{
            let nodeEndPos = {x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y)};
            this._nodes.push(new LineSegmentCanvasItem(nodeStartPos.x, nodeStartPos.y,
                                                nodeEndPos.x, nodeEndPos.y));
            nodeStartPos=null;
        }
        this.updateInfo();
        this.draw();
    }
}