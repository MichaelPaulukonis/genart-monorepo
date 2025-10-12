const infoBox = document.getElementById('info-box');
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

infoBox.addEventListener('mousedown', startDragging);
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-draggable', 'true');

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

function startDragging(e) {
  e.stopPropagation(); // Prevent event from reaching p5js
  
  initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === infoBox) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from reaching p5js
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, infoBox);
    }
}

function stopDragging() {
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}
