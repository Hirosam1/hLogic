//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
const maxPIterations = 50;
let isSimulating = false;
let switches = [];
let readyOperators = [];

function unReadyOperators(){
    readyOperators = [];
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator'){
            obj.graphItem.isReady = false;
            obj.graphItem.inputsVertices.forEach(i =>{i.value = undefined;});
            //obj.graphItem.outputVertex.value = undefined;
        }
    });
}

function clearSimulation(){
    //let isSimulating = false;
    switches = [];
    readyOperators = []
    clearVertices();
    unReadyOperators();
    canvasControls.style.background = '#2a2a2af2';
    startSimulation.innerHTML = 'Start Simulation ▶️';
    container.classList.remove('simulating');
    editorState = editorStates.objectEditor;
}

function getUpdatedEndVertsObjects(endVerts, newVal){
    let objects = [];
    endVerts.forEach(vert =>{
        if(vert.type === verticesTypes.input && vert.value !== newVal){
            vert.value = newVal;
            let vertexPos = getVertexPos(vert);
            let canvasObj = mainCanvas.getObjectAt(vertexPos.x, vertexPos.y);
            if(canvasObj){
                objects.push(canvasObj);
            }
        }
    });
    return objects;
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
// between the new input value and the current, if they differ, update the 
//input value, and reprocess the operator.
function simulateDFSd(){
    //Propagate switch signal across operators until it is not changing the input value, 
    // or it cant search further.
    let pIterations = 0;
    for(let i = 0; i < switches.length; i++){
        let swV = switches[i].graphItem.outputVertex;
        swV.value = switches[i].graphItem.logic.enabled;
        switches[i].graphItem.isReady = true;
        let endVerts = propagateDFS(swV.value, [swV]);
        pIterations += 1;
        if(!endVerts) break;
        let nextObjects = getUpdatedEndVertsObjects(endVerts, swV.value);
        while(nextObjects.length !== 0 && pIterations <= maxPIterations){
            let nextObj = nextObjects.pop();
            if(nextObj.type === 'operator'){
                nextObj.process();
                oV = nextObj.graphItem.outputVertex;
                if(oV){
                    endVerts = propagateDFS(oV.value, [oV]);
                    pIterations += 1;
                    if(endVerts){
                        nextObjects = nextObjects.concat(getUpdatedEndVertsObjects(endVerts, oV.value));
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
    mainCanvas.draw();
}


function simulateDFS(){
    //Propagate switch signal across operators until it is not changing the input value, 
    // or it cant search further.
    let pIterations = 0;
    for(let i = 0; i < switches.length; i++){
        let swV = switches[i].graphItem.outputVertex;
        swV.value = switches[i].graphItem.logic.enabled;
        switches[i].graphItem.isReady = true;
        let endVerts = propagateVertices(swV.value, [swV]);
        console.log(endVerts.length);
        pIterations += 1;
        if(!endVerts) break;
        let nextObjects = updateObjectsVertices(endVerts);
        while(nextObjects.length !== 0 && pIterations <= maxPIterations){
            let nextObj = nextObjects.pop();
            if(nextObj.type === 'operator'){
                nextObj.process();
                oV = nextObj.graphItem.outputVertex;
                if(oV){
                    endVerts = propagateVertices(oV.value, [oV]);
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
    mainCanvas.draw();
}