import { Color } from "/static/js/core/colors/Color.js"; 
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { StaticColor } from "/static/js/core/colors/StaticColor.js"; 
import { ValueColor } from "/static/js/core/colors/ValueColor.js"; 
import { UserColor } from "/static/js/core/colors/UserColor.js"; 

import menuStack from "/static/js/editor/MenuStack.js";
import undoStack from "/static/js/editor/UndoStack.js";

import { onNodeRemoved } from "/static/js/utils.js";

export class CycleColor extends Color {
    constructor() {
        super("CycleColor");
        this.length = 1000;
        this.loop = true;

        this.timeline = new ColorTimeline(null, null, this);
        this.timeline.changeDisplay(0, this.length);
    }

    clone() {
        const cloned = new CycleColor();
        Object.assign(cloned, this);

        cloned.timeline = this.timeline.clone();
        
        return cloned;
    }

    static fromJSON(json) {
        const cycleColor = Object.assign(new CycleColor(), json);

        // Deserialize timeline
        if (json.timeline) {
            cycleColor.timeline = ColorTimeline.fromJSON(json.timeline);
        }

        return cycleColor;
    }

    blend(color, blend) { this.timeline.blend(color, blend); }

    getTime() {
        if (this.loop) {
            const time = Date.now() % (2 * this.length);
            return time < this.length ? time : 2 * this.length - time;
        }

        return Date.now() % this.length;
    }

    getColor() {
        return this.timeline.getColor(this.getTime());
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
                selectedIndex: 2,
                images: colorTypes.map(color => color.image),
            });

        menu.addPanel().addRow("Length", "Loop").addInput("length", this, 'length').addInput("buttonMenu", this, 'loop', { images: ['/static/images/loop_forward.png', '/static/images/loop_pingpong.png', '/static/images/loop_reverse.png']})

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
        colorLabel.textContent = "Cycle";
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

Color.registry.set("CycleColor", CycleColor);