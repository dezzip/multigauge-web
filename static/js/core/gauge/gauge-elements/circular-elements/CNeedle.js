import { CircularElement } from "/static/js/core/gauge/gauge-elements/circular-elements/CircularElement.js";
import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { drawCircle } from "/static/js/draw.js";

import { map } from "/static/js/utils.js";

import menuStack from "/static/js/editor/MenuStack.js";

/**
 * Represents a needle element in a circular gauge.
 * 
 * The needle is drawn as a diamond shaped pinion with a pointer that indicates
 * the value respective to the arc length.
 */
export class CNeedle extends CircularElement {
    constructor() {
        super("CNeedle");
        this.pinionRadius = 15;
        this.pointerRadius = 80;
        this.pointerThickness = 1;
        this.spacing = 8;
        this.pointerColor = new FillStroke();
        this.pinionColor  = new FillStroke();
    }

    clone() {
        const cloned = new CNeedle();
        Object.assign(cloned, this);
        
        cloned.pointerColor = this.pointerColor.clone();
        cloned.pinionColor = this.pinionColor.clone();

        return cloned;
    }

    static image = '/static/images/needle.png';
    static name = "Needle";
    static previewGif = null;

    /** Reconstructs a CNeedle object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {CNeedle} The deserialized CNeedle instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        const cNeedle = Object.assign(new CNeedle(), json);
    
        // Deserialize pointer color
        if (json.pointerColor) {
            cNeedle.pointerColor = FillStroke.fromJSON(json.pointerColor);
        }

        // Deserialize pointer color
        if (json.pinionColor) {
            cNeedle.pinionColor = FillStroke.fromJSON(json.pinionColor);
        }

        return cNeedle;
    }

    /** Draws the CNeedle on a canvas.
     * 
     * @param {*} canvas The HTML canvas on which to draw the GaugeFace.
     * @param {*} context The 2D drawing context of the canvas.
     * @param {*} x The center X coordinate of the arc.
     * @param {*} y The center Y coordinate of the arc.
     * @param {*} angleStart The starting angle of the arc in degrees.
     * @param {*} angleEnd The ending angle of the arc in degrees.
     * @param {*} gaugeValue The value of to be displayed.
     */
    draw(canvas, context, x, y, angleStart, angleEnd, gaugeValue) {
        let needleAngle = (map(gaugeValue.getValueRaw(), gaugeValue.getMinimumRaw(), gaugeValue.getMaximumRaw(), angleStart, angleEnd) % 360) * (Math.PI / 180);

        // Draw pinion (diamond shape)
        context.beginPath();

        context.moveTo(x, y - this.pinionRadius);
        context.lineTo(x + this.pinionRadius, y);
        context.lineTo(x, y + this.pinionRadius);
        context.lineTo(x - this.pinionRadius, y);

        context.closePath();

        if (this.pinionColor.fill) {
            context.fillStyle = this.pinionColor.fill.getColor();
            context.fill();
        }

        if (this.pinionColor.stroke) {
            context.strokeStyle = this.pinionColor.stroke.color.getColor();
            context.lineWidth = this.pinionColor.stroke.thickness;
            context.stroke();
        }

        // Pointer

        let pointerInnerRadius = ((+this.pinionRadius + this.spacing) / +Math.SQRT2) * +this.pointerThickness; // The radius of the circle that the pointer should target
        context.beginPath();

        drawCircle(canvas, context, x + Math.cos(needleAngle - (Math.PI/2)) * this.pointerInnerRadius, y + Math.sin(needleAngle - (Math.PI/2)) * pointerInnerRadius, 10, this.pointerColor)

        // TURN HALFPI INTO A VARIABLE
        context.moveTo(x + Math.cos(needleAngle) * this.pointerRadius, y + Math.sin(needleAngle) * this.pointerRadius)
        context.lineTo(x + Math.cos(needleAngle - (Math.PI/2)) * pointerInnerRadius, y + Math.sin(needleAngle - (Math.PI/2)) * pointerInnerRadius)
        context.lineTo(x + Math.cos(needleAngle + (Math.PI/2)) * pointerInnerRadius, y + Math.sin(needleAngle + (Math.PI/2)) * pointerInnerRadius)

        context.closePath();

        if (this.pointerColor.fill) {
            context.fillStyle = this.pointerColor.fill.getColor();
            context.fill();
        }

        if (this.pointerColor.stroke) {
            context.strokeStyle = this.pointerColor.stroke.color.getColor();
            context.lineWidth = this.pointerColor.stroke.thickness;
            context.stroke();
        }
    }

    addPanels(menu) {
        const appearancePanel = menu.addPanel("Appearance");

        appearancePanel.addRow("Length", "Thickness").addInput("length", this, 'pointerRadius').addInput("percent", this, 'pointerThickness');
        appearancePanel.addRow("Pinion Radius", "Spacing").addInput("radius", this, 'pinionRadius').addInput("length", this, 'spacing');
        
        menu.addPanel("Colors").addRow("Pinion", "Pointer").addObjectProperty(this, 'pinionColor', null, true).addObjectProperty(this, 'pointerColor', null, true);
    }
};

CircularElement.registry.set("CNeedle", CNeedle);