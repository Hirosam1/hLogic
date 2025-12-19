let paletteImages = [];
let objects = [];

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
    if (confirm('Clear all objects?')) {
        objects = [];
        draw();
    }
});



// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.1, Math.min(5, zoom * delta));
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
    draw();
});

function mouseDownOperatorEd(pos, e){
    if (placingMode && selectedTool) {
        // Place the selected object
        if (pos.x >= 0 && pos.x <= canvasWidth &&
            pos.y >= 0 && pos.y <= canvasHeight) {
            let imgSize = [(gridSize*selectedTool.ratio.x), (gridSize*selectedTool.ratio.y)];
            if (selectedTool.type === 'image') {
                objects.push({
                    type: 'image',
                    logic: selectedTool.logic,
                    img: selectedTool.img,
                    x: snapToGrid(pos.x - imgSize[0]/2),
                    y: snapToGrid(pos.y - imgSize[1]/2),
                    width: imgSize[0],
                    height: imgSize[1]
                });
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
}

// Canvas mouse events ========
//Mouse down
canvas.addEventListener('mousedown', (e) => {
    const pos = screenToCanvas(e.clientX, e.clientY);
    if(editorState == editorStates.operatorEditor){
        console.log("Mode: Changed to operator editor");
        mouseDownOperatorEd(pos,e);
    }else if(editorState == editorState.nodeEditor){
        console.log("Mode: Changed to operator editor");
    }
     if(!draggedObject){
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('panning');
    }
});

//Mouse move
canvas.addEventListener('mousemove', (e) => {
    let shouldDraw = false;
    if (draggedObject) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        draggedObject.x = snapToGrid(pos.x - dragOffsetX);
        draggedObject.y = snapToGrid(pos.y - dragOffsetY);
        shouldDraw = true;
    } else if (isPanning && !selectedTool) {
        panX += e.clientX - lastMouseX;
        panY += e.clientY - lastMouseY;
        shouldDraw = true;
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if(shouldDraw){draw();}
    updateInfo();
});

//Mouse up
canvas.addEventListener('mouseup', () => {
    draggedObject = null;
    isPanning = false;
    if (!placingMode) {
                draggedObject=null;
        canvas.style.cursor = 'grab';
        updateInfo();
    }
    canvas.classList.remove('panning');
});

//Mouse leave
canvas.addEventListener('mouseleave', () => {
    draggedObject = null;
    isPanning = false;
    canvas.classList.remove('panning');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') {
        zoom = Math.min(zoom * 1.2, 5);
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
        draw();
    } else if (e.key === '-') {
        zoom = Math.max(zoom / 1.2, 0.1);
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
        draw();
    } else if (e.key === 'Delete' && draggedObject) {
        objects = objects.filter(obj => obj !== draggedObject);
        draggedObject = null;
        draw();
    } else if (e.key === 'Escape') {
        cancelSelectedTool();
    }
});

preloadOperators();
initCanvas();