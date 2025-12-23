const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');
const widthSlider = document.getElementById('widthSlider');
const heightSlider = document.getElementById('heightSlider');
const resetView = document.getElementById('resetView');
const zoomLevel = document.getElementById('zoomLevel');
const clearCanvas = document.getElementById('clearCanvas');

function drawLine(startPosVec, endPosVec, lineWidth = 3, strokeStyle='#100ae5'){
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth / zoom;

        ctx.beginPath();
        ctx.moveTo(startPosVec.x, startPosVec.y);
        ctx.lineTo(endPosVec.x, endPosVec.y);
        ctx.stroke();
}

function drawPoint(posVec, radius=4, fillStyle='#e60a41'){
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    // Parameters: centerX, centerY, radius, startAngle (radians), endAngle (radians), counterclockwise (boolean)
    ctx.arc(posVec.x, posVec.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}