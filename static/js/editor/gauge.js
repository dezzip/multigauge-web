import { GaugeFace } from "/static/js/core/gauge/gaugeFace.js"
import { displayElementsPanel, deselectElement, draggingList, draggingIndex } from "/static/js/editor/elements.js";
import { GrabPoint } from "/static/js/editor/GrabPoint.js";

let currentGaugeFace = null;

export function setGaugeFace(newGaugeFace = new GaugeFace()) { currentGaugeFace = newGaugeFace; }
export function getGaugeFace() { return currentGaugeFace; }

let grabPoints = null;

export function setGrabPoints(newGrabPoints = null) { grabPoints = newGrabPoints; }
export function getGrabPoints() { return grabPoints; }

let isHovering = false; // Whether the mouse is inside the canvas or not

const gaugeFace = document.getElementById('gaugeFace');
const gaugeCanvas = document.getElementById('gaugeCanvas');

const zoomSpan = document.getElementById('zoomSpan');

// Update the canvas with the current gauge face and elements
export function updateCanvas() {
    const context = gaugeCanvas.getContext('2d');

    currentGaugeFace.update();
    currentGaugeFace.draw(gaugeCanvas, context);

    const grabPoints = getGrabPoints();

    // Draw grab points if hovering over canvas
    if (isHovering && grabPoints) {
        grabPoints.forEach(grabPoint => {
            grabPoint.draw(gaugeCanvas, context);
        });

        // Draw grid lines
        if (GrabPoint.snapSettings.enabled && grabPoints.find(grabPoint => grabPoint.dragging)) {
            context.globalCompositeOperation = "difference";
            context.strokeStyle = "rgba(255, 255, 255, 0.2)";
            context.lineWidth = 0.5;
        
            // Horizontal grid lines
            for (let y = 0; y < currentGaugeFace.resolution_y; y += GrabPoint.snapSettings.size) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(currentGaugeFace.resolution_x, y);
                context.stroke();
            }
        
            // Vertical grid lines
            for (let x = 0; x < currentGaugeFace.resolution_x; x += GrabPoint.snapSettings.size) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, currentGaugeFace.resolution_y);
                context.stroke();
            }
        
            context.globalCompositeOperation = "normal";
        }
    }
}

// Returns an X and Y scale factor based on the canvas size and the gauge face resolution
function getScaleFactor(gaugeCanvas) {
    const scaleX = gaugeCanvas.width / currentGaugeFace.resolution_x;
    const scaleY = gaugeCanvas.height / currentGaugeFace.resolution_y;
    return { scaleX, scaleY };
}

let currentScale = 1; // initial scale from your CSS
const scaleStep = 0.25;

function updateScale() {
  gaugeCanvas.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
  updateCanvasResolution();
}

function zoom(amount) {
    const newScale = currentScale + amount;
    currentScale = Math.max(0.5, Math.min(4, Math.round(newScale * 100) / 100));
    zoomSpan.textContent = `Zoom: ${currentScale.toFixed(2)}`;
    updateScale();
}

function setGaugeAspectRatio(ratio, circular = false) {
    gaugeCanvas.style.aspectRatio = ratio;
    if (circular) {
        gaugeCanvas.style.borderRadius = "100%";
    } else {
        gaugeCanvas.style.borderRadius = "10px";
    }
}

function updateCanvasResolution() {
    const rect = gaugeCanvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    if (gaugeCanvas.width !== width || gaugeCanvas.height !== height) {
        gaugeCanvas.width = width;
        gaugeCanvas.height = height;
    }
}

export function exportGaugeFace() {
    const json = JSON.stringify(currentGaugeFace);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'face.gauge';
    a.click();
}

