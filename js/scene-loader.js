const fileSaveVersion = '0.1';

// Save scene to JSON
function saveScene() {
    const sceneData = {
        fileSaveVersion: fileSaveVersion,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        gridSize: gridSize,
        zoom: zoom,
        panX: Math.round(panX),
        panY: Math.round(panY),
        canvasObjects: canvasObjects.map(obj => ({
            objectName: obj.object.name,
            objectType: obj.object.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        })),
        canvasLineSegments: canvasLineSegments.map(obj => ({
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
                sceneData.canvasObjects.forEach((canvasOp,i) =>{
                    let object = null;
                    mainCanvas._objects.forEach((obj,i)=>{
                        if(obj.name == canvasOp.objectName){
                            object = obj;
                        }});
                    if(object){
                        let opr = null;
                        if(object.type == 'operatorObject'){
                            opr = new operatorCanvasFactory(object, canvasOp.x, canvasOp.y,
                                                        canvasOp.width, canvasOp.height);
                        }else{
                            opr = new ObjectCanvasItem(object, canvasOp.x, canvasOp.y, 
                                                        canvasOp.width, canvasOp.height);   
                        }
                        canvasObjects.push(opr);
                    }else{
                        console.error("Couldn't load object: " + canvasOp.operatorName);
                    }
                });
                
                sceneData.canvasLineSegments.forEach((node, i) =>{
                    canvasLineSegments.push(new LineSegmentCanvasItem(node.startPos[0], node.startPos[1],
                                                                           node.endPos[0], node.endPos[1]));
                });

                console.log('Scene loaded!');
            } catch (error) {
                console.error('Error loading scene:', error);
                alert('Error loading scene file. Please check the file format.');
            }
            mainCanvas.scheduleDraw();
        };
        reader.readAsText(file);
    };
    input.click();
}
//Implement save/load handlers
document.getElementById('saveScene').addEventListener('click', ()=>{
    clearSimulation();
    saveScene();
});
document.getElementById('loadScene').addEventListener('click', ()=>{
    clearSimulation();
    loadScene();
});