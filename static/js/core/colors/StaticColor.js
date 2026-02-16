import { Color } from "/static/js/core/colors/Color.js"; 

import { CycleColor } from "/static/js/core/colors/CycleColor.js"; 
import { ValueColor } from "/static/js/core/colors/ValueColor.js"; 
import { UserColor } from "/static/js/core/colors/UserColor.js"; 

import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";
import { ColorKeyframe } from "/static/js/core/colors/ColorKeyframe.js";

import menuStack from "/static/js/editor/MenuStack.js";
import undoStack from "/static/js/editor/UndoStack.js";

import { createTextField } from "/static/js/input.js";
import { blendColors } from "/static/js/draw.js";

export class StaticColor extends Color {
    constructor(color = "#000000") {
        super("StaticColor");
        this.color = color;
    }

    clone() {
        const cloned = new StaticColor();
        Object.assign(cloned, this);
        
        return cloned;
    }

    static getDefault() {
        return new StaticColor();
    }

    getColor() { return this.color; }

    blend(color, blend) { this.color = blendColors(blend, this.color, color); }

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

                    obj[propertyName] = newColor

                    console.warn("Changing color type...");
                    menuStack.replaceProperty(obj, propertyName, onChange);

                    if (typeof onChange === 'function') onChange();
                },
                selectedIndex: 0,
                images: colorTypes.map(color => color.image),
            });
        
        menu.addPanel().addColorPicker(this, 'color', { onChange: onChange });
    }

    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");

        // Create the color preview square
        const colorPreview = document.createElement("div");
        colorPreview.className = "color-preview";

        const effectiveOnChange = () => {
            updateSwatch();
            if (onChange != null && typeof onChange === 'function') onChange();
        }

        colorPreview.addEventListener("click", () => {
            const rect = colorPreview.getBoundingClientRect();

            menuStack.openProperty(obj, propertyName, effectiveOnChange, rect.left, rect.top);
        });
        propertyObject.appendChild(colorPreview);

        const colorSwatch = document.createElement("div");
        colorSwatch.className = "color-swatch";
        colorSwatch.style.backgroundColor = this.getColor();
        colorPreview.appendChild(colorSwatch);

        const colorHexProperty = createTextField(this, 'color', onChange);
        colorHexProperty.style.flex = "1";
        propertyObject.appendChild(colorHexProperty);

        const updateSwatch = () => {
            const newColor = this.getColor();
            if (colorSwatch.style.backgroundColor !== newColor) {
                colorSwatch.style.backgroundColor = newColor;
            }
        };

        updateSwatch();

        return propertyObject;
    }
};

Color.registry.set("StaticColor", StaticColor);