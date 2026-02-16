import { blendColors } from "/static/js/draw.js";
import { loadFromRegistry } from "/static/js/utils.js";

export class Color {
    constructor(type) {
        this.type = type;
    }

    // Initialize the static registry property
    static registry = new Map();

    static fromJSON(json) {
        return loadFromRegistry(this.registry, json);
    }

    getColor() { throw new Error("getColor() must be implemented by subclasses"); }

    getBlendColor(blendColor, alpha) {
        return blendColors(alpha, this.getColor(), blendColor instanceof Color ? blendColor.getColor() : blendColor);
    }

    blend(color, blend) { throw new Error("blend() must be implemented by subclasses"); }
};