import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { ColorKeyframe } from "/static/js/core/colors/ColorKeyframe.js";

import menuStack from "/static/js/editor/MenuStack.js";

export class ColorTimeline {
    constructor(gaugeValue = null, keyframes = null) {
        this.displayStart = 0;
        this.displayEnd = 1;

        this.gaugeValue = gaugeValue;

        this.keyframes = keyframes || [
            new ColorKeyframe(new StaticColor("#FFFFFF"), this.displayStart, true, gaugeValue),
            new ColorKeyframe(new StaticColor("#FFFFFF"), this.displayEnd, true, gaugeValue)
        ];

        if (gaugeValue != null) gaugeValue.subscribe(this);
    }

    clone(gaugeValue = null) {
        const cloned = Object.assign(new ColorTimeline(), this);
        
        cloned.gaugeValue = gaugeValue;
        if (cloned.gaugeValue != null) cloned.gaugeValue.subscribe(this);
        
        cloned.keyframes = this.keyframes.map(keyframe => keyframe.clone());

        return cloned;
    }
    
    static getDefault() {
        return new ColorTimeline();
    }

    static fromJSON(json, gaugeValue = null) {
        const colorTimeline = Object.assign(new ColorTimeline(), json);

        colorTimeline.gaugeValue = gaugeValue;
        if (gaugeValue != null) gaugeValue.subscribe(colorTimeline);

        if (Array.isArray(json.keyframes)) {
            colorTimeline.keyframes = json.keyframes.map((keyframe) => ColorKeyframe.fromJSON(keyframe));
        } else {
            colorTimeline.keyframes = [];
        }

        return colorTimeline;
    }

    blend(color, blend) { this.keyframes.forEach((keyframe) => { keyframe.blend(color, blend); })}

    changeDisplay(start, end) {
        const oldStart = this.displayStart
        const oldEnd = this.displayEnd

        const oldRange = oldEnd - oldStart;
        const newRange = end - start;

        this.keyframes.forEach((keyframe) => {
            // Get the position as a normalized value from 0 to 1
            const keyframePositionNormal = (keyframe.value - oldStart) / oldRange;
    
            // Set the new position using the new range and start
            keyframe.value = start + keyframePositionNormal * newRange;
        });

        this.displayStart = start;
        this.displayEnd = end;
    }

    getColor(position) {
        if (this.keyframes.length === 0) return "#000000";

        // If there is only one keyframe, return the color (either lower or upper bound)
        if (position <= this.keyframes[0].value) return this.keyframes[0].getColor();

        // Upper bound color
        if (position >= this.keyframes[this.keyframes.length - 1].value) return this.keyframes[this.keyframes.length - 1].getColor();

        // Find the appropriate keyframes to interpolate between
        for (let i = 1; i < this.keyframes.length; ++i) {
            if (position <= this.keyframes[i].value) {
                return this.keyframes[i - 1].getInterpolatedColor(this.keyframes[i], position);
            }
        }

        // Fail-safe, return black
        return "#000000";
    }

    getStartEndPositions() {
        if (this.keyframes.length === 0) return [0, 0];

        if (this.keyframes.length === 1) return [this.keyframes[0].value, this.keyframes[0].value];

        return [this.keyframes[0].value, this.keyframes[this.keyframes.length - 1].value];
    }

    addKeyframe(keyframe) {
        this.keyframes.push(keyframe);

        this.sortKeyframes();
    }

    sortKeyframes() {
        this.keyframes.sort((a,b) => {
            if (a.value < b.value) {
                return -1;
            } else {
                return 1;
            }
        });
    }

    getRange() { return this.displayEnd - this.displayStart; }

    getValueAtPosition(position) { return position * this.getRange() + this.displayStart; }

    getPositionAtValue(value) { return (value - this.displayStart) / this.getRange(); }

    addPanels(menu, onChange = null, obj, propertyName) {
        const gradientPanel = menu.addPanel("Gradient");
        
        const gradientRow = gradientPanel.addRow().addInput("gradient", this, 'keyframes', {
            onChange: () => {
                stopsList.render();
                if (typeof onChange === 'function') onChange();
            }
        });

        const stopsList = gradientPanel.addList(this, 'keyframes', {
            objectType: ColorKeyframe,
            label: "Keyframe",
            onChange: () => {
                gradientRow.render();
                if (typeof onChange === 'function') onChange();
            },
            sortMethod: (a, b) => a.value - b.value,
            onAdd: (keyframe) => {
                console.log(this.keyframes);
                if (this.keyframes.length === 0) return;

                if (this.keyframes.length === 1) {
                    keyframe.value = (this.keyframes[0].value < (this.displayStart + this.displayEnd) / 2) ? this.displayEnd : this.displayStart;
                } else {
                    if (stopsList.selectedIndex === this.keyframes.length - 1) { 
                        keyframe.value = (this.keyframes[this.keyframes.length - 1].value + this.keyframes[this.keyframes.length - 2].value) / 2;
                    } else {
                        keyframe.value = (this.keyframes[stopsList.selectedIndex].value + this.keyframes[stopsList.selectedIndex + 1].value) / 2;
                    }
                }
            },
            onRemove: (keyframe) => {
                menuStack.closeFrom(keyframe.color);
            },
            selectable: true
        });
    }

    getGradient() {
        if (this.keyframes.length <= 1) return this.keyframes.length === 1 ? this.keyframes[0].getColor() : "#000000";

        let gradientStops = [];
        
        for (let i = 0; i < this.keyframes.length; i++) {
            const keyframe = this.keyframes[i];
            const position = this.getPositionAtValue(keyframe.value) * 100;
            const color = keyframe.getColor();
            
            gradientStops.push(`${color} ${position}%`);

            if (i < this.keyframes.length - 1 && !keyframe.smoothed) {
                // If smoothed is false, extend current color up to the next keyframe
                const nextKeyframe = this.keyframes[i + 1];
                const nextPosition = this.getPositionAtValue(nextKeyframe.value) * 100;
                gradientStops.push(`${color} ${nextPosition}%`);
            }
        }

        return `linear-gradient(to right, ${gradientStops.join(", ")})`;
    }
    
    createObjectPropertyField(obj, propertyName, onChange = null) {
        const propertyObject = document.createElement("div");

        // Create the color preview square
        const colorPreview = document.createElement("div");
        colorPreview.className = "gradient-preview";

        const colorSwatch = document.createElement("div");
        colorSwatch.className = "color-swatch";
        colorSwatch.style.backgroundColor = "#ffffff";
        colorPreview.appendChild(colorSwatch);

        const updateGradient = () => {
            colorSwatch.style.background = this.getGradient();
        };

        colorPreview.addEventListener("click", () => {
            const rect = colorPreview.getBoundingClientRect();

            menuStack.openProperty(obj, propertyName, onChange, rect.left, rect.top);
        });

        propertyObject.appendChild(colorPreview);

        updateGradient();

        return propertyObject;
    }

    toJSON() {
        const { gaugeValue, ...rest } = this;

        return rest;
    }
};