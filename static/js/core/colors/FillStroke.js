import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { Color } from "/static/js/core/colors/Color.js";
import { Stroke } from "/static/js/core/colors/Stroke.js";

import menuStack from "/static/js/editor/MenuStack.js";

export class FillStroke {
    constructor(fill = new StaticColor("#000000"), stroke = new Stroke(new StaticColor("#ffffff", 1))) {
        this.fill   = fill;
        this.stroke = stroke;
    }

    clone() {
        const cloned = new FillStroke();
        
        cloned.fill = this.fill ? this.fill.clone() : null;
        cloned.stroke = this.stroke ? this.stroke.clone() : null;

        return cloned;
    }

    static fromJSON(json) {
        const fillStroke = Object.assign(new FillStroke(), json);
        
        // Deserialize fill
        if (json.fill) {
            fillStroke.fill = Color.fromJSON(json.fill);
        }

        // Deserialize stroke
        if (json.stroke) {
            fillStroke.stroke = Stroke.fromJSON(json.stroke);
        }

        return fillStroke;
    }

    blend(color, strokeThickness, blend) {
        this.blendFill(color, blend);
        this.blendStroke(color, strokeThickness, blend);
    }

    blendFill(color, blend) {
        if (this.fill != null) this.fill.blend(color, blend);
    }

    blendStroke(color, thickness, blend) {
        if (this.stroke == null) return;
        this.stroke.thickness = lerp(this.stroke.thickness, thickness, blend);
        this.stroke.color.blend(color, blend);
    }

    getBlendFillStroke(blend, alpha) {
        let blendColor = blend;//blend.getColor();

        let blendFill   = this.fill   ? new StaticColor(this.fill.getBlendColor(blendColor, alpha)) : null;
        let blendStroke = this.stroke ? new Stroke(new StaticColor(this.stroke.color.getBlendColor(blendColor, alpha)), this.stroke.thickness) : null;

        return new FillStroke(blendFill, blendStroke);
    }
    
    /* EDITOR */

    addPanels(menu, onChange = null, obj, propertyName) {
        const colorPanel = menu.addPanel();

        colorPanel.addToggleableObjectProperty("Fill", this, 'fill', StaticColor, null, null, onChange);
        colorPanel.addToggleableObjectProperty("Stroke", this, 'stroke', Stroke, null, null, onChange);
    }

    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");

        // Create the color preview square
        const colorPreview = document.createElement("div");
        colorPreview.className = "color-preview";

        colorPreview.addEventListener("click", () => {
            const rect = colorPreview.getBoundingClientRect();

            menuStack.openProperty(obj, propertyName, onChange, rect.left, rect.top);
        });
        propertyObject.appendChild(colorPreview);

        const colorSwatch = document.createElement("div");

        const checkerboard = document.createElement('img');
        checkerboard.src = "/static/images/checkerboard.png";
        checkerboard.className = "checkerboard";
        colorSwatch.appendChild(checkerboard);

        colorSwatch.className = "color-swatch";
        if (this.fill != null) {
            colorSwatch.style.backgroundColor = this.fill.getColor();
            checkerboard.style.display = "none";
        } else {
            colorSwatch.style.backgroundColor = "transparent";
            checkerboard.style.display = "block";
        }
        colorSwatch.style.borderColor = (this.stroke != null) ? this.stroke.getColor() : "transparent";
        colorPreview.appendChild(colorSwatch);

        const colorLabel = document.createElement("span");
        colorLabel.className = "color-label";
        colorLabel.textContent = "Fill Stroke";
        colorLabel.style.flex = "1";
        propertyObject.appendChild(colorLabel);

        return propertyObject;
    }
}