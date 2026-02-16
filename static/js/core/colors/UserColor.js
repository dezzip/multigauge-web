import { Color } from "/static/js/core/colors/Color.js"; 

import { StaticColor } from "/static/js/core/colors/StaticColor.js"; 
import { CycleColor } from "/static/js/core/colors/CycleColor.js"; 
import { ValueColor } from "/static/js/core/colors/ValueColor.js"; 

import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";
import { ColorKeyframe } from "/static/js/core/colors/ColorKeyframe.js";

import menuStack from "/static/js/editor/MenuStack.js";
import undoStack from "/static/js/editor/UndoStack.js";

import { createTextField } from "/static/js/input.js";

const UserDefinedColorType = Object.freeze({
  USERCOLOR_PRIMARY: 0,
  USERCOLOR_ACCENT: 1,
  USERCOLOR_BACKGROUND: 2
});

export class UserColor extends Color {
    constructor(colorType = UserDefinedColorType.USERCOLOR_PRIMARY) {
        super("UserColor");
        this.colorType = colorType;
    }

    clone() {
        const cloned = new UserColor();
        Object.assign(cloned, this);
        
        return cloned;
    }
    
    static userColors = [
        "#ffffff", // Primary
        "#ff0000", // Accent
        "#000000"  // Background
    ];

    static getDefault() {
        return new StaticColor();
    }

    getColor() { return UserColor.userColors[this.colorType]; }

    blend(color, blend) { /* cant change the user colors */ }

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
                selectedIndex: 3,
                images: colorTypes.map(color => color.image),
            });
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
        colorSwatch.className = "color-swatch";
        colorSwatch.style.backgroundColor = this.getColor();
        colorPreview.appendChild(colorSwatch);

        const colorHexProperty = createTextField(this, 'color', onChange);
        colorHexProperty.style.flex = "1";
        propertyObject.appendChild(colorHexProperty);

        return propertyObject;
    }
};

Color.registry.set("UserColor", UserColor);