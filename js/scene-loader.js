// Save scene to JSON
function saveScene() {
    const sceneData = {
        version: '1.0',
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        gridSize: gridSize,
        zoom: zoom,
        panX: panX,
        panY: panY,
        canvasOperators: mainCanvas._canvasOperators.map(obj => ({
            operatorName: obj.operator.name,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        })),
        canvasNodes: mainCanvas._canvasNodes.map(obj => ({
            name: obj.type,
            startPos : [obj.startPos.x, obj.startPos.y],
            endPos : [obj.endPos.x, obj.endPos.y]
        }))
    };
    
    const jsonString = JSON.stringify(sceneData, null, 0);
    
    // Download as file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-scene-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Scene saved!');
}

// Load scene from JSON
function loadScene() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const sceneData = JSON.parse(event.target.result);
                
                // Restore canvas settings
                canvasWidth = sceneData.canvasWidth;
                canvasHeight = sceneData.canvasHeight;
                zoom = sceneData.zoom || 1;
                panX = sceneData.panX || 0;
                panY = sceneData.panY || 0;
                
                // Update UI
                widthSlider.value = canvasWidth;
                document.getElementById('widthValue').textContent = canvasWidth;
                heightSlider.value = canvasHeight;
                document.getElementById('heightValue').textContent = canvasHeight;
                document.getElementById('zoomLevel').textContent = Math.round(zoom * 100);
                
                // Clear existing objects and palette
                mainCanvas.clearCanvas();
                sceneData.canvasOperators.forEach((canvasOp,i) =>{
                    let operator = null;
                    mainCanvas._operators.forEach((op,i)=>{
                        if(op.name == canvasOp.operatorName){
                            operator = op;
                        }
                    });
                    if(operator){
                        mainCanvas._canvasOperators.push(new OperatorCanvasItem(operator, canvasOp.x, canvasOp.y, 
                                                                                canvasOp.width, canvasOp.height));
                    }
                });
                sceneData.canvasNodes.forEach((node, i) =>{
                    mainCanvas._canvasNodes.push(new LineSegmentCanvasItem(node.startPos[0], node.startPos[1],
                                                                           node.endPos[0], node.endPos[1]));
                });
                
            } catch (error) {
                console.error('Error loading scene:', error);
                alert('Error loading scene file. Please check the file format.');
            }

            mainCanvas.draw();
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Add event listeners
document.getElementById('saveScene').addEventListener('click', saveScene);
document.getElementById('loadScene').addEventListener('click', loadScene);