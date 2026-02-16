import { availableValues, runSimulation } from "/static/js/core/values/Value.js";

import { GrabPoint } from "/static/js/editor/GrabPoint.js"

import { makeActionMenu } from "/static/js/dropdown.js";

import { exportCanvas } from "/static/js/utils.js";

import { displayInsertElementToolbar } from "/static/js/editor/toolbar.js";
import { displayElementsPanel, selectElement, deselectElement } from "/static/js/editor/elements.js";
import { updateCanvas, setGaugeFace, getGaugeFace, exportGaugeFace, loadGaugeFace } from "/static/js/editor/gauge.js";
import { openDropdown } from "/static/js/dropdown.js";
import { renderGraphs, updateUsed } from "/static/js/editor/valueDisplay.js";


import undoStack from "/static/js/editor/UndoStack.js";

document.addEventListener("DOMContentLoaded", function() {
    const actionMenu = document.getElementById('actionMenu');
    const actions = makeActionMenu(
        [
            { name: "Back to Home", onSelect: () => {
                window.location.href = "/"; // Redirect to home page
            }},
            { /* Divider */ },
            { 
                name: "File", options: [
                    { name: "New", context: "Ctrl+N", onSelect: () => {
                        deselectElement();
                        setGaugeFace();
                        displayElementsPanel();
                    }},
                    { 
                        name: "New from template", options: [
                            { name: "Empty", onSelect: () => {
                                deselectElement();
                                setGaugeFace();
                                displayElementsPanel();
                            }},
                            { name: "Tachometer", onSelect: () => {
                                window.alert("Tachometer template not implemented yet.");
                            }}
                        ]
                    },
                    { name: "Open", context: "Ctrl+O", onSelect: () => {
                        loadGaugeFace();
                    }},
                    { /* Divider */ },
                    { name: "Save", context: "Ctrl+S", onSelect: () => {
                        exportGaugeFace();
                    }},
                    { /* Divider */ },
                    { name: "Export", context: "Ctrl+E", onSelect: () => {
                        exportGaugeFace();
                    }},
                    { name: "Export as PNG", context: "Ctrl+Shift+E", onSelect: () => {
                        exportCanvas(canvas);
                    }}
                ]
            },
            { 
                name: "Edit", options: [
                    { name: "Undo", context: "Ctrl+Z", onSelect: () => {
                        undoStack.undo();
                    }},
                    { name: "Redo", context: "Ctrl+Y", onSelect: () => {
                        console.log("Redo functionality not implemented yet.");
                    }},
                    { /* Divider */ },
                    { name: "Back", context: "Ctrl+[", onSelect: () => {
                        console.log("Back functionality not implemented yet.");
                    }},
                    { name: "Front", context: "Ctrl+]", onSelect: () => {
                        console.log("Front functionality not implemented yet.");
                    }},
                    { /* Divider */ },
                    { name: "Cut", context: "Ctrl+X", onSelect: () => {
                        console.log("Cut functionality not implemented yet.");
                    }},
                    { name: "Copy", context: "Ctrl+C", onSelect: () => {
                        console.log("Copy functionality not implemented yet.");
                    }},
                    { name: "Paste", context: "Ctrl+V", onSelect: () => {
                        console.log("Paste functionality not implemented yet.");
                    }},
                    { name: "Duplicate", context: "Ctrl+D", onSelect: () => {
                        console.log("Duplicate functionality not implemented yet.");
                    }},
                    { name: "Delete", context: "Del", onSelect: () => {
                        console.log("Delete functionality not implemented yet.");
                    }}
                ]
            },
            { 
                name: "View",  options: [
                    { name: "Grid", onSelect: () => {

                    }},
                    { name: "Grab Points", onSelect: () => {
                        
                    }},
                    {
                        name: "Appearance", options: [
                            { name: "FullScreen", context: "F11", onSelect: () => {
                                const elem = document.documentElement; // or use a specific element
                                if (!document.fullscreenElement) {
                                    elem.requestFullscreen().catch(err => {
                                        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
                                    });
                                } else {
                                    document.exitFullscreen();
                                }
                            }},
                            { name: "Day Mode", onSelect: () => {

                            }},
                            { name: "Night Mode", onSelect: () => {

                            }},
                        ]
                    }
                ]
            },
            { 
                name: "Insert", 
                options: [
                    { 
                        name: "Circular", options: [
                            { name: "Needle", onSelect: () => {}},
                            { name: "Pointer", onSelect: () => {}},
                            { name: "Scale", onSelect: () => {}},
                            { name: "Segments", onSelect: () => {}}
                        ]
                    },
                    {
                        name: "Linear", options: [
                            { name: "Needle", onSelect: () => {}},
                            { name: "Pointer", onSelect: () => {}},
                            { name: "Scale", onSelect: () => {}},
                            { name: "Segments", onSelect: () => {}}
                        ]
                    },
                    { name: "Graph", onSelect: () => {}

                    },
                    { name: "Roll Odometer", onSelect: () => {}

                    }
                ]
            },
        ]
    );

    actionMenu.appendChild(actions);

    const undoButton = document.getElementById("undoButton");
    undoButton.addEventListener("click", () => { undoStack.undo(); });
    undoButton.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        
        const x = event.clientX; // X position within the viewport
        const y = event.clientY; // Y position within the viewport

        const options = undoStack.getUndoOptions();
        
        openDropdown(options, x, y);

        event.stopPropagation(); // Prevent the click from propagating to the parent element
    });

    const redoButton = document.getElementById("redoButton");
    redoButton.addEventListener("click", () => { undoStack.redo(); });

    const gridButton = document.getElementById("gridButton");

    const snapButton = document.getElementById("snapButton");
    const snapImage = snapButton.querySelector("img");

    gridButton.classList.toggle("hidden-button", !GrabPoint.snapSettings.enabled);

    snapButton.addEventListener("click", () => {
        GrabPoint.snapSettings.enabled = !GrabPoint.snapSettings.enabled;

        snapImage.src = GrabPoint.snapSettings.enabled ? "/static/images/snap_on.png" : "/static/images/snap_off.png";
        snapButton.title = GrabPoint.snapSettings.enabled ? "Snap On" : "Snap Off";

        gridButton.classList.toggle("hidden-button", !GrabPoint.snapSettings.enabled);
    });

    let animationFrameId = null;

    function startUpdate() {
        runSimulation();
        updateCanvas();
        updateUsed();
        
        animationFrameId = requestAnimationFrame(startUpdate);
        return animationFrameId;
    }

    function initEditor() {
        setGaugeFace();
        displayElementsPanel();
        animationFrameId = startUpdate();
        renderGraphs();
    }

    function stopUpdate() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    window.addEventListener('beforeunload', () => {
        stopUpdate();

        const canvas = document.getElementById('gaugeCanvas');
        if (canvas) {

            const ctx = canvas.getContext('2d');
            ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            canvas.remove();
        }
    });

    initEditor();
});
