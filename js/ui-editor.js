class UIEditor{
    constructor(){
        //States====
        this._objects = [];
        this._canvasLineSegments = [];
        this._canvasObjects = [];
        this._needsAnimUpdate = false;
        //this._rafId = 0;
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
                if(selectedObject !== operator){
                    if(editorState != editorStates.simulating){
                        if(editorState == editorStates.nodeEditor){
                            this.cancelSelectedOperator();
                        }
                        document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                        item.classList.add('selected');
                        selectedObject = operator;
                        placingMode = true;
                        canvas.classList.add('placing');
                        canvas.style.cursor = 'crosshair';
                        updateInfo();
                    }
                }else{
                    this.cancelSelectedOperator();
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
            new AbsObject('debugA', new Icon('imgs/debugA_1x1.svg', gridRatio)),
            new AbsObject('debugB', new Icon('imgs/debugB_1x1.svg', gridRatio)),
            new AbsObject('debugC', new Icon('imgs/debugC_1x1.svg', gridRatio)),
            new AbsObject('transistor', new Icon('imgs/transistor.svg', hSquareRatio)),
            new AbsObject('switch', new Icon('imgs/switch_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('outputLed', new Icon('imgs/output_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('not', new Icon('imgs/not_2x2.svg', hSquareRatio), 'operatorObject'),
            new AbsObject('and', new Icon('imgs/and_4x3.svg', globalRatio), 'operatorObject'),
            new AbsObject('or', new Icon('imgs/or_4x3.svg', globalRatio), 'operatorObject'),
            new AbsObject('xor'  , new Icon('imgs/xor_4x3.svg', globalRatio), 'operatorObject'),
            new AbsObject('5bDisplay', new Icon('imgs/5bDisplayI_2x4.svg', rectRatio), 'operatorObject')
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
        this.scheduleDraw();
    }

    drawGrid(){
        const lineWidth = 0.75;
        const lineWidthZ = lineWidth / zoom;
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
            let strokeStyle = editorState === editorStates.simulating? '#74738bff' : '#100ae5';
            if(editorState == editorStates.simulating){
                const vA = line.edge.vertexA;
                const vB = line.edge.vertexB;
                if(vA.value && vB.value){strokeStyle='#c7bb17ff';}
                else if(vA.value === false && vB.value === false){strokeStyle='#100ae5'}
            }
            drawLine(line.startPos, line.endPos, 5, strokeStyle);
    
        });
        ctx.closePath();
        // Draw objects
        this._canvasObjects.forEach(obj => {
            if (obj.object.icon.type === 'image' && obj.object.icon.img.complete) {
                ctx.drawImage(obj.object.icon.img, obj.x, obj.y, obj.width, obj.height);
                if(obj.drawEffects) obj.drawEffects();
            }
        });
        if(editorState == editorStates.simulating){
            verticesPosList.forEach(vertPos => {
                const fillStyle = vertPos.vertex.value !== undefined ? vertPos.vertex.value ? '#11c08cff' : '#e60a41' :'#c252dfff';
                drawPoint(vertPos.pos, 2, fillStyle);
            });
        }else{
            //Draw nodes
            this._canvasLineSegments.forEach(node => {
                const fillStyle = '#11c08cff';
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
        else if(nodeStartPos){
            drawLine(nodeStartPos, canvasPos);
            drawPoint(nodeStartPos);
        }

        ctx.restore();
        document.getElementById('objectCount').textContent = this._canvasObjects.length + this._canvasLineSegments.length;
    }

    scheduleDraw(){
        if(!this._needsAnimUpdate){
            this._needsAnimUpdate = true;
            window.requestAnimationFrame(()=>{
                this.draw();
                this._needsAnimUpdate = false;
            });
        }
    }

    clearCanvas(){
        this._canvasObjects = [];
        this._canvasLineSegments = [];
        this.scheduleDraw();
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
        const rect = container.getBoundingClientRect();
        canvas.width = rect.right - rect.left;
        canvas.height = rect.bottom - rect.top;
        this.scheduleDraw();   
    }
}

let mainCanvas = undefined;

//===== Set up Canvas controls ========
window.addEventListener('resize', ()=>{
    mainCanvas.initCanvas();
});

widthSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    canvasWidth = parseInt(e.target.value);
    document.getElementById('widthValue').textContent = val;
    canvasWidth = val;
    mainCanvas.scheduleDraw();
});

heightSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('heightValue').textContent = val;
    canvasHeight=val;
    mainCanvas.scheduleDraw();
});

resetView.addEventListener('click', () => {
    zoom = 1;
    panX = 0;
    panY = 0;
    zoomLevel.textContent = 100;
    mainCanvas.scheduleDraw();
});

clearCanvas.addEventListener('click', () => {
    //if (confirm('Clear all canvas Items?')) {
        mainCanvas.clearCanvas();
        clearSimulation();
        mainCanvas.scheduleDraw();
    //}
});