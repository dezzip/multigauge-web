import { Value } from "/static/js/core/values/Value.js"
import { getGaugeFace } from "/static/js/editor/gauge.js";
import { findNestedInstancesOfType } from "/static/js/utils.js";

let usedValues = findNestedInstancesOfType(getGaugeFace(), Value);

class ValueDisplay {
    constructor(value) {
        this.value = value;

        this.node = document.createElement('div');
        this.node.className = "value-display";

        this.animationFrameId = null;
    }

    render() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.node.innerHTML = '';

        const labelContainer = document.createElement('div');
        labelContainer.className = "value-label-container";
        this.node.appendChild(labelContainer);
        
        const label = document.createElement('h');
        label.className = "value-label";
        label.textContent = this.value.name;
        labelContainer.appendChild(label);

        const value = document.createElement('h');
        value.className = "value-label-value";
        value.textContent = this.value.getValueString();
        labelContainer.appendChild(value);



        const graph = document.createElement('div');
        graph.className = "value-display-graph";
        this.node.appendChild(graph);

        const ascii = document.createElement('pre');
        ascii.className = "value-display-graph-ascii";
        graph.appendChild(ascii);

        /*
        const editButton = document.createElement('div');
        editButton.className = "value-display-edit";
        this.node.appendChild(editButton);

        const editIcon = document.createElement('img');
        editIcon.src = "/static/images/add.png";
        editButton.appendChild(editIcon);
        */

        const updateGraph = () => {
            const charWidth = measureCharWidth(getComputedStyle(ascii).fontFamily);
            const containerWidth = graph.clientWidth;
            const length = Math.floor(containerWidth / charWidth);

            ascii.textContent = valueToAscii(this.value, length + 1);
            value.textContent = this.value.getValueString(undefined, true);
            this.animationFrameId = requestAnimationFrame(updateGraph);
        }

        updateGraph();

        return this.node;
    }
}

let valueDisplays = [];

function setsAreEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
}

export function updateUsed() {
    const newUsedValues = findNestedInstancesOfType(getGaugeFace(), Value);
    if (!setsAreEqual(usedValues, newUsedValues)) {
        usedValues = newUsedValues;

        valueDisplays = [];
        newUsedValues.forEach((value) => {
            valueDisplays.push(new ValueDisplay(value));
        });

        renderGraphs();
    }

}

export function renderGraphs() {
    const valueDisplayList = document.getElementById("valueDisplayList");

    valueDisplayList.innerHTML = '';

    for (const valueDisplay of valueDisplays) {
        valueDisplayList.appendChild(valueDisplay.render());
    }
}

function valueToBlock(value) {
    const blockGradient = [' ', '.', '-', '+', '#', '@'];
    const clamped = Math.max(0, Math.min(1, value));
    const index = Math.floor(clamped * (blockGradient.length - 1));
    return blockGradient[index];
}

function measureCharWidth(font = "monospace") {
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.fontFamily = font;
    span.textContent = 'M'; // Wide monospace char
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return width;
}

function valueToAscii(value, length) {
    const values = [];
    const now = Date.now();

    // Sample historical values across the time range
    for (let i = 0; i < length; i++) {
        const time = now - ((i * 5000) / length); // last 5s distributed
        values.push(value.getInterpolatedHistoryAt(time));
    }

    const levels = 3; // height of the graph
    const rows = Array.from({ length: levels }, () => []);

    for (let row = 0; row < levels; row++) {
        const top = (row + 1) / levels;
        const bottom = row / levels;

        for (let i = 0; i < values.length; i++) {
            let v = values[values.length - 1 - i];

            let interp = (v - bottom) / (top - bottom);
            interp = Math.max(0, Math.min(1, interp));

            const char = v >= bottom ? valueToBlock(interp) : ' ';
            rows[levels - 1 - row].push(char);
        }
    }

    return rows.map(row => row.join('')).join('\n');
}
