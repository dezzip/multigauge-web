import { Color } from "/static/js/core/colors/Color.js";
import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";

import { CircularGauge } from "/static/js/core/gauge/gauge-elements/CircularGauge.js";
import { LinearGauge } from "/static/js/core/gauge/gauge-elements/LinearGauge.js";
import { Graph } from "/static/js/core/gauge/gauge-elements/Graph.js"
import { RollOdometer } from "/static/js/core/gauge/gauge-elements/RollOdometer.js";
import { Group } from "/static/js/core/gauge/gauge-elements/Group.js";
import { Circle } from "/static/js/core/gauge/gauge-elements/primitives/Circle.js";
import { Rectangle } from "/static/js/core/gauge/gauge-elements/primitives/Rectangle.js";

import { StaticColor } from "/static/js/core/colors/StaticColor.js";

/**
 * Represents a Gauge Face, which determines how a gauge is displayed/behaves.
 * 
 * GaugeFaces are made up of GaugeElements, which make up the individual elements
 * the design. Besides also drawing the background, the GaugeFace only serves as a
 * container for the GaugeElements to be drawn in a specific order.
 */
export class GaugeFace {
    constructor() {
        this.type = "GaugeFace";

        this.title = "My Gauge Face";
        this.description = "No description.";

        this.resolution_x = 240;
        this.resolution_y = 240;
        this.circular = true;

        this.backgroundColor = new StaticColor(); // Default background color

        this.elements = [];
    }

    static image = "/static/images/gauge.png";
    static name = "Gauge Face";
    static previewGif = null;

    /** Reconstructs a GaugeFace object from a JSON object.
     * 
     * @param {Object} json The JSON object to load from.
     * @returns {GaugeFace} The deserialized GaugeFace instance.
     * @throws {Error} If the JSON is invalid or missing required fields.
     */
    static fromJSON(json) {
        if (!json) throw new Error("Invalid JSON: missing data");

        const gaugeFace = Object.assign(new GaugeFace(), json);

        // Deserialize the background color
        if (json.backgroundColor) {
            gaugeFace.backgroundColor = Color.fromJSON(json.backgroundColor);
        }

        // Deserialize elements
        if (Array.isArray(gaugeFace.elements)) {
            gaugeFace.elements = gaugeFace.elements.map((element) => GaugeElement.fromJSON(element));
        }

        // Deserialize elements if necessary (add similar logic for elements if they need deserialization)
        return gaugeFace;
    }

    /** Draws the GaugeFace on a canvas.
     * 
     * @param {HTMLCanvasElement} canvas The HTML canvas on which to draw the GaugeFace.
     * @param {CanvasRenderingContext2D} context The 2D drawing context of the canvas.
     */
    draw(canvas, context) {
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Scale the canvas to match the resolution
        let scaleX = canvas.width / this.resolution_x;
        let scaleY = canvas.height / this.resolution_y;

        context.setTransform(scaleX, 0, 0, scaleY, 0, 0);

        context.fillStyle = this.backgroundColor.getColor();
        context.fillRect(0, 0, this.resolution_x, this.resolution_y);

        for (const element of this.elements) {
            element.draw(canvas, context);
        }
    }

    update() {
        for (const element of this.elements) {
            if (typeof element.update === 'function') element.update();
        }
    }

    addElement(element) { this.elements.push(element); }

    removeElement(index) { this.elements.splice(index, 1);}

    getInsertOptions() {
        return [
            { elementType: CircularGauge },
            { elementType: LinearGauge   },
            { /* Divider */},
            { elementType: Group         },
            { /* Divider */},
            { elementType: Graph         },
            { elementType: RollOdometer  },
            { /* Divider */},
            { elementType: Circle        },
            { elementType: Rectangle     }
        ];
    }

    addPanels(menu) {
        const infoPanel = menu.addPanel("Info");
        infoPanel.addRow("Title", "Other Title").addInput("text", this, 'title')
        infoPanel.addRow("Description").addInput("text", this, 'description');
        
        menu.addPanel("Background").addRow().addObjectProperty(this, 'backgroundColor', null, false);
    }

    toJSON() {
        // Ignore the image property in the JSON output
        const { image, ...rest } = this;

        return rest;
    }
}