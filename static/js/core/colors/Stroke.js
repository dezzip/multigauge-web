import { Color } from "/static/js/core/colors/Color.js"; 
import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { createTestIntField, createObjectPropertyField } from "/static/js/input.js";

export class Stroke {
    constructor(color = new StaticColor("#000000"), thickness = 1) {
        this.color     = color;
        this.thickness = thickness;
    }

    clone() {
        const cloned = new Stroke();
        Object.assign(cloned, this);
        
        cloned.color = this.color.clone();

        return cloned;
    }

    static getDefault() {
        return new Stroke();
    }

    static fromJSON(json) {
        const stroke = Object.assign(new Stroke(), json);

        // Deserialize color
        if (json.color) {
            stroke.color = Color.fromJSON(json.color);
        }

        return stroke;
    }

    addPanels(menu) {
        this.color.addPanels(menu);
        menu.addPanel("Thickness").addRow("Thickness").addInput("length", this, 'thickness');
    }

    getColor() {
        return this.color.getColor();
    }

    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");
        propertyObject.style.display = "flex";

        const positionInput = createTestIntField(this, 'thickness', onChange);
        positionInput.className = "keyframe-position-input";
        propertyObject.appendChild(positionInput);

        const colorObjectProperty = createObjectPropertyField(this, 'color', onChange);
        colorObjectProperty.className = "keyframe-color-input";
        propertyObject.appendChild(colorObjectProperty);

        return propertyObject;
    }
}