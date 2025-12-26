//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
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
    editorState = editorStates.objectEditor;
}

function populateReadyOperators(){
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator' && !obj.graphItem.isReady){
            if(obj.graphItem.checkProcess()){
                readyOperators.push(obj);
            }
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
            endVertices.push(lastVerts);
        }
    });
    return endVertices;
}

function unReadyOperators(){
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator'){
            obj.graphItem.isReady = false;
            obj.graphItem.inputsVertices.forEach(i =>{i.value = undefined;});
            //obj.graphItem.outputVertex.value = undefined;
        }
    });
}

function simulate(){
    unReadyOperators();
    let endVerts = propagateSwitches();
    populateReadyOperators();
    readyOperators.forEach(readyOp =>{
        if(readyOp.object.name != 'outputLed'){
            let oV = readyOp.graphItem.outputVertex;
            propagateUtilNullR(oV.value ,[oV]);
        }
    });
    //!! Move this propagate iterations clear
    console.log('Iterations: ' + propagateIterations);
    propagateIterations = 0;
    readyOperators = [];
    mainCanvas.draw();
}