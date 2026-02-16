import { GaugeValue } from "/static/js/core/values/GaugeValue.js";
import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";

import { CScale } from "/static/js/core/gauge/gauge-elements/circular-elements/CScale.js";
import { CNeedle } from "/static/js/core/gauge/gauge-elements/circular-elements/CNeedle.js";
import { CPointer } from "/static/js/core/gauge/gauge-elements/circular-elements/CPointer.js";
import { CSegments } from "/static/js/core/gauge/gauge-elements/circular-elements/CSegments.js";

import { FillStrokeTimeline, StrokeTimeline } from "/static/js/core/colors/FillStrokeTimeline.js";
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { TickList } from "/static/js/core/ticks/TickList.js";

import { GrabPoint } from "/static/js/editor/GrabPoint.js";
import { CircularElement } from "/static/js/core/gauge/gauge-elements/circular-elements/CircularElement.js";

/**
 * Represents a collection of circular elements that follow an arc length.
 * 
 * CircularElements are kept under a CircularGauge as their values have to be
 * drawn exact and truthful (i.e. a scale has to show the correct value where
 * a needle points).
 */
export class CircularGauge extends GaugeElement {
    constructor() {
        super("CircularGauge");

        this.x = 120;
        this.y = 120;
        this.startAngle = 0;
        this.endAngle = 270;
        this.gaugeValue = new GaugeValue();

        this.elements = [];
    }

    clone() {
        const cloned = Object.assign(new CircularGauge(), this);
        
        cloned.gaugeValue = this.gaugeValue.clone();
        cloned.elements = this.elements.map(el => el.clone(cloned.gaugeValue));

        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Circular Gauge";
    static description = "Container for circular based gauge elements.";
    static previewGif = "/static/images/preview-gifs/placeholder.gif";

    /** Reconstructs a CircularGauge object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {CircularGauge} The deserialized CircularGauge instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        const gauge = Object.assign(new CircularGauge(), json);
    
        gauge.gaugeValue = GaugeValue.fromJSON(json.gaugeValue);

        if (Array.isArray(gauge.elements)) {
            gauge.elements = gauge.elements.map((element) => CircularElement.fromJSON(element, gauge.gaugeValue));
        }

        return gauge;
    }
    
    /** Draws the CircularGauge on a canvas.
     * 
     * @param {HTMLCanvasElement} canvas The HTML canvas on which to draw the CircularGauge.
     * @param {CanvasRenderingContext2D} context The 2D drawing context of the canvas.
     */
    draw(canvas, context) {
        // Only draw if visible
        if (this.visible) {
            for (const element of this.elements) {
                if (element.visible) {
                    element.draw(canvas, context, this.x, this.y, this.startAngle, this.endAngle, this.gaugeValue);
                }
            }
        }
    }
    
    addElement(element) { this.elements.push(element); }

    removeElement(index) { this.elements.splice(index, 1);}

    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        positionPanel.addRow("Angle")
            .addInput("angle", this, 'startAngle')
            .addInput("angle", this, 'endAngle')
            .addIcon(() => {
                console.log("Attemping a swap:");
                const temp = this.startAngle;
                this.startAngle = this.endAngle;
                this.endAngle = temp;

                positionPanel.render();
            }, '/static/images/loop_pingpong.png');

        this.gaugeValue.addPanels(menu);
    }

    getInsertOptions() {
        return [
            { elementType: CNeedle   },
            { elementType: CPointer  },
            { elementType: CScale,   args: [this.gaugeValue] },
            { elementType: CSegments }
        ];
    }

    createGrabPoints() {
        return [
            new GrabPoint(this, "x", "y")
        ];
        
    }
}

GaugeElement.registry.set("CircularGauge", CircularGauge);