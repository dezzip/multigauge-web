import { LinearElement } from "/static/js/core/gauge/gauge-elements/linear-elements/LinearElement.js";
import { Orientation, LengthAlignment } from "/static/js/core/geometry/alignments.js";
import { TickList } from "/static/js/core/ticks/TickList.js";
import { Point } from "/static/js/core/geometry/Point.js"

/**
 * Represents a scale element in a circular gauge.
 * 
 * The scale is drawn as a series of ticks that indicate the values at each
 * position on the arc length. Ticks are drawn in the the order of the TickList.
 */
export class LScale extends LinearElement {
    constructor(gaugeValue) {
        super("LScale");
        this.position  = 0;
        this.alignment = LengthAlignment.LENGTH_CENTER;
        this.tickList = new TickList(gaugeValue);
    }

    clone(gaugeValue) {
        const cloned = Object.assign(new LScale(), this);
        
        cloned.tickList = this.tickList.clone(gaugeValue);

        return cloned;
    }

    static image = '/static/images/pointer.png';
    static name = "Scale";
    static previewGif = null;

    static fromJSON(json, gaugeValue) {
        const lScale = Object.assign(new LScale(), json);
    
        lScale.tickList = TickList.fromJSON(json.tickList, gaugeValue);

        return lScale;
    }

    /** Draws the CScale on a canvas.
     * 
     * @param {*} canvas The HTML canvas on which to draw the CScale.
     * @param {*} context The 2D drawing context of the canvas.
     * @param {*} x The center X coordinate of the arc.
     * @param {*} y The center Y coordinate of the arc.
     * @param {*} angleStart The starting angle of the arc in degrees.
     * @param {*} angleEnd The ending angle of the arc in degrees.
     * @param {*} gaugeValue The value of to be displayed.
     */
    draw(canvas, context, gaugeValue, x, y, alignment, length, orientation, reverseDirection) {
        this.tickList.setValue(gaugeValue.getValue());

        /*
        const lengthComponent = (orientation === Orientation.HORIZONTAL) ? x : y;
        const thicknessComponent = (orientation === Orientation.HORIZONTAL) ? y : x;
        */

        this.tickList.drawLinearTicks(canvas, context, new Point(x, y), this.alignment, length, orientation, reverseDirection, gaugeValue.getMinimum(), gaugeValue.getMaximum());
    }

    addPanels(menu) {
        menu.addPanel("Appearance")
        .addRow("Posiion").addInput("radius", this, 'position')
        .addInput("alignment", this, 'alignment');

        this.tickList.addPanels(menu);
    }
};

LinearElement.registry.set("LScale", LScale);