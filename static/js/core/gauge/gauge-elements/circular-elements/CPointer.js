import { CircularElement } from "/static/js/core/gauge/gauge-elements/circular-elements/CircularElement.js";
import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { drawCircle, drawWideLine } from "/static/js/draw.js";
import { map } from "/static/js/utils.js";

/**
 * Represents a pointer element in a circular gauge.
 * 
 * The pointer is drawn as a circular pinion with a pointer that indicates
 * the value respective to the arc length.
 */
export class CPointer extends CircularElement {
    constructor() {
        super("CPointer");
        this.pointerFrontRadius = 100;
        this.pointerBackRadius = -25;
        this.pointerThickness = 20;
        this.pinionRadius = 10;
        this.pointerColor = new FillStroke();
        this.pinionColor  = new FillStroke();
    }

    clone() {
        const cloned = new CPointer();
        Object.assign(cloned, this);
        
        cloned.pointerColor = this.pointerColor.clone();
        cloned.pinionColor = this.pinionColor.clone();

        return cloned;
    }

    static image = '/static/images/pointer.png';
    static name = "Pointer";
    static previewGif = '/static/images/preview-gifs/preview-pointer.gif';

    /** Reconstructs a CPointer object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {CPointer} The deserialized CPointer instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        const cPointer = Object.assign(new CPointer(), json);
    
        // Deserialize pointer color
        if (json.pointerColor) {
            cPointer.pointerColor = FillStroke.fromJSON(json.pointerColor);
        }

        // Deserialize pointer color
        if (json.pinionColor) {
            cPointer.pinionColor = FillStroke.fromJSON(json.pinionColor);
        }

        return cPointer;
    }

    /** Draws the CPointer on a canvas.
     * 
     * @param {*} canvas The HTML canvas on which to draw the CPointer.
     * @param {*} context The 2D drawing context of the canvas.
     * @param {*} x The center X coordinate of the arc.
     * @param {*} y The center Y coordinate of the arc.
     * @param {*} angleStart The starting angle of the arc in degrees.
     * @param {*} angleEnd The ending angle of the arc in degrees.
     * @param {*} gaugeValue The value of to be displayed.
     */
    draw(canvas, context, x, y, angleStart, angleEnd, gaugeValue) {
        let needleAngle = (map(gaugeValue.getValueRaw(), gaugeValue.getMinimumRaw(), gaugeValue.getMaximumRaw(), angleStart, angleEnd) % 360) * (Math.PI / 180);

        drawCircle(canvas, context, x, y, this.pinionRadius, this.pinionColor);
        drawWideLine(canvas, context, x + Math.cos(needleAngle) * this.pointerFrontRadius, y + Math.sin(needleAngle) * this.pointerFrontRadius, x + Math.cos(needleAngle) * this.pointerBackRadius, y + Math.sin(needleAngle) * this.pointerBackRadius, this.pointerThickness / 2, this.pointerColor)
    }

    addPanels(menu) {
        const appearancePanel = menu.addPanel("Appearance");

        appearancePanel.addRow("Pointer Lengths").addInput("length", this, 'pointerFrontRadius').addInput("length", this, 'pointerBackRadius');
        appearancePanel.addRow("Pointer Thickness").addInput("length", this, 'pointerThickness')
        appearancePanel.addRow("Pinion Radius").addInput("radius", this, 'pinionRadius');

        this.pinionColor.addPanels(menu, "Pinion");
        this.pointerColor.addPanels(menu, "Pointer");
    }
};

CircularElement.registry.set("CPointer", CPointer);