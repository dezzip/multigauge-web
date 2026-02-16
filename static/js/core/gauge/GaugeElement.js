import { loadFromRegistry } from "/static/js/utils.js";

/**
 * Represents an element in a gauge.
 */
export class GaugeElement {
    constructor(type) {
        this.type = type;

        this.visible = true;
    }

    static image = null;
    static name = null;
    static previewGif = null;

    // Registry to load GaugeElements from JSON
    static registry = new Map();

    /** Reconstructs a GaugeElement object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {GaugeElement} The deserialized GaugeElement instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        return loadFromRegistry(this.registry, json);
    }
    
    /** Draws the GaugeElement on a canvas.
     * 
     * @param {HTMLCanvasElement} canvas The HTML canvas on which to draw the GaugeElement.
     * @param {CanvasRenderingContext2D} context The 2D drawing context of the canvas.
     */
    draw(canvas, context) {
        throw new Error("draw() must be implemented in derived class");
    }

    /** Converts the GaugeElement to a JSON object.
     * 
     * @returns {Object} The serialized JSON of the GaugeElement.
     */
    toJSON() {
        // Ignore the image property in the JSON output
        const { image, ...rest } = this;

        return rest;
    }
};