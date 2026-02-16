import { GaugeValue } from "/static/js/core/values/GaugeValue.js";
import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";

import { FillStrokeTimeline, StrokeTimeline } from "/static/js/core/colors/FillStrokeTimeline.js";
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { TickList } from "/static/js/core/ticks/TickList.js";

import { GrabPoint } from "/static/js/editor/GrabPoint.js";
import { LinearElement } from "/static/js/core/gauge/gauge-elements/linear-elements/LinearElement.js";

import { Orientation, LengthAlignment, alignLength } from "/static/js/core/geometry/alignments.js";

import { LScale } from "/static/js/core/gauge/gauge-elements/linear-elements/LScale.js";
import { LSegments } from "/static/js/core/gauge/gauge-elements/linear-elements/LSegments.js";

export class LinearGauge extends GaugeElement {
    constructor() {
        super("LinearGauge");

        this.x = 120;
        this.y = 120;
        this.alignment = LengthAlignment.LENGTH_CENTER;
        this.length = 80;
        this.orientation = Orientation.HORIZONTAL;
        this.reverseDirection = false;
        this.gaugeValue = new GaugeValue();
        
        this.elements = [];
    }

    clone() {
        const cloned = Object.assign(new LinearGauge(), this);
        
        cloned.gaugeValue = this.gaugeValue.clone();
        cloned.elements = this.elements.map(el => el.clone(cloned.gaugeValue));

        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Linear Gauge";
    static previewGif = null;

    static fromJSON(json) {
        const gauge = Object.assign(new LinearGauge(), json);
    
        gauge.gaugeValue = GaugeValue.fromJSON(json.gaugeValue);

        if (Array.isArray(gauge.elements)) {
            gauge.elements = gauge.elements.map((element) => LinearElement.fromJSON(element, gauge.gaugeValue));
        }

        return gauge;
    }
    
    draw(canvas, context) {
        if (!this.visible) return;

        if (this.orientation == Orientation.HORIZONTAL) {

            const xPoints = alignLength(this.x, this.length, this.alignment);
            for (const element of this.elements) {
                if (!element.visible) continue;

                element.draw(canvas, context, this.gaugeValue, xPoints[0], this.y, this.alignment, this.length, this.orientation, this.reverseDirection);
            }
        } else { // Vertical
            const yPoints = alignLength(this.y, this.length, this.alignment);

            for (const element of this.elements) {
                if (!element.visible) continue;

                element.draw(canvas, context, this.gaugeValue, this.x, yPoints[0], this.alignment, this.length, this.orientation, this.reverseDirection);
            }
        }
    }
    
    addElement(element) { this.elements.push(element); }

    removeElement(index) { this.elements.splice(index, 1); }

    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        positionPanel.addRow("Length", "Alignment")
            .addInput("length", this, 'length')
            .addInput("alignment", this, 'alignment');

        positionPanel.addRow("Orientation").addInput("orientation", this, 'orientation')

        this.gaugeValue.addPanels(menu);
    }

    getInsertOptions() {
        const elementsToAdd = [
            { elementType: LScale,   args: [this.gaugeValue] },
            { elementType: LSegments }
        ];

        return elementsToAdd;
    }

    createGrabPoints() {
        return [
            new GrabPoint(this, "x", "y")
        ];
    }
}

GaugeElement.registry.set("LinearGauge", LinearGauge);