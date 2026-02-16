import { floorDivisible, ceilDivisible, map } from "/static/js/utils.js";
import { FillStrokeTimeline } from "/static/js/core/colors/FillStrokeTimeline.js";

export class RootTick {
    constructor(divisions = null, interval = null, length, thickness, style, color, tickValueStyle = null) {
        this.divisions = divisions;
        this.interval = interval;
        this.length = length;
        this.thickness = thickness;
        this.style = style;
        this.color = color;
        this.tickValueStyle = tickValueStyle;
    }

    clone(gaugeValue) {
        const cloned = Object.assign(new RootTick(), this);
        
        cloned.color = this.color.clone(gaugeValue);
        // Tickvalue style needs to be added later

        return cloned;
    }

    static fromJSON(json, gaugeValue) {
        const rootTick = Object.assign(new RootTick(), json);

        if (json.color) rootTick.color = FillStrokeTimeline.fromJSON(json.color, gaugeValue);

        return rootTick;
    }

    getInterval(lower, upper) {
        if (this.divisions != null) {
            return 1 / this.divisions;
        } else if (this.interval != null) {
            return this.interval / (upper - lower);
        }

        throw new Error("RootTick missing divisions or interval property!");
    }

    getPositions(lower, upper, offset = 0) {
        const positions = [];

        if (this.divisions != null) {
            if (this.divisions <= 0) return positions;

            const interval = 1 / this.divisions;
            const offsetPos = map(offset, lower, upper, 0, 1);

            const remainder = offsetPos % interval;
            const off = (Math.abs(remainder) < 1e-10) ? 0 : -remainder;
            
            for (let i = 0; i <= this.divisions; i++) {
                const position = (i * interval) + off;
                positions.push(position);
            }
        } else if (this.interval != null) {
            const _interval = this.interval;

            const lastTickValue = ceilDivisible(upper, _interval, offset);
            let currentValue = floorDivisible(lower, _interval, offset);

            while (currentValue <= lastTickValue) {
                const currentPosition = map(currentValue, lower, upper, 0, 1);
                positions.push(currentPosition);
                currentValue += _interval;
            }
        }

        return positions;
    }

    addPanels(menu, onChange = null, obj, propertyName) {
        const stylePanel = menu.addPanel("Style");

        const divisionsRow = stylePanel.addRow("Divisions", "Interval");
        const divisionsInput = divisionsRow.addInput("int", this, 'divisions', { onChange: () => { this.interval = null;  intervalInput.render(); console.log(`Divisions: ${this.divisions}    Interval: ${this.interval}`); } });
        const intervalInput = divisionsRow.addInput("int", this, 'interval',  { onChange: () => { this.divisions = null; divisionsInput.render(); console.log(`Divisions: ${this.divisions}    Interval: ${this.interval}`); } });
        
        stylePanel.addRow("Length", "Thickness").addInput("length", this, 'length').addInput("length", this, 'thickness');

        this.color.addPanels(menu);
    }
}