export function loadGaugeFace() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gauge';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result);
                currentGaugeFace = GaugeFace.fromJSON(json);
                deselectElement();
                displayElementsPanel();
            } catch (e) {
                console.error("Failed to load gauge face JSON:", e);
                alert("Invalid JSON file.");
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Initialize position to center in pixels relative to parent
let position = { x: 0, y: 0 };

function updatePosition() {
  gaugeCanvas.style.left = `${position.x}px`;
  gaugeCanvas.style.top = `${position.y}px`;
  gaugeCanvas.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
}

function setHomeZoomPan() {
    currentScale = 1;
    const rect = gaugeFace.getBoundingClientRect();
    position = { x: rect.width / 2, y: rect.height / 2 };
    updatePosition()
}

window.addEventListener('mouseup', (e) => {
  if (e.button === 1) {
    gaugeFace.style.cursor = 'default';
    isDragging = false;
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  // Calculate movement delta
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  // Update position with delta
  position.x = dragStart.posX + dx;
  position.y = dragStart.posY + dy;

  updatePosition();
});

const scrollZoomStep = 0.05

document.addEventListener('DOMContentLoaded', () => {
    setGaugeAspectRatio(1, true);
    updateCanvasResolution();

    gaugeCanvas.addEventListener("mouseenter", () => {
        isHovering = true;  // Mouse is inside the canvas
    });

    gaugeCanvas.addEventListener("mouseleave", () => {
        const grabPoints = getGrabPoints();

        isHovering = false;  // Mouse leaves the canvas

        // Check grab points exist and an element is selected
        if (grabPoints) {
            // Find the grabbed point
            const grabbedPoint = grabPoints.find(grabPoint => grabPoint.dragging);

            // Un-grab the grabbed point
            if (grabbedPoint) {
                grabbedPoint.dragging = false;
            }
        }
    });

    gaugeCanvas.addEventListener("mousedown", (event) => {
        const grabPoints = getGrabPoints();

        // Check grab points exist and an element is selected
        if (grabPoints) {
            const { scaleX, scaleY } = getScaleFactor(gaugeCanvas);

            // Adjust mouse position based on scale
            const mouseX = event.offsetX / scaleX;
            const mouseY = event.offsetY / scaleY;

            // Find the point that is trying to be grabbed
            const grabbedPoint = grabPoints.find(grabPoint => grabPoint.hovering(mouseX, mouseY));

            // Grab the point
            if (grabbedPoint) {
                grabbedPoint.dragging = true;
            }
        }
    });

    gaugeCanvas.addEventListener("mousemove", (event) => {
        const grabPoints = getGrabPoints();

        if (grabPoints) {
            const { scaleX, scaleY } = getScaleFactor(gaugeCanvas);

            // Adjust mouse position based on scale
            let mouseX = event.offsetX / scaleX;
            let mouseY = event.offsetY / scaleY;

            // Find the grabbed point
            const grabbedPoint = grabPoints.find(grabPoint => grabPoint.dragging);

            // move the grabbed point
            if (grabbedPoint) {
                grabbedPoint.setPosition(mouseX, mouseY);
            }
        }
    });

    gaugeCanvas.addEventListener("mouseup", () => {
        const grabPoints = getGrabPoints();

        // Check grab points exist and an element is selected
        if (grabPoints) {
            // Find the grabbed point
            const grabbedPoint = grabPoints.find(grabPoint => grabPoint.dragging);

            // Un-grab the grabbed point
            if (grabbedPoint) {
                grabbedPoint.dragging = false;
            }
        }
    });

    const gaugePanel = document.getElementById('gaugeFace');

    gaugePanel.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    gaugePanel.addEventListener('drop', (event) => {
        event.preventDefault();

        deselectElement(draggingList[draggingIndex]);

        draggingList.splice(draggingIndex, 1);
        displayElementsPanel();
    });

    gaugeFace.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            gaugeFace.style.cursor = 'grabbing';
            isDragging = true;
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            // Capture current position
            dragStart.posX = position.x;
            dragStart.posY = position.y;
        }
    });

    gaugeFace.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault(); // prevent browser zoom

        if (e.deltaY < 0) {
        zoom(scrollZoomStep);
        } else {
            zoom(-scrollZoomStep);
        }

        console.log(`Scale: ${currentScale}`);
        updateScale();
    }
    }, { passive: false });

    setHomeZoomPan();

    document.getElementById('zoomIn').addEventListener('click', () => { zoom(scaleStep); });
    document.getElementById('zoomOut').addEventListener('click', () => { zoom(-scaleStep); });
    document.getElementById('zoomHome').addEventListener('click', () => { setHomeZoomPan(); });
});