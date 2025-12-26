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
        if(obj.type == 'operator' && !obj.graphItem.isReady && obj.object.name != 'outputLed'){
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
    readyOperators = [];
    mainCanvas._canvasObjects.forEach(obj =>{
        if(obj.type == 'operator'){
            obj.graphItem.isReady = false;
            obj.graphItem.inputsVertices.forEach(i =>{i.value = undefined;});
            //obj.graphItem.outputVertex.value = undefined;
        }
    });
}

function simulate(){
    //First big iteration
    unReadyOperators();
    let endVerts = propagateSwitches();
    //Second big iteration and others
    const maxBigIts = 10;
    let bigIts = 1;
    let done = false;
    while(!done && bigIts <= maxBigIts){
        populateReadyOperators();
        readyOperators.forEach(readyOp =>{
            let oV = readyOp.graphItem.outputVertex;
            propagateUtilNullR(oV.value ,[oV]);
        });
        if(readyOperators.length == 0){done = true;}
        readyOperators = [];
        bigIts++;
    }

    console.log('Big iterations: ' + bigIts + ' Total iterations: ' + propagateIterations + ' done: ' + done);
    propagateIterations = 0;
    bigIts = 0;
    mainCanvas.draw();
}