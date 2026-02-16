import { loadFromRegistry } from "/static/js/utils.js";

export class LinearElement {
    constructor(type) {
        this.type = type;

        this.visible = true;
    }

    static image = '/static/images/circular.png';
    static name = "Linear Element";
    static previewGif = null;

    static registry = new Map();
    
    static fromJSON(json) {
        return loadFromRegistry(this.registry, json);
    }

    draw(canvas, context, gaugeValue, x, y, alignment, length, orientation, reverseDirection) {
        throw new Error("draw() must be implemented in derived class");
    }

    toJSON() {
        const { image, ...rest } = this;
        return rest;
    }
}
