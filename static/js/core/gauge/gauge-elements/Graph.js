import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";
import { GaugeValue } from "/static/js/core/values/GaugeValue.js";
import { map } from "/static/js/utils.js";

import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { BoxAlignment } from "/static/js/core/geometry/alignments.js";
import { fillStrokeRectangleBoxAligned } from "/static/js/draw.js";

class TimeValue {
    constructor(value, time) {
        this.value = value;
        this.time = time;
    }
}

export class Graph extends GaugeElement {

    constructor() {
        super("Graph");
        this.x = 120;
        this.y = 120;
        this.width = 80;
        this.height = 80;

        this.alignment = BoxAlignment.TOP_LEFT;

        this.secondsDisplayed = 2;
        this.bufferMilliseconds = 0;

        this.backgroundColor = new FillStroke();

        this.gaugeValue = new GaugeValue();
        this.valueMemory = [new TimeValue(this.gaugeValue.getValue(), performance.now())]; // Replace with Date.now() if needed
    }

    clone() {
        const cloned = new Graph();
        Object.assign(cloned, this);
        
        cloned.gaugeValue = this.gaugeValue.clone();
        cloned.valueMemory = [];

        return cloned;
    }
    
    static image = '/static/images/circular.png';
    static name = "Graph";
    static description = "Displays a graph of recent values.";
    static previewGif = null;

    static fromJSON(json) {
        const graph = Object.assign(new Graph(), json);
    
        graph.backgroundColor = FillStroke.fromJSON(json.backgroundColor);
        graph.gaugeValue = GaugeValue.fromJSON(json.gaugeValue);

        return graph;
    }

    draw(canvas, ctx) {
        fillStrokeRectangleBoxAligned(canvas, ctx, this.x, this.y, this.width, this.height, 0, this.alignment, this.backgroundColor);

        const currentTime = performance.now();
        const valueMemorySize = this.valueMemory.length;
        const secondLength = this.width / this.secondsDisplayed;
        const lineX = this.x + this.width - 1;

        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
        ctx.font = "12px sans-serif";

        const minimum = this.gaugeValue.getMinimum();
        const maximum = this.gaugeValue.getMaximum();

        for (let i = 0; i < valueMemorySize; i++) {
            const current = this.valueMemory[i];
            const currentY = map(current.value, minimum, maximum, this.y + this.height - 1, this.y);
            const currentX = this.x + ((currentTime - current.time) / 1000) * secondLength - (this.bufferMilliseconds / 1000) * secondLength;

            if (i !== valueMemorySize - 1) {
                const prev = this.valueMemory[i + 1];
                const previousY = map(prev.value, minimum, maximum, this.y + this.height - 1, this.y);
                const previousX = this.x + ((currentTime - prev.time) / 1000) * secondLength - (this.bufferMilliseconds / 1000) * secondLength;

                const leftClip = currentX < this.x && previousX > this.x;
                const rightClip = currentX < lineX && previousX > lineX;

                if (currentX >= this.x && previousX <= lineX) {
                    ctx.beginPath();
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(previousX, previousY);
                    ctx.stroke();
                } else if (leftClip && rightClip) {
                    const slope = (currentY - previousY) / (currentX - previousX);
                    const intersectYLeft = previousY + slope * (this.x - previousX);
                    const intersectYRight = previousY + slope * (lineX - previousX);

                    ctx.beginPath();
                    ctx.moveTo(this.x, intersectYLeft);
                    ctx.lineTo(lineX, intersectYRight);
                    ctx.stroke();
                } else if (leftClip) {
                    const slope = (currentY - previousY) / (currentX - previousX);
                    const intersectY = previousY + slope * (this.x - previousX);

                    ctx.beginPath();
                    ctx.moveTo(this.x, intersectY);
                    ctx.lineTo(previousX, previousY);
                    ctx.stroke();
                } else if (rightClip) {
                    const slope = (currentY - previousY) / (currentX - previousX);
                    const intersectY = previousY + slope * (lineX - previousX);

                    ctx.beginPath();
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(lineX, intersectY);
                    ctx.stroke();
                }
            }

            if (i === 0 && currentX > this.x) {
                ctx.beginPath();
                if (currentX > lineX) {
                    ctx.moveTo(this.x, currentY);
                    ctx.lineTo(lineX, currentY);
                } else {
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(this.x, currentY);
                }
                ctx.stroke();
            }
        }

        // Seconds tick marks
        for (let i = 0; i < this.secondsDisplayed; i++) {
            const offset = ((currentTime % 1000) / 1000.0) * secondLength;
            const tickX = this.x + offset + (i * secondLength);
            ctx.beginPath();
            ctx.moveTo(tickX, this.y + this.height);
            ctx.lineTo(tickX, this.y + this.height + 3);
            ctx.stroke();
        }

        ctx.fillText(this.gaugeValue.getValueString(true), this.x, this.y - 2);
    }

    update() {
        const currentTime = performance.now();
        this.valueMemory.unshift(new TimeValue(this.gaugeValue.getValue(), currentTime));

        const maxAge = this.secondsDisplayed * 1000 + this.bufferMilliseconds;
        const idx = this.valueMemory.findIndex(tv => (currentTime - tv.time) > maxAge);

        if (idx !== -1 && idx + 1 < this.valueMemory.length) {
            this.valueMemory = this.valueMemory.slice(0, idx + 1);
        }
    }

    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        positionPanel.addRow("Width", "Height")
            .addInput("length", this, 'width')
            .addInput("length", this, 'height');

        const colorsPanel = menu.addPanel("Colors");
        colorsPanel.addRow("Background").addObjectProperty(this, 'backgroundColor');
    }
}

GaugeElement.registry.set("Graph", Graph);