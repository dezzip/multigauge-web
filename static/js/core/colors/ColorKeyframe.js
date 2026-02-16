import { createTestIntField, createObjectPropertyField } from "/static/js/input.js";
import { Color } from "/static/js/core/colors/Color.js";
import { StaticColor } from "/static/js/core/colors/StaticColor.js";

function mapValue(value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

export class ColorKeyframe {
    constructor(color, value, smoothed, gaugeValue = null) {
        this.color = color;
        this.value = value;
        this.smoothed = smoothed || true;
        this.gaugeValue = gaugeValue;
    }

    clone() {
        const cloned = new ColorKeyframe();
        Object.assign(cloned, this);
        
        cloned.gaugeValue = null; // Fix this
        cloned.color = this.color.clone();

        return cloned;
    }

    static fromJSON(json) {
        const colorKeyframe = Object.assign(new ColorKeyframe(), json);

        // Deserialize color
        if (json.color) {
            colorKeyframe.color = Color.fromJSON(json.color);
        }

        return colorKeyframe;
    }

    static getDefault() {
        return new ColorKeyframe(new StaticColor("#FFFFFF"), 0, true);
    }

    blend(color, blend) { this.color.blend(color, blend); }

    getColor() {
        if (this.color) return this.color.getColor();
        return "#000000";
    }

    getInterpolatedColor(other, currentValue) {
        if ((other.value > this.value && currentValue >= other.value) || (other.value < this.value && currentValue <= other.value)) {
            return other.getColor();
        }

        if (!this.smoothed) {
            return this.getColor();
        }

        const alpha = mapValue(currentValue, other.value, this.value, 0, 1);

        return other.color.getBlendColor(this.color, alpha);
    }

    createObjectField(onChange = null) {
        const propertyObject = document.createElement("div");

        // TODO: Eventually limit this to the gaugeValue's range
        const positionInput = createTestIntField(this, 'value', null, null, null, onChange);
        positionInput.className = "keyframe-position-input";
        propertyObject.appendChild(positionInput);

        const colorObjectProperty = createObjectPropertyField(this, 'color', onChange);
        colorObjectProperty.className = "keyframe-color-input";
        propertyObject.appendChild(colorObjectProperty);

        return propertyObject;
    }

    addPanels(menu, onChange = null) {
        this.color.addPanels(menu, this, 'color', { onChange: onChange });
    }
};