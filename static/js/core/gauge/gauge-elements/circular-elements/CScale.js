import { CircularElement } from "/static/js/core/gauge/gauge-elements/circular-elements/CircularElement.js";
import { LengthAlignment } from "/static/js/core/geometry/alignments.js";
import { TickList } from "/static/js/core/ticks/TickList.js";
import { Point } from "/static/js/core/geometry/Point.js"

/**
 * Represents a scale element in a circular gauge.
 * 
 * The scale is drawn as a series of ticks that indicate the values at each
 * position on the arc length. Ticks are drawn in the the order of the TickList.
 */
export class CScale extends CircularElement {
    constructor(gaugeValue) {
        super("CScale");
        this.radius   = 110;
        this.alignment = LengthAlignment.LENGTH_OUTER;
        this.tickList = new TickList(gaugeValue);
    }

    clone(gaugeValue) {
        const cloned = new CScale();
        Object.assign(cloned, this);
        
        cloned.tickList = this.tickList.clone(gaugeValue);

        return cloned;
    }
    
    static image = '/static/images/pointer.png';
    static name = "Scale";
    static previewGif = '/static/images/preview-gifs/preview-scale.gif';

    /** Reconstructs a CScale object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {CScale} The deserialized CScale instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json, gaugeValue) {
        const cScale = Object.assign(new CScale(), json);
    
        cScale.tickList = TickList.fromJSON(json.tickList, gaugeValue);

        return cScale;
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
    draw(canvas, context, x, y, angleStart, angleEnd, gaugeValue) {
        this.tickList.setValue(gaugeValue.getValue());
        this.tickList.drawCircularTicks(canvas, context, new Point(x, y), this.radius, this.alignment, angleStart, angleEnd, gaugeValue.getMinimum(), gaugeValue.getMaximum());
    }

    addPanels(menu) {
        menu.addPanel("Appearance").addRow("Radius")
            .addInput("radius", this, 'radius')
            .addInput("alignment", this, 'alignment');
        this.tickList.addPanels(menu);
    }
};

CircularElement.registry.set("CScale", CScale);