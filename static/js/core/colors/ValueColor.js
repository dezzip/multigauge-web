import { Color } from "/static/js/core/colors/Color.js"; 
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { StaticColor } from "/static/js/core/colors/StaticColor.js"; 
import { CycleColor } from "/static/js/core/colors/CycleColor.js"; 
import { UserColor } from "/static/js/core/colors/UserColor.js"; 

import { availableValues } from "/static/js/core/values/Value.js";

import menuStack from "/static/js/editor/MenuStack.js";
import undoStack from "/static/js/editor/UndoStack.js";

import { onNodeRemoved } from "/static/js/utils.js";

export class ValueColor extends Color {
    constructor() {
        super("ValueColor");
        this.value = availableValues[0];

        this.timeline = new ColorTimeline(null, null);
        this.timeline.changeDisplay(this.value.getMinimum(), this.value.getMaximum());
    }

    clone() {
        const cloned = new ValueColor();

        cloned.value = this.value;
        cloned.timeline = this.timeline.clone();
        
        return cloned;
    }

    static fromJSON(json) {
        const valueColor = Object.assign(new ValueColor(), json);

        // Deserialize timeline
        if (json.timeline) {
            valueColor.timeline = ColorTimeline.fromJSON(json.timeline);
        }

        return valueColor;
    }

    blend(color, blend) { this.timeline.blend(color, blend); }

    getValue() {
        return this.value.getValueRaw();
    }

    getColor() {
        return this.timeline.getColor(this.getValue());
    }

    addPanels(menu, onChange = null, obj, propertyName) {
        const colorTypes = [
            { class: StaticColor, image: '/static/images/color-types/static_color.png' },
            { class: ValueColor, image: '/static/images/color-types/value_color.png' },
            { class: CycleColor, image: '/static/images/color-types/cycle_color.png' },
            { class: UserColor, image: '/static/images/color-types/user_color.png' }
        ];

        menu.addPanel().addRow()
            .addInput("buttonMenu", this, 'unused', {
                onChange: (index) => {
                    const NewColorClass = colorTypes[index].class;
                    const newColor = new NewColorClass();

                    undoStack.addPropertyChangeAction(obj, propertyName, obj[propertyName], newColor, () => {
                        if (typeof onChange === 'function') onChange();
                        menuStack.replaceProperty(obj, propertyName, onChange);
                    });

                    obj[propertyName] = newColor;

                    console.warn("Changing color type...");
                    menuStack.replaceProperty(obj, propertyName, onChange);

                    if (typeof onChange === 'function') onChange();
                },
                selectedIndex: 1,
                images: colorTypes.map(color => color.image),
            });

        menu.addPanel().addRow("Mapped Value").addInput("menu", this, 'value', { onChange: () => { 
            this.timeline.changeDisplay(this.value.getMinimum(), this.value.getMaximum());
        }});

        this.timeline.addPanels(menu, onChange, this, 'timeline');
    }

    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");

        // Create the color preview square
        const colorPreview = document.createElement("div");
        colorPreview.className = "color-preview";
        propertyObject.appendChild(colorPreview);

        const colorSwatch = document.createElement("div");
        colorSwatch.className = "color-swatch";
        colorPreview.appendChild(colorSwatch);

        const colorLabel = document.createElement("span");
        colorLabel.className = "color-label";
        colorLabel.textContent = "Value";
        colorLabel.style.flex = "1";
        propertyObject.appendChild(colorLabel);

        let animationFrameId = null;

        const updateSwatch = () => {
            const newColor = this.getColor();
            if (colorSwatch.style.backgroundColor !== newColor) {
                colorSwatch.style.backgroundColor = newColor;
            }
            animationFrameId = requestAnimationFrame(updateSwatch);
        };

        updateSwatch();
        propertyObject.addEventListener("click", () => {
            const rect = colorPreview.getBoundingClientRect();
            menuStack.openProperty(obj, propertyName, onChange, rect.left, rect.top);
        });

        onNodeRemoved(propertyObject, () => cancelAnimationFrame(animationFrameId));

        return propertyObject;
    }
};

Color.registry.set("ValueColor", ValueColor);