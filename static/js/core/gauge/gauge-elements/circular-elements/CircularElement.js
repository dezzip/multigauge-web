import { loadFromRegistry } from "/static/js/utils.js";

/**
 * Represents a single element in a circular gauge.
 * 
 * CircularElements are drawn as an arc length from a center position. They should
 * only be drawn from a parent CircularGauge, as they need to respect the displayed
 * values of their neighboring CircularElements.
 */
export class CircularElement {
    constructor(type) {
        this.type = type;

        this.visible = true;
    }

    static image = '/static/images/circular.png';
    static name = "Graph";
    static previewGif = null;

    static registry = new Map();
    
    /** Reconstructs a CircularElement object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {CircularElement} The deserialized CircularElement instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        return loadFromRegistry(this.registry, json);
    }

    /** Draws the CircularElement on a canvas.
     * 
     * @param {*} canvas The HTML canvas on which to draw the GaugeFace.
     * @param {*} context The 2D drawing context of the canvas.
     * @param {*} x The center X coordinate of the arc.
     * @param {*} y The center Y coordinate of the arc.
     * @param {*} angleStart The starting angle of the arc in degrees.
     * @param {*} angleEnd The ending angle of the arc in degrees.
     * @param {*} gaugeValue The value of to be displayed.
     */
    draw(canvas, context, x, y, angleStart, angleEnd, gaugeValue) {
        throw new Error("draw() must be implemented in derived class");
    }

    /** Converts the CircularElement to a JSON object.
     * 
     * @returns {Object} The serialized JSON of the CircularElement.
     */
    toJSON() {
        // Return an object excluding the image property
        const { image, ...rest } = this;
        return rest;
    }
}
