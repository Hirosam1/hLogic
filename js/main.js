// Canvas controls
document.getElementById('widthSlider').addEventListener('input', (e) => {
    canvasWidth = parseInt(e.target.value);
    document.getElementById('widthValue').textContent = canvasWidth;
    initCanvas();
});

document.getElementById('heightSlider').addEventListener('input', (e) => {
    canvasHeight = parseInt(e.target.value);
    document.getElementById('heightValue').textContent = canvasHeight;
    initCanvas();
});

document.getElementById('resetView').addEventListener('click', () => {
    zoom = 1;
    panX = 0;
    panY = 0;
    document.getElementById('zoomLevel').textContent = 100;
    draw();
});

document.getElementById('clearCanvas').addEventListener('click', () => {
    if (confirm('Clear all canvas Items?')) {
        canvasItems = [];
        draw();
    }
});


function mouseDownOperatorEdt(pos, e){
    if (placingMode && selectedOperator) {
        // Place the selected object
        if (pos.x >= 0 && pos.x <= canvasWidth &&
            pos.y >= 0 && pos.y <= canvasHeight) {
            if (selectedOperator.icon.type == 'image') {
                let imgSize = [gridSize*selectedOperator.icon.ratio.x, gridSize*selectedOperator.icon.ratio.y];
                canvasItems.push(new OperatorCanvasItem(selectedOperator,
                                    snapToGrid(pos.x - imgSize[0]/2),
                                    snapToGrid(pos.y - imgSize[1]/2),
                                    imgSize[0],
                                    imgSize[1]));
            }
            draw();
        }
        return;
    }

    const obj = getObjectAt(pos.x, pos.y);

    if (obj) {
        draggedObject = obj;
        dragOffsetX = pos.x - obj.x;
        dragOffsetY = pos.y - obj.y;
        canvas.style.cursor = 'grabbing';
        updateInfo();
    }
    //Panning
    if(!draggedObject){
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('panning');
    }
}

function mouseDownNodeEdt(pos, e){
    nodeStartPos = {x: snapToGrid(pos.x), y: snapToGrid(pos.y)};
    updateInfo();
}

// Canvas mouse events ========
//Mouse down
canvas.addEventListener('mousedown', (e) => {
    const pos = screenToCanvas(e.clientX, e.clientY);
    if(editorState == editorStates.operatorEditor){
        mouseDownOperatorEdt(pos, e);
    }else if(editorState == editorStates.nodeEditor){
        mouseDownNodeEdt(pos, e);
    }

});

//Mouse move
canvas.addEventListener('mousemove', (e) => {
    let shouldDraw = false;
    if(editorState == editorStates.operatorEditor){
        if (draggedObject) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            draggedObject.x = snapToGrid(pos.x - dragOffsetX);
            draggedObject.y = snapToGrid(pos.y - dragOffsetY);
            shouldDraw = true;
        } else if (isPanning && !selectedOperator) {
            panX += e.clientX - lastMouseX;
            panY += e.clientY - lastMouseY;
            shouldDraw = true;
        }
    }if(editorState == editorStates.nodeEditor){
        //Live draw when in nodeEditor!
        shouldDraw=true;
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if(shouldDraw){
        draw();
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

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = clamp(zoom*delta, minZoom, maxZoom);
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
    draw();
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
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
        draw();
    } else if (e.key === '-') {
        zoom = Math.max(zoom / 1.2, minZoom);
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
        draw();
    } else if (e.key === 'Delete' && draggedObject) {
        canvasItems = canvasItems.filter(obj => obj !== draggedObject);
        draggedObject = null;
        draw();
    } else if (e.key === 'Escape') {
        cancelSelectedOperator();
    }else if(e.key === 'd'){
        panX-=panScale;
        draw();
    }
    else if(e.key === 'w'){
        panY+=panScale;
        draw();
    }else if(e.key === 'a'){
        panX+=panScale;
        draw();
    }
    else if(e.key === 's'){
        panY-=panScale;
        draw();
    }
});

preloadPalletMenu();
initCanvas();