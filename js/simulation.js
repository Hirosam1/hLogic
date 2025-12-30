//===  Sinuation logic ====
const startSimulation = document.getElementById('startSimulation');
const maxPIterations = 20;
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

//Perform graph traversal (BFS) to find inputs,
//once a function has enough inputs, it performs another traversal,
//until there are no vertices to visit.
function simulate(){
    unReadyOperators();
    //First big iteration
    let endVerts = propagateSwitches();
    let pIterations = 1;
    let done = false;
    while(!done && pIterations <= maxPIterations){
        //Second big iteration and others
        populateReadyOperators();
        readyOperators.forEach(readyOp =>{
            let oV = readyOp.graphItem.outputVertex;
            if(oV) propagateUtilNullR(oV.value ,[oV]);
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