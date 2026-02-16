
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";
import { ColorKeyframe } from "/static/js/core/colors/ColorKeyframe.js";
import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { FillStrokeTimeline, StrokeTimeline } from "/static/js/core/colors/FillStrokeTimeline.js";
import { lerp, map, inRange } from "/static/js/utils.js";

import menuStack from "/static/js/editor/MenuStack.js"

import { RootTick } from "/static/js/core/ticks/RootTick.js";
import { SubTick } from "/static/js/core/ticks/SubTick.js";
import { alignLength, Orientation } from "/static/js/core/geometry/alignments.js";
import { Line } from "/static/js/core/geometry/Line.js";
import { Point } from "/static/js/core/geometry/Point.js"

import { drawWideLine } from "/static/js/draw.js"

export const TickStyle = Object.freeze({
    TICK_LINE: 0,
    TICK_TRIANGLE: 1,
    TICK_CIRCLE: 2,
});

export class TickList {
    constructor(gaugeValue, offset = 0) {
        this.rootTick = new RootTick(10, null, 10, 1, TickStyle.TICK_LINE, new FillStrokeTimeline(gaugeValue));
        this.subTicks = [];
        this.offset = offset;
        this.fade = null;

        this.displayValue = 0;

        this.lengthFactor = 0;
        this.thicknessFactor = 0;
        this.textSizeFactor = 0;
        this.fillStrokeModifier = new FillStroke(null, null);
        this.valueColorModifier = null;

        this.leftHighlightBase = 1;
        this.leftHighlightFactor = 1;
        this.leftHighlightDistance = 0;

        this.rightHighlightBase = 0.0;
        this.rightHighlightFactor = 0;
        this.rightHighlightDistance = 0;

        this.gaugeValue = gaugeValue;
    }

    clone(gaugeValue) {
        const cloned = new TickList();
        Object.assign(cloned, this);
        
        cloned.rootTick = this.rootTick.clone(gaugeValue);
        cloned.subTicks = this.subTicks.map(tick => tick.clone(gaugeValue));

        cloned.gaugeValue = gaugeValue;
        cloned.fillStrokeModifier = this.fillStrokeModifier.clone();

        return cloned;
    }

    static fromJSON(json, gaugeValue) {
        const tickList = Object.assign(new TickList(), json);

        tickList.gaugeValue = gaugeValue;

        tickList.rootTick = RootTick.fromJSON(json.rootTick);

        if (Array.isArray(json.subTicks)) tickList.subTicks = json.subTicks.map((element) => SubTick.fromJSON(element));

        tickList.fillStrokeModifier = FillStroke.fromJSON(json.fillStrokeModifier);
        
        return tickList;
    }

    setValue(newValue) { this.displayValue = newValue; }

    getInheritedProperty(index, propName) {
        while (index > 0) {
            const value = this.subTicks[index - 1][propName];
            if (value != null) return value;
            --index;
        }
        return this.rootTick[propName];
    }

    getStyle(index)      { return this.getInheritedProperty(index, 'style');     }
    getColor(index)      { return this.getInheritedProperty(index, 'color');     }
    getLength(index)     { return this.getInheritedProperty(index, 'length');    }
    getThickness(index)  { return this.getInheritedProperty(index, 'thickness'); }
    getValueStyle(index) { 
        if (index === 0) return this.rootTick.tickValueStyle;
        return this.subTicks[index - 1].tickValueStyle;
    }

    getHighlightFactor(value) {
        const delta = value - this.displayValue;

        if (delta < 0) {
            if (this.leftHighlightDistance <= 0 || delta >= this.leftHighlightDistance) return this.leftHighlightBase;

            return lerp(this.leftHighlightBase, this.leftHighlightFactor, 1 - Math.min(1, Math.abs(delta) / this.leftHighlightDistance));
        } else if (delta > 0) {
            if (this.rightHighlightDistance <= 0 || delta >= this.rightHighlightDistance) return this.rightHighlightBase;
        
            return lerp(this.rightHighlightBase, this.rightHighlightFactor, 1 - Math.min(1, Math.abs(delta) / this.rightHighlightDistance));
        }

        return Math.max(this.leftHighlightFactor, this.rightHighlightFactor);
    }

    /* Tick Positioning */
    getSequentialTickPositions(allPositions, startTickPosition, endTickPosition, index) {
        if (index >= this.subTicks.length) return; // Skip if this index is out of bounds

        const tick = this.subTicks[index]; // Get current tick

        const positions = tick.getPositions(startTickPosition, endTickPosition); // Get the positions
        const interval  = tick.getInterval(startTickPosition, endTickPosition); // Get the interval between positions

        for (let i = 0; i < positions.length; i++) {
            const position = positions[i]; // Get the current position at this index

            if (inRange(position, 0, 1)) { // Don't add the first tick as it won't be drawn
                allPositions[index + 1].push(position);
            }

            // Recursively get sub-tick position for the next level
            this.getSequentialTickPositions(allPositions, position, position + interval, index + 1);
        }
    }

    getTickPositions(startValue, endValue) {
        let allPositions = Array(this.subTicks.length + 1).fill().map(() => []);

        const positions = this.rootTick.getPositions(startValue, endValue, this.offset); // Get the positions
        const interval = this.rootTick.getInterval(startValue, endValue); // Get the interval between positions

        positions.forEach((position) => {
            if (inRange(position, 0, 1)) { allPositions[0].push(position); }

            this.getSequentialTickPositions(allPositions, position, position + interval, 0);
        });

        return allPositions;
    }

    /* Tick Drawing */
    drawLineTick(canvas, context, line, thickness, temporaryFS) {
        drawWideLine(canvas, context, line.p1.x, line.p1.y, line.p2.x, line.p2.y, thickness, temporaryFS);
    }

    /* Circular */
    drawCircularTick(canvas, context, index, pos, radius, alignment, position, angle, value) {
        const highlightFactor = this.getHighlightFactor(value);

        let length = this.getLength(index);
        let thickness = this.getThickness(index);
        const style = this.getStyle(index);
        const color = this.getColor(index);
        const valueStyle = this.getValueStyle(index);

        if (highlightFactor >= 0) {
            length *= 1 + (this.lengthFactor * highlightFactor);
            thickness *= 1 + (this.thicknessFactor * highlightFactor);
        }

        const tickRadii = alignLength(radius, length, alignment);

        const unitVector = Point.unitVector(angle);
        const line = new Line(pos.add(unitVector.multiply(tickRadii[0])), pos.add(unitVector.multiply(tickRadii[1])));
        let temporaryFS = color.getFillStroke(value);

        if (this.fillStrokeModifier.fill != null) temporaryFS.blendFill(this.fillStrokeModifier.fill.getColor(), highlightFactor);
        if (this.fillStrokeModifier.stroke != null) temporaryFS.blendFill(this.fillStrokeModifier.stroke.getColor(), this.fillStrokeModifier.stroke.thickness, highlightFactor);

        switch(style) {
            case TickStyle.TICK_LINE:
                this.drawLineTick(canvas, context, line, thickness, temporaryFS);
                break;
        }
    }

    drawCircularTicks(canvas, context, pos, radius, alignment, startAngle, endAngle, startValue, endValue) {
        let tickPositions = this.getTickPositions(startValue, endValue);

        const rStartAngle = startAngle * (Math.PI / 180);
        const rEndAngle = endAngle * (Math.PI / 180);
    
        for (let index = tickPositions.length - 1; index >= 0; index--) {
            tickPositions[index].forEach((position) => {
                let angle = lerp(rStartAngle, rEndAngle, position);
                let value = lerp(startValue, endValue, position);
    
                this.drawCircularTick(canvas, context, index, pos, radius, alignment, position, angle, value);
            });
        }
    }

    /* Linear */

    drawLinearTick(canvas, context, index, lengthComponent, thicknessComponent, orientation, alignment, value) {
        const highlightFactor = this.getHighlightFactor(value);

        let length = this.getLength(index);
        let thickness = this.getThickness(index);
        const style = this.getStyle(index);
        const color = this.getColor(index);
        const valueStyle = this.getValueStyle(index);

        if (highlightFactor >= 0) {
            length *= 1 + (this.lengthFactor * highlightFactor);
            thickness *= 1 + (this.thicknessFactor * highlightFactor);
        }

        const tickPositions = alignLength(thicknessComponent, length, alignment);

        let line = new Line();

        if (orientation === Orientation.HORIZONTAL) {
            line = new Line(new Point(lengthComponent, tickPositions[0]), new Point(lengthComponent, tickPositions[1]));
        } else {
            line = new Line(new Point(tickPositions[0], lengthComponent), new Point(tickPositions[1], lengthComponent));
        }

        let temporaryFS = color.getFillStroke(value);

        if (this.fillStrokeModifier.fill != null) temporaryFS.blendFill(this.fillStrokeModifier.fill.getColor(), highlightFactor);
        if (this.fillStrokeModifier.stroke != null) temporaryFS.blendFill(this.fillStrokeModifier.stroke.getColor(), this.fillStrokeModifier.stroke.thickness, highlightFactor);

        switch(style) {
            case TickStyle.TICK_LINE:
                this.drawLineTick(canvas, context, line, thickness, temporaryFS);
                break;
        }
    }

    drawLinearTicks(canvas, context, pos, alignment, length, orientation, reverseDirection, startValue, endValue) {
        let tickPositions = this.getTickPositions(startValue, endValue);

        const lengthComponent = (orientation === Orientation.HORIZONTAL) ? pos.x : pos.y;
        const thicknessComponent = (orientation === Orientation.HORIZONTAL) ? pos.y : pos.x;
    
        for (let index = tickPositions.length - 1; index >= 0; index--) {
            tickPositions[index].forEach((position) => {
                const currentPos = lerp(lengthComponent, lengthComponent + length, position);
                const value = lerp(startValue, endValue, position);
    
                this.drawLinearTick(canvas, context, index, currentPos, thicknessComponent, orientation, alignment, value);
            });
        }
    }

    /* EDITOR */

    addPanels(menu) {
        const tickMarksPanel = menu.addPanel("Tick marks");

        tickMarksPanel.addRow().addObjectProperty(this, 'rootTick', null);

        tickMarksPanel.addList(this, 'subTicks', { objectType: SubTick, label: "Tick", max: 4, onAdd: (tick) => {
            tick.gaugeValue = this.gaugeValue;
        }, onRemove: (tick) => {
            if (tick.color != null) {
                if (tick.color.fillTimeline != null) this.gaugeValue.unsubscribe(tick.color.fillTimeline);
                if (tick.color.stroke != null) this.gaugeValue.unsubscribe(tick.color.stroke.timeline);
            }
        }});

        const modifiersPanel = menu.addPanel("Modifiers");

        modifiersPanel.addRow("Length", "Thickness").addInput("percent", this, 'lengthFactor').addInput("percent", this, 'thicknessFactor');

        modifiersPanel.addToggleableObjectProperty("Text Color", this, 'valueColorModifier', StaticColor);
        modifiersPanel.addRow("Tick Color").addObjectProperty(this, 'fillStrokeModifier');

        const advancedPanel = menu.addCollapsiblePanel("Modifiers (Advanced)");

        advancedPanel.addRow("Base").addInput("percent", this, 'leftHighlightBase');
        advancedPanel.addRow("Factor", "Distance").addInput("percent", this, 'leftHighlightFactor').addInput("length", this, 'leftHighlightDistance');

        advancedPanel.addRow("Base").addInput("percent", this, 'rightHighlightBase');
        advancedPanel.addRow("Factor", "Distance").addInput("percent", this, 'rightHighlightFactor').addInput("length", this, 'rightHighlightDistance');
    }
}