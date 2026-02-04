mainCanvas.preloadPalletMenu();
mainCanvas.initCanvas();

draggedObjectLastPos = undefined;

//Input logic
function mouseDownOperatorEdt(pos, e){
    if (placingMode && selectedObject) {
        if (pos.x >= 0 && pos.x <= canvasWidth &&
            pos.y >= 0 && pos.y <= canvasHeight){
            if (selectedObject.icon.type == 'image') {
                // Place the selected object
                let obj = undefined;
                let imgSize = [gridSize*selectedObject.icon.ratio.x, gridSize*selectedObject.icon.ratio.y];
                if(selectedObject.type == 'operatorObject'){
                    obj = operatorCanvasFactory(selectedObject,
                                        snapToGrid(pos.x - imgSize[0]/2),
                                        snapToGrid(pos.y - imgSize[1]/2),
                                        imgSize[0],
                                        imgSize[1]);
                }else{
                    obj = new ObjectCanvasItem(selectedObject,
                        snapToGrid(pos.x - imgSize[0]/2),
                        snapToGrid(pos.y - imgSize[1]/2),
                        imgSize[0],
                        imgSize[1]);
                }
                mainCanvas.addCanvasObject(obj);
            }
        }
        return;
    }
    const obj = mainCanvas.getObjectAt(pos.x, pos.y);
    if (obj){
        draggedObjectLastPos = {x: obj.x, y: obj.y};
        draggedObject = obj;
        canvas.style.cursor = 'grabbing';
        dragTranslationLast = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
        updateInfo();
    }else{
        let node = mainCanvas.getLineSegmentAt(snapToGrid(pos.x), snapToGrid(pos.y));
        if(node){
            draggedObjectLastPos = {x: node.x, y: node.y};
            draggedObject = node;
            canvas.style.cursor = 'grabbing';
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
        mainCanvas.addCanvasObject(new LineSegmentCanvasItem(nodeStartPos.x, nodeStartPos.y,
                                nodeEndPos.x, nodeEndPos.y));
        nodeStartPos=null;
    }
    updateInfo();
    mainCanvas.scheduleDraw();
}

function mouseDownSimulatingEdt(pos, e){
    const obj = mainCanvas.getObjectAt(pos.x, pos.y);
    if (obj){
        selectedObject = obj;
        updateInfo(obj);
        //Start propagating signal when a switch is flip
        if(obj.object.name === 'switch'){
            let o = obj.process();
            simulateDFS([obj]);
        }
        return obj;
    }
    return null;
}

// Canvas mouse events ========
//Mouse down
canvas.addEventListener('mousedown', (e) => {
    const pos = screenToCanvas(e.clientX, e.clientY);
    let actObj = null;
    if(editorState == editorStates.objectEditor){
        mouseDownOperatorEdt(pos, e);
    }else if(editorState == editorStates.nodeEditor){
        mouseDownNodeEdt(pos, e);
    }else if(editorState == editorStates.simulating){
        actObj = mouseDownSimulatingEdt(pos, e);
    }
    if(editorState == editorStates.objectEditor || (editorState == editorStates.simulating  && !actObj)){
        //Panning
        if(!draggedObject){
            isPanning = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            //canvas.classList.add('panning');
            if(editorState !== editorStates.nodeEditor) canvas.style.cursor = 'grabbing';
        }
    }
});

//Mouse move
canvas.addEventListener('mousemove', (e) => {
    let shouldDraw = false;
    const pos = screenToCanvas(e.clientX, e.clientY);
    const gridPos = {x :snapToGrid(pos.x), y: snapToGrid(pos.y)};
    if(editorState == editorStates.objectEditor){
        if (draggedObject) {
            const deltaX = gridPos.x - dragTranslationLast.x;
            const deltaY = gridPos.y - dragTranslationLast.y;
            if(draggedObject.type == 'operator' || draggedObject.type == 'object'){
                draggedObject.updatePos(draggedObject.x + deltaX, draggedObject.y + deltaY);
            }
            else if(draggedObject.type == 'lineSegment'){
                draggedObject.updatePos(draggedObject.x + deltaX, draggedObject.y + deltaY);
            }
            dragTranslationLast.x = gridPos.x;
            dragTranslationLast.y = gridPos.y;
            shouldDraw = true;
        }else if(selectedObject){
            canvas.style.cursor = 'alias';
        }else if(!isPanning){
            let obj = mainCanvas.getObjectAt(pos.x, pos.y);
            let lin = mainCanvas.getLineSegmentAt(gridPos.x, gridPos.y);
            if(obj || lin){
                canvas.style.cursor = 'pointer';
            }else{
                canvas.style.cursor = 'grab';
            }
        }
    }else if(editorState == editorStates.nodeEditor){
        //Live draw when in nodeEditor!
        shouldDraw=true;
    }else if(editorState == editorStates.simulating){
        if(isPanning){
        }else{
            let obj = mainCanvas.getObjectAt(pos.x, pos.y);
            if(obj){
                canvas.style.cursor = 'pointer';
            }else{
                canvas.style.cursor = 'grab';
            }
        }
    }

    if (isPanning && !selectedObject) {
        panX -= e.clientX - lastMouseX;
        panY -= e.clientY - lastMouseY;
        shouldDraw = true;
    } 
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if(shouldDraw){
        mainCanvas.scheduleDraw();
    }
    updateInfo();
});

//Mouse up
canvas.addEventListener('mouseup', (e) => {
    const pos = screenToCanvas(e.clientX, e.clientY);
    const gridPos = {x :snapToGrid(pos.x), y: snapToGrid(pos.y)};
    if(draggedObject){
        const deltaX = gridPos.x - dragTranslationLast.x;
        const deltaY = gridPos.y - dragTranslationLast.y;
        const newPos = {x: draggedObject.x + deltaX, y: draggedObject.y + deltaY};
        mainCanvas.moveObject(draggedObject, newPos, draggedObjectLastPos);
        draggedObjectLastPos = undefined;
        draggedObject = null;
    }
    isPanning = false;
    if(editorState == editorStates.objectEditor){
        if (!placingMode){
            draggedObject=null;
            canvas.style.cursor = 'grab';
            updateInfo();
        }
        canvas.classList.remove('panning');
    }else if(editorState == editorStates.nodeEditor){

    }else if(editorState == editorStates.simulating){
        selectedObject = null;
        updateInfo();
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
    mainCanvas.scheduleDraw();
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
        mainCanvas.scheduleDraw();
    } else if (e.key === '-') {
        zoom = Math.max(zoom / 1.2, minZoom);
        zoomLevel.textContent = Math.round(zoom * 100);
        mainCanvas.scheduleDraw();
    } else if (e.key === 'Delete' && draggedObject){
        draggedObject.updatePos(draggedObjectLastPos.x, draggedObjectLastPos.y);
        mainCanvas.deleteCanvasObject(draggedObject);
        draggedObject = null;
        draggedObjectLastPos = undefined;
    } else if (e.key === 'Escape') {
        mainCanvas.cancelSelectedOperator();
    }else if(e.key === 'd'){
        panX+=panScale;
        mainCanvas.scheduleDraw();
    }
    else if(e.key === 'w'){
        panY-=panScale;
        mainCanvas.scheduleDraw();
    }else if(e.key === 'a'){
        panX-=panScale;
        mainCanvas.scheduleDraw();
    }
    else if(e.key === 's'){
        panY+=panScale;
        mainCanvas.scheduleDraw();
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const ok = mainCanvas.undo();
        console.log(`!!Undo!! H[${mainCanvas.history.currentIndex}/${mainCanvas.history.history.length}] ${ok}`);
    }else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() == 'z' && e.shiftKey) {
        const ok = mainCanvas.redo();
        console.log(`!!Redo!! H[${mainCanvas.history.currentIndex}/${mainCanvas.history.history.length}] ${ok}`);
    }
});