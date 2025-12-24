mainCanvas = new UIEditor();
mainCanvas.preloadPalletMenu();
mainCanvas.initCanvas();

//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
let isSimulating = false;
startSimulation.addEventListener('click', () => {
    isSimulating = !isSimulating;
    const simTxt = isSimulating ? 'Stop Simulation ⏹️' : 'Start Simulation ▶️';
    startSimulation.innerHTML=simTxt;
    mainCanvas.cancelSelectedOperator();
    if(isSimulating){
        editorState = editorStates.simulating;
        clearVertices();
        mainCanvas._canvasLineSegments.forEach(lineSeg => { 
            lineSeg.createVertices();
        });
        let switches = [];
        mainCanvas._canvasOperators.forEach(op => { 
            op.graphItem.createVertices();
            if(op.operator.name=='switch'){
                switches.push(op);
            }
        });
        console.log("vertices: "  + verticesPosList.length + " matches: " + __verticesMatch + " switches: " + switches.length);
    }else{
        editorState = editorStates.operatorEditor;
    }
    mainCanvas.draw();
});

// Add save handlers
document.getElementById('saveScene').addEventListener('click', ()=>{saveScene();});
document.getElementById('loadScene').addEventListener('click', ()=>{
    loadScene(); 
    clearVertices();
    isSimulating = false;
    startSimulation.innerHTML = 'Start Simulation ▶️';
});

//===== Set up Canvas controls ========
function mouseDownOperatorEdt(pos, e){
    if (placingMode && selectedOperator) {
        // Place the selected object
        if (pos.x >= 0 && pos.x <= canvasWidth &&
            pos.y >= 0 && pos.y <= canvasHeight) {
            if (selectedOperator.icon.type == 'image') {
                let imgSize = [gridSize*selectedOperator.icon.ratio.x, gridSize*selectedOperator.icon.ratio.y];
                let opr = new OperatorCanvasItem(selectedOperator,
                                    snapToGrid(pos.x - imgSize[0]/2),
                                    snapToGrid(pos.y - imgSize[1]/2),
                                    imgSize[0],
                                    imgSize[1]);
                mainCanvas._canvasOperators.push(opr);
            }
            mainCanvas.draw();
        }
        return;
    }

    const obj = mainCanvas.getOperatorAt(pos.x, pos.y);
    if (obj) {
        draggedObject = obj;
        canvas.style.cursor = 'grabbing';
        dragTranslationLast = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
        updateInfo();
    }else{
        let node = mainCanvas.getLineSegmentAt(snapToGrid(pos.x), snapToGrid(pos.y));
        if(node){
            draggedObject = node;
            dragTranslationLast = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
            updateInfo();
        }
    }
}

function mouseDownNodeEdt(pos, e){
    if(!nodeStartPos){
        nodeStartPos = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
    }else{
        let nodeEndPos = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
        mainCanvas._canvasLineSegments.push(new LineSegmentCanvasItem(nodeStartPos.x, nodeStartPos.y,
                                            nodeEndPos.x, nodeEndPos.y));
        nodeStartPos=null;
    }
    updateInfo();
    mainCanvas.draw();
}

function mouseDownSimulatingEdt(pos, e){
    const obj = mainCanvas.getOperatorAt(pos.x, pos.y);
    if (obj){
        canvas.style.cursor = 'grabbing';
        console.log(obj.operator.name);
        updateInfo();
        return false;
    }
    return true;
}

widthSlider.addEventListener('input', (e) => {
    canvasWidth = parseInt(e.target.value);
    document.getElementById('widthValue').textContent = canvasWidth;
    mainCanvas.initCanvas();
});

heightSlider.addEventListener('input', (e) => {
    canvasHeight = parseInt(e.target.value);
    document.getElementById('heightValue').textContent = canvasHeight;
    mainCanvas.initCanvas();
});

resetView.addEventListener('click', () => {
    zoom = 1;
    panX = 0;
    panY = 0;
    zoomLevel.textContent = 100;
    mainCanvas.draw();
});

clearCanvas.addEventListener('click', () => {
    if (confirm('Clear all canvas Items?')) {
        mainCanvas.clearCanvas();
        clearVertices();
        isSimulating = false;
        startSimulation.innerHTML = 'Start Simulation ▶️';
        mainCanvas.draw();
    }
});
// Canvas mouse events ========
//Mouse down
canvas.addEventListener('mousedown', (e) => {
    const pos = screenToCanvas(e.clientX, e.clientY);
    let shouldPan = false;
    if(editorState == editorStates.operatorEditor){
        mouseDownOperatorEdt(pos, e);
    }else if(editorState == editorStates.nodeEditor){
        mouseDownNodeEdt(pos, e);
    }else if(editorState == editorStates.simulating){
        shouldPan = this.mouseDownSimulatingEdt(pos, e);
    }
    if(editorState == editorStates.operatorEditor || shouldPan){
        //Panning
        if(!draggedObject){
            isPanning = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            canvas.classList.add('panning');
        }
    }
});

//Mouse move
canvas.addEventListener('mousemove', (e) => {
    let shouldDraw = false;
    if(editorState == editorStates.operatorEditor){
        if (draggedObject) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            let deltaX = snapToGrid(pos.x) - dragTranslationLast.x;
            let deltaY = snapToGrid(pos.y) - dragTranslationLast.y;
            if(draggedObject.type == 'operator'){
                draggedObject.updatePos(draggedObject.x + deltaX, draggedObject.y + deltaY);
            }
            else if(draggedObject.type == 'lineSegment'){
                draggedObject.startPos.x += deltaX;
                draggedObject.startPos.y += deltaY;
                draggedObject.endPos.x += deltaX;
                draggedObject.endPos.y += deltaY;
                draggedObject.x += deltaX;
                draggedObject.y += deltaY;
            }
            dragTranslationLast.x = snapToGrid(pos.x);
            dragTranslationLast.y = snapToGrid(pos.y);
            shouldDraw = true;
        }
    }else if(editorState == editorStates.nodeEditor){
            //Live draw when in nodeEditor!
            shouldDraw=true;
    }
    if (isPanning && !selectedOperator) {
        panX -= e.clientX - lastMouseX;
        panY -= e.clientY - lastMouseY;
        shouldDraw = true;
    } 
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if(shouldDraw){
        mainCanvas.draw();
    }
    updateInfo();
});

//Mouse up
canvas.addEventListener('mouseup', () => {
    draggedObject = null;
    isPanning = false;
    if(editorState == editorStates.operatorEditor){
        if (!placingMode) {
                    draggedObject=null;
            canvas.style.cursor = 'grab';
            updateInfo();
        }
        canvas.classList.remove('panning');
    }else if(editorState == editorStates.nodeEditor){

    }
});

// Mouse wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = clamp(zoom*delta, minZoom, maxZoom); 
    const mousePosCanv = screenToCanvas(lastMouseX, lastMouseY);
    let zoomDspl = -(1.0-delta);
    panX+=(zoomDspl*(mousePosCanv.x));
    panY+=(zoomDspl*(mousePosCanv.y));
    zoomLevel.textContent = Math.round(zoom * 100);
    mainCanvas.draw();
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
        mainCanvas.draw();
    } else if (e.key === '-') {
        zoom = Math.max(zoom / 1.2, minZoom);
        zoomLevel.textContent = Math.round(zoom * 100);
        mainCanvas.draw();
    } else if (e.key === 'Delete' && draggedObject) {
        if(draggedObject.type == 'operator'){
            mainCanvas._canvasOperators = mainCanvas._canvasOperators.filter(obj => obj !== draggedObject);
        }else if(draggedObject.type == 'lineSegment'){
            mainCanvas._canvasLineSegments = mainCanvas._canvasLineSegments.filter(obj => obj !== draggedObject);
        }
        draggedObject = null;
        mainCanvas.draw();
    } else if (e.key === 'Escape') {
        mainCanvas.cancelSelectedOperator();
    }else if(e.key === 'd'){
        panX+=panScale;
        mainCanvas.draw();
    }
    else if(e.key === 'w'){
        panY-=panScale;
        mainCanvas.draw();
    }else if(e.key === 'a'){
        panX-=panScale;
        mainCanvas.draw();
    }
    else if(e.key === 's'){
        panY+=panScale;
        mainCanvas.draw();
    }
});