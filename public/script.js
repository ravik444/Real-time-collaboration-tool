const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const socket = io();

canvas.width = window.innerWidth - 40;
canvas.height = window.innerHeight - 150;

let drawing = false;
let isEraser = false;
let undoStack = [];
let redoStack = [];

const colorPicker = document.getElementById("colorPicker");
const thicknessSlider = document.getElementById("thicknessSlider");

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseout', stopDraw);
canvas.addEventListener('mousemove', draw);

function startDraw() {
    drawing = true;
    saveState();  // Save for undo
}

function stopDraw() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;

    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;
    const color = isEraser ? '#FFFFFF' : colorPicker.value;
    const thickness = thicknessSlider.value;

    drawDot(x, y, color, thickness);
    socket.emit('drawing', { x, y, color, thickness });
}

function drawDot(x, y, color, thickness) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, thickness, 0, Math.PI * 2);
    ctx.fill();
}

socket.on('drawing', ({ x, y, color, thickness }) => {
    drawDot(x, y, color, thickness);
});

// Eraser
function toggleEraser() {
    isEraser = !isEraser;

    if (isEraser) {
        colorPicker.disabled = true;
        canvas.classList.add('eraser-cursor');
    } else {
        colorPicker.disabled = false;
        canvas.classList.remove('eraser-cursor');
    }
}


// Clear Canvas
function clearCanvas() {
    saveState(); // Save before clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
    redoStack = [];
}
socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Undo/Redo
function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 50) undoStack.shift(); // Limit history
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(canvas.toDataURL());
    const prevState = undoStack.pop();
    restoreState(prevState);
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(canvas.toDataURL());
    const nextState = redoStack.pop();
    restoreState(nextState);
}

function restoreState(imageDataUrl) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageDataUrl;
}

// Save as Image
function saveCanvas() {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
}

