//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
const maxPIterations = 50;
let isSimulating = false;
let switches = [];
let readyOperators = [];

function clearSimulation(){
    let isSimulating = false;
    switches = [];
    readyOperators = []
    clearVertices();
    canvasControls.style.background = '#2a2a2af2';
    startSimulation.innerHTML = 'Start Simulation ▶️';
    container.classList.remove('simulating');
    editorState = editorStates.objectEditor;
}

function populateReadyOperators(){
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator' && !obj.graphItem.isReady){
            if(obj.process()){
                readyOperators.push(obj);
            }
        }
    });
}

function updateEndVerticesOutputs(endVertices, newValue){
    endVertices.forEach(v =>{
        if(v.type !== verticesTypes.output){
            if(v.value != newValue){
                v.value = newValue;
                let vertexPos = getVertexPos(v);
                let canvasObj = mainCanvas.getObjectAt(vertexPos.x, vertexPos.y);
                if(canvasObj && canvasObj.type == 'operator'){
                    console.log(canvasObj.object.name);
                    //Process new output value and sets next iteration to propagate again.
                    canvasObj.process();
                    canvasObj.graphItem.isReady = false;
                }
            }
        }else{
            
        }
    });
}

function propagateSwitches(){
    let endVertices = [];
    switches.forEach(sw => {
        //let lastVerts = [propagateUtilNull(swVert)];
        let oV = sw.graphItem.outputVertex;
        oV.value = sw.graphItem.logic.enabled;
        let lastVerts = propagateUtilNullR(oV.value,[oV]);
        sw.graphItem.isReady = true;
        if(lastVerts){
            endVertices = endVertices.concat(lastVerts);
            updateEndVerticesOutputs(lastVerts, oV.value);
        }
    });
    return endVertices;
}

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

//Perform graph traversal (DFS) to find inputs,
//until there are no vertices to visit.
//Any input operator is not updated, the program will check if there is a difference 
// between the new input value and the current, if they differ, update the 
//input value, and reprocess the operator.
function simulate(){
    //unReadyOperators();
    //First big iteration
    let endVerts = propagateSwitches();
    let pIterations = 1;
    let done = false;
    while(!done && pIterations <= maxPIterations){
        //Second big iteration and others
        populateReadyOperators();
        readyOperators.forEach(readyOp =>{
            let oV = readyOp.graphItem.outputVertex;
            if(oV){
                endVerts = propagateUtilNullR(oV.value ,[oV]);
                if(endVerts) updateEndVerticesOutputs(endVerts, oV.value);
            }
        });
        if(readyOperators.length == 0){done = true;}
        readyOperators = [];
        pIterations++;
    }
    console.log('Process iterations: ' + pIterations + ' Total iterations: ' + propagateIterations + ' done: ' + done);
    propagateIterations = 0;
    pIterations = 0;
    mainCanvas.draw();
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

function simulateDFS(){
    //Propagate switch signal across operators until it is not changing the input value, 
    // or it cant search further.
    let pIterations = 0;
    for(let i = 0; i < switches.length; i++){
        let swV = switches[i].graphItem.outputVertex;
        swV.value = switches[i].graphItem.logic.enabled;
        switches[i].graphItem.isReady = true;
        let endVerts = propagateUtilNullR(swV.value, [swV]);
        pIterations += 1;
        if(!endVerts) break;
        let nextObjects = getUpdatedEndVertsObjects(endVerts, swV.value);
        while(nextObjects.length !== 0 && pIterations <= maxPIterations){
            let nextObj = nextObjects.pop();
            if(nextObj.type === 'operator'){
                nextObj.process();
                oV = nextObj.graphItem.outputVertex;
                if(oV){
                    endVerts = propagateUtilNullR(oV.value, [oV]);
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