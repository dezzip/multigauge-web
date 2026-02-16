import { LinearElement } from "/static/js/core/gauge/gauge-elements/linear-elements/LinearElement.js";
import { Orientation, LengthAlignment } from "/static/js/core/geometry/alignments.js";
import { TickList } from "/static/js/core/ticks/TickList.js";
import { Point } from "/static/js/core/geometry/Point.js"

import { fillStrokeRectangleOrientation } from "/static/js/draw.js";

import { FillStroke } from "/static/js/core/colors/FillStroke.js"

/**
 * Represents a scale element in a circular gauge.
 * 
 * The scale is drawn as a series of ticks that indicate the values at each
 * position on the arc length. Ticks are drawn in the the order of the TickList.
 */
export class LSegments extends LinearElement {
    constructor(gaugeValue) {
        super("LSegments");
        this.position  = 0;
        this.thickness = 10;
        this.alignment = LengthAlignment.LENGTH_CENTER;
        this.segmentCount = 10;
        this.segmentSpacing = 3;
        this.borderSpacing = 0;
        this.cornerRadius = 2;
        this.interpolatedSegments = true;

        this.barColor = new FillStroke();
        this.backgroundColor = new FillStroke(null, null);
    }

    clone() {
        const cloned = new LSegments();
        Object.assign(cloned, this);
        
        cloned.barColor = this.barColor.clone();
        cloned.backgroundColor = this.backgroundColor.clone();

        return cloned;
    }

    static image = '/static/images/pointer.png';
    static name = "Segments";
    static previewGif = null;

    static fromJSON(json) {
        const segments = Object.assign(new LSegments(), json);

        segments.barColor        = FillStroke.fromJSON(json.barColor);
        segments.backgroundColor = FillStroke.fromJSON(json.backgroundColor);
        
        return segments;
    }

    draw(canvas, context, gaugeValue, x, y, alignment, length, orientation, reverseDirection) {
        const lengthComponent = (orientation === Orientation.HORIZONTAL) ? x : y;
        const thicknessComponent = (orientation === Orientation.HORIZONTAL) ? y : x;

        const startingLengthComponent = lengthComponent;

        const valueLength = gaugeValue.getInterpolationValue() * length;

        const totalSegmentsLength = length - (this.segmentCount + 1) * this.segmentSpacing;

        const segmentLength = totalSegmentsLength / this.segmentCount;
        
        const reverseMultiplier = 1;
        const segmentAlignment = LengthAlignment.LENGTH_OUTER;

        const valueLengthComponent = startingLengthComponent + valueLength;

        for (let i = 0; i < this.segmentCount; i++) {
            const currentSegmentPosition = startingLengthComponent + i * (segmentLength + this.segmentSpacing);
            const segmentInterpolation = (valueLengthComponent - currentSegmentPosition) / segmentLength;

            if (segmentInterpolation >= 1) {
                fillStrokeRectangleOrientation(canvas, context, currentSegmentPosition, thicknessComponent, segmentLength, this.thickness, this.cornerRadius, orientation, segmentAlignment, this.alignment, this.barColor);
            } else if (segmentInterpolation > 0) {
                const newLength = segmentLength * segmentInterpolation;
                fillStrokeRectangleOrientation(canvas, context, currentSegmentPosition, thicknessComponent, segmentLength, this.thickness, this.cornerRadius, orientation, segmentAlignment, this.alignment, this.backgroundColor);
                fillStrokeRectangleOrientation(canvas, context, currentSegmentPosition, thicknessComponent, newLength, this.thickness, this.cornerRadius, orientation, segmentAlignment, this.alignment, this.barColor);
            } else {
                fillStrokeRectangleOrientation(canvas, context, currentSegmentPosition, thicknessComponent, segmentLength, this.thickness, this.cornerRadius, orientation, segmentAlignment, this.alignment, this.backgroundColor);
            }
        }
    }

    addPanels(menu) {
        const positioningPanel = menu.addPanel("Positioning");
        
        positioningPanel.addRow("Relative Position").addInput("radius", this, 'position')
        positioningPanel.addRow("Thickness").addInput("length", this, 'thickness').addInput("alignment", this, 'alignment');

        const appearancePanel = menu.addPanel("Appearance");
        appearancePanel.addRow("Segment Count").addInput("int", this, 'segmentCount');
        appearancePanel.addRow("Spacing", "Margin").addInput("int", this, 'segmentSpacing').addInput("int", this, 'borderSpacing');

        this.backgroundColor.addPanels(menu);
    }
};

LinearElement.registry.set("LSegments", LSegments);