const infoBox = document.getElementById('info-box');
let isDragging = false;
let initialX;
let initialY;

infoBox.addEventListener('mousedown', startDragging);
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-draggable', 'true');

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

function getTranslate (el) {
  const transform = window.getComputedStyle(el).transform
  if (transform === 'none') return { x: 0, y: 0 }
  const match = transform.match(/matrix(3d)?\(([^)]+)\)/)
  if (!match) return { x: 0, y: 0 }
  const parts = match[2].split(', ').map(Number)
  return match[1] ? { x: parts[12], y: parts[13] } : { x: parts[4], y: parts[5] }
}

function startDragging (e) {
  e.stopPropagation() // Prevent event from reaching p5js

  // Baseline off the box's actual current position (whether it got there via
  // the CSS centering transform or a prior drag), not an assumed 0,0.
  const { x, y } = getTranslate(infoBox)
  initialX = e.clientX - x
  initialY = e.clientY - y

  if (e.target === infoBox) {
    isDragging = true
  }
}

function drag (e) {
  if (isDragging) {
    e.preventDefault()
    e.stopPropagation() // Prevent event from reaching p5js

    const currentX = e.clientX - initialX
    const currentY = e.clientY - initialY

    setTranslate(currentX, currentY, infoBox)
  }
}

function stopDragging() {
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}
