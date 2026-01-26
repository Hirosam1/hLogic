//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
const maxPIterations = 50;
let isSimulating = false;
let switches = [];

function unReadyOperators(){
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator'){
            obj.graphItem.isReady = false;
            obj.graphItem.inputsVertices.forEach(i =>{i.value = undefined;});
        }
    });
}

function clearSimulation(){
    //let isSimulating = false;
    switches = [];
    clearVertices();
    unReadyOperators();
    canvasControls.style.background = '#2a2a2af2';
    startSimulation.innerHTML = 'Start Simulation ▶️';
    container.classList.remove('simulating');
    editorState = editorStates.objectEditor;
}

function updateObjectsVertices(vertices){
    let objects = [];
    vertices.forEach(vert =>{
         if(vert.type === verticesTypes.input){
            let vertexPos = getVertexPos(vert);
            let canvasObj = mainCanvas.getObjectAt(vertexPos.x, vertexPos.y);
            if(canvasObj){
                objects.push(canvasObj);
            }
         }
    });
    return objects;
}

//Perform graph traversal (DFS) to find inputs,
//until there are no vertices to visit.
//Any input operator is not updated, the program will check if there is a difference 
//between the new input value and the current, if they differ, update the 
//input value, and reprocess the operator.
//Propagate switch signal across operators until it is not changing the input value, 
//or it cant search further.
function simulateDFS(){
    let pIterations = 0;
    for(let i = 0; i < switches.length; i++){
        let swV = switches[i].graphItem.outputVertex;
        swV.value = switches[i].graphItem.logic.enabled;
        switches[i].graphItem.isReady = true;
        let endVerts = propagateVertex(swV);
        pIterations += 1;
        if(!endVerts) break;
        let nextObjects = updateObjectsVertices(endVerts);
        while(nextObjects.length !== 0 && pIterations <= maxPIterations){
            let nextObj = nextObjects.pop();
            if(nextObj.type === 'operator'){
                nextObj.process();
                oV = nextObj.graphItem.outputVertex;
                if(oV){
                    endVerts = propagateVertex(oV);
                    pIterations += 1;
                    if(endVerts){
                        nextObjects = nextObjects.concat(updateObjectsVertices(endVerts));
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
        //clearSimulation();
        canvasControls.style.background = '#a34f28f2';
        startSimulation.innerHTML = 'Stop Simulation ⏹️';
        container.classList.add('simulating');
        editorState = editorStates.simulating;
        switches = [];
        readyOperators = [];
        //Load line segments and edges
        mainCanvas._canvasLineSegments.forEach(lineSeg => { 
            lineSeg.graphItem.createVertices(); 
            lineSeg.createEdge();
        });
        //Load operators and vertices
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
        simulateDFS();
    }else{
        clearSimulation();
        canvasControls.style.background = '#2a2a2af2';
        editorState = editorStates.objectEditor;
    }
    mainCanvas.scheduleDraw();
});