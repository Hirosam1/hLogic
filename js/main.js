mainCanvas = new UIEditor();
mainCanvas.preloadPalletMenu();
mainCanvas.setUpCanvasControls();
mainCanvas.initCanvas();

//Sinuation logic
let isSimulating = false;
document.getElementById('startSimulation')
.addEventListener('click', () => {
    isSimulating = !isSimulating;
    const simTxt = isSimulating ? 'Stop Simulation ⏹️' : 'Start Simulation ▶️';
    document.getElementById('startSimulation').innerHTML=simTxt;
    if(isSimulating){
        clearVertices();
        mainCanvas._canvasLineSegments.forEach(lineSeg => { 
            lineSeg.checkVertices();
        });
        console.log("vertices: "  + verticesPosList.length + " matches: " + __verticesMatch);
    }else{

    }
}); 