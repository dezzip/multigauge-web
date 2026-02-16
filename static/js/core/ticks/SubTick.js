import { FillStrokeTimeline } from "/static/js/core/colors/FillStrokeTimeline.js";

export class SubTick {
    constructor(divisions, length = null, thickness = null, style = null, color = null, tickValueStyle = null) {
        this.divisions = divisions;
        this.length = length;
        this.thickness = thickness;
        this.style = style;
        this.color = color;
        this.tickValueStyle = tickValueStyle;
    }

    clone(gaugeValue) {
        const cloned = Object.assign(new SubTick(), this);
        
        cloned.color = this.color.clone(gaugeValue);
        // Tickvalue style needs to be added later

        return cloned;
    }

    static fromJSON(json, gaugeValue) {
        const subTick = Object.assign(new SubTick(), json);

        if (json.color) subTick.color = FillStrokeTimeline.fromJSON(json.color, gaugeValue);

        return subTick;
    }

    static getDefault() { return new SubTick(1); }

    getInterval(lower, upper) { return (upper - lower) / (this.divisions + 1); }

    getPositions(lower, upper) {
        const positions = [];

        if (this.divisions <= 0) return positions;

        const interval = this.getInterval(lower, upper);

        for (let i = 0; i <= this.divisions; i++) {
            const position = lower + (i * interval);
            positions.push(position);
        }

        return positions;
    }

    addPanels(menu, onChange = null, obj, propertyName) {
        const stylePanel = menu.addPanel("Style");

        stylePanel.addRow("Divisions").addInput("length", this, 'divisions');
        stylePanel.addRow("Length", "Thickness").addInput("length", this, 'length').addInput("length", this, 'thickness');
    }
}