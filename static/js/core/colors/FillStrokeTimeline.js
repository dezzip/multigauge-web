import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { Stroke } from "/static/js/core/colors/Stroke.js";
import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { createTestIntField, createObjectPropertyField } from "/static/js/input.js";
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

export class StrokeTimeline {
    constructor(gaugeValue = null) {
        this.timeline = new ColorTimeline(gaugeValue);
        this.thickness = 1;
    }

    clone(gaugeValue = null) {
        const cloned = Object.assign(new StrokeTimeline(), this);
        
        cloned.timeline = this.timeline.clone(gaugeValue);

        return cloned;
    }

    static getDefault() {
        return new StrokeTimeline();
    }

    static fromJSON(json, gaugeValue = null) {
        const strokeTimeline = Object.assign(new StrokeTimeline(), json);

        if (json.timeline) strokeTimeline.timeline = ColorTimeline.fromJSON(json.timeline, gaugeValue);

        return strokeTimeline;
    }

    addPanels(menu, onChange = null, obj, propertyName) {
        this.timeline.addPanels(menu);
    }

    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");
        propertyObject.style.display = "flex";

        const positionInput = createTestIntField(this, 'thickness', onChange);
        positionInput.className = "keyframe-position-input";
        propertyObject.appendChild(positionInput);

        const timelineObjectProperty = createObjectPropertyField(this, 'timeline', onChange);
        timelineObjectProperty.className = "keyframe-color-input";
        propertyObject.appendChild(timelineObjectProperty);

        return propertyObject;
    }

    toJSON() {
        const { gaugeValue, ...rest } = this;

        return rest;
    }
};

export class FillStrokeTimeline {
    constructor(gaugeValue = null) {
        this.gaugeValue = gaugeValue; // Stored for new timelines

        this.fillTimeline = new ColorTimeline(this.gaugeValue);
        this.stroke = new StrokeTimeline(this.gaugeValue);
    }

    clone(gaugeValue = null) {
        const cloned = Object.assign(new FillStrokeTimeline(), this);

        cloned.gaugeValue = gaugeValue;

        cloned.fillTimeline = this.fillTimeline.clone(gaugeValue);
        cloned.stroke = this.stroke.clone(gaugeValue);

        return cloned;
    }
    
    static fromJSON(json, gaugeValue = null) {
        const fillStrokeTimeline = Object.assign(new FillStrokeTimeline(gaugeValue), json);

        if (json.fillTimeline) fillStrokeTimeline.fillTimeline = ColorTimeline.fromJSON(json.fillTimeline, gaugeValue);
        if (json.stroke) fillStrokeTimeline.stroke = StrokeTimeline.fromJSON(json.stroke, gaugeValue);

        return fillStrokeTimeline;
    }

    getFillStroke(value) {
        let fsFill = null;
        let fsStroke = null;

        if (this.fillTimeline) fsFill = new StaticColor(this.fillTimeline.getColor(value));

        if (this.stroke) fsStroke = new Stroke(new StaticColor(this.stroke.timeline.getColor(value)), this.stroke.thickness);

        return new FillStroke(fsFill, fsStroke);
    }

    addPanels(menu, onChange = null, obj, propertyName) {
        const panel = menu.addPanel("Color");

        panel.addToggleableObjectProperty("Fill", this, 'fillTimeline', ColorTimeline, (timeline) => {
                this.gaugeValue.subscribe(timeline);
            },
            (timeline) => {
                this.gaugeValue.unsubscribe(timeline);
            }
        );
        
        panel.addToggleableObjectProperty("Stroke", this, 'stroke', StrokeTimeline, (stroke) => {
                this.gaugeValue.subscribe(stroke.timeline);
            },
            (stroke) => {
                this.gaugeValue.unsubscribe(stroke.timeline);
            }
        );
    }

    toJSON() {
        const { gaugeValue, ...rest } = this;

        return rest;
    }
};