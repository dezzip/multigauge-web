import { CircularElement } from "/static/js/core/gauge/gauge-elements/circular-elements/CircularElement.js";

import { FillStroke } from "/static/js/core/colors/FillStroke.js"

import { arcLengthToAngleRadians, map } from "/static/js/utils.js";
import { alignLength } from "/static/js/core/geometry/alignments.js";
import { fillStrokeArc } from "/static/js/draw.js";

/**
 * Represents a segments element in a circular gauge.
 * 
 * The segments are drawn as a series of arcs that represent the values at each position
 * on the arc length. Segments are filled in as values are reached.
 */
export class CSegments extends CircularElement {
    constructor() {
        super("CSegments");
        this.radius = 100;
        this.alignment = 0;
        this.thickness = 20;
        this.segmentCount = 8;
        this.spacing = 10;
        this.rounded = false;
        this.interpolatedSegments = true;

        this.barColor         = new FillStroke();
        this.backgroundColor  = new FillStroke(null, null);
    }

    clone() {
        const cloned = new CSegments();
        Object.assign(cloned, this);
        
        cloned.barColor = this.barColor.clone();
        cloned.backgroundColor = this.backgroundColor.clone();

        return cloned;
    }
    
    static image = '/static/images/pointer.png';
    static name = "Segments";
    static previewGif = null;

    static fromJSON(json) {
        const cSegments = Object.assign(new CSegments(), json);
    
        cSegments.barColor = FillStroke.fromJSON(json.barColor);
        cSegments.backgroundColor = FillStroke.fromJSON(json.backgroundColor);

        return cSegments;
    }

    /** Draws the CSegments on a canvas.
     * 
     * @param {*} canvas The HTML canvas on which to draw the CSegments.
     * @param {*} context The 2D drawing context of the canvas.
     * @param {*} x The center X coordinate of the arc.
     * @param {*} y The center Y coordinate of the arc.
     * @param {*} angleStart The starting angle of the arc in degrees.
     * @param {*} angleEnd The ending angle of the arc in degrees.
     * @param {*} gaugeValue The value of to be displayed.
     */
    draw(canvas, context, x, y, angleStart, angleEnd, gaugeValue) {
        const radii = alignLength(this.radius, this.thickness, this.alignment, true);
        const spacingAsAngle = arcLengthToAngleRadians(this.spacing, (radii[0] + radii[1])) * (180 / Math.PI);
        const segmentLength = (angleEnd - angleStart) / this.segmentCount;

        const newAngleEnd = map(gaugeValue.getValueRaw(), gaugeValue.getMinimumRaw(), gaugeValue.getMaximumRaw(), angleStart, angleEnd);

        for(let i = 0; i < this.segmentCount; i++) {
            const segmentAngleStart = (angleStart + segmentLength * i) + spacingAsAngle / 2;
            const segmentAngleEnd = segmentAngleStart + segmentLength - spacingAsAngle;

            if (newAngleEnd > segmentAngleEnd) {
                fillStrokeArc(canvas, context, x, y, this.radius, segmentAngleStart, segmentAngleEnd, this.thickness, this.alignment, this.barColor);
            } else if (newAngleEnd > segmentAngleStart) {
                fillStrokeArc(canvas, context, x, y, this.radius, segmentAngleStart, segmentAngleEnd, this.thickness, this.alignment, this.backgroundColor);
                fillStrokeArc(canvas, context, x, y, this.radius, segmentAngleStart, newAngleEnd, this.thickness, this.alignment, this.barColor);
            } else {
                fillStrokeArc(canvas, context, x, y, this.radius, segmentAngleStart, segmentAngleEnd, this.thickness, this.alignment, this.backgroundColor);
            }
        }
    }

    addPanels(menu) {
        const positioningPanel = menu.addPanel("Positioning");
        
        positioningPanel.addRow("Thickness").addInput("length", this, 'thickness').addInput("alignment", this, 'alignment');

        const appearancePanel = menu.addPanel("Appearance");
        appearancePanel.addRow("Segment Count").addInput("int", this, 'segmentCount');
        appearancePanel.addRow("Spacing", "Margin").addInput("int", this, 'spacing').addInput("int", this, 'borderSpacing');

        this.backgroundColor.addPanels(menu);
    }
};

CircularElement.registry.set("CSegments", CSegments);