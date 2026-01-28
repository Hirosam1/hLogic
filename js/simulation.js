//===  Simulation logic ====
const startSimulation = document.getElementById('startSimulation');
const maxPIterations = 50;
let isSimulating = false;

function unReadyOperators(){
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator'){
            obj.graphItem.isReady = false;
            obj.graphItem.inputsVertices.forEach(i =>{i.value = undefined;});
        }
    });
}

function clearSimulation(){
    clearVertices();
    unReadyOperators();
    canvasControls.style.background = '#2a2a2af2';
    startSimulation.innerHTML = 'Start Simulation ▶️';
    container.classList.remove('simulating');
    editorState = editorStates.objectEditor;
}

/**
 * @param {Vertex[]} vertices The vertices to be searched.
 * @returns {CanvasItem[]} The list of canvas items connected to the vertices.
 */
function getObjectsFromVertices(vertices){
    let objects = [];
    vertices.forEach(vert =>{
         if(vert.type === verticesTypes.input){
            let vertexPos = getVertexPos(vert);
            let canvasObj = mainCanvas.getObjectAt(vertexPos.x, vertexPos.y);
            if(canvasObj && !objects.includes(canvasObj)){
                objects.push(canvasObj);
            }
         }
    });
    return objects;
}

/**
* For each start object, traverses the graph with DFS, and propagates its value across 
* the next objects. Then, process the new value for the updated objects, and repeat,
* until a dead end, or if there are no objects to be updated.
* @param {*} startObjects
*/
function simulateDFS(startObjects){
    let pIterations = 0;
    for(let i = 0; i < startObjects.length; i++){
        let swV = startObjects[i].graphItem.outputVertex;
        swV.value = startObjects[i].graphItem.logic.enabled;
        startObjects[i].graphItem.isReady = true;
        let endVerts = propagateVertex(swV);
        pIterations += 1;
        if(!endVerts) break;
        let nextObjects = getObjectsFromVertices(endVerts);
        while(nextObjects.length !== 0 && pIterations <= maxPIterations){
            let nextObj = nextObjects.pop();
            if(nextObj.type === 'operator'){
                nextObj.process();
                oV = nextObj.graphItem.outputVertex;
                if(oV){
                    endVerts = propagateVertex(oV);
                    pIterations += 1;
                    if(endVerts){
                        nextObjects = nextObjects.concat(getObjectsFromVertices(endVerts));
                    }else{
                        break;
                    }
                }
            }
        }
    }
    if(pIterations > maxPIterations){
        console.error("Reached maximum of process iterations!");
    }
    console.log('Process iterations: ' + pIterations + ' Total iterations: ' + propagateIterations);
    propagateIterations = 0;
    pIterations = 0;
    mainCanvas.scheduleDraw();
}

startSimulation.addEventListener('click', () => {
    isSimulating = !isSimulating;
    mainCanvas.cancelSelectedOperator();
    if(isSimulating){
        unReadyOperators();
        canvasControls.style.background = '#a34f28f2';
        startSimulation.innerHTML = 'Stop Simulation ⏹️';
        container.classList.add('simulating');
        editorState = editorStates.simulating;
        readyOperators = [];
        //Load line segments and edges
        mainCanvas._canvasLineSegments.forEach(lineSeg => { 
            lineSeg.graphItem.createVertices(); 
            lineSeg.createEdge();
        });
        //Load operators and vertices
        let switches = [];
        mainCanvas._canvasObjects.forEach(obj => {
            if(obj.type === 'operator'){
                obj.graphItem.createVertices();
            }
            if(obj.object.name ==='switch'){
                obj.graphItem.logic.enabled = false;
                switches.push(obj);
            }
        });
        console.log("vertices: "  + verticesPosList.length + " edges: " + edgesList.length);
        console.log("matches: " + __verticesMatch + " switches: " + switches.length);
        simulateDFS(switches);
    }else{
        clearSimulation();
        canvasControls.style.background = '#2a2a2af2';
        editorState = editorStates.objectEditor;
    }
    mainCanvas.scheduleDraw();
});