
import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";


import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { drawCircle } from "/static/js/draw.js";

import { GrabPoint } from "/static/js/editor/GrabPoint.js";

export class Circle extends GaugeElement {
    constructor() {
        super("Circle");

        this.x = 120;
        this.y = 120;
        this.radius = 50;
        this.fillStroke = new FillStroke();
    }

    clone() {
        const cloned = new Circle();
        Object.assign(cloned, this);
        
        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Circle";
    static description = "Circle.";
    static previewGif = "/static/images/preview-gifs/placeholder.gif";

    static fromJSON(json) {
        const circle = Object.assign(new Circle(), json);
    
        circle.fillStroke = FillStroke.fromJSON(json.fillStroke);

        return circle;
    }
    
    draw(canvas, context) {
        if (this.visible) {
            drawCircle(canvas, context, this.x, this.y, this.radius, this.fillStroke);
        }
    }
    
    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        positionPanel.addRow("Radius")
            .addInput("radius", this, 'radius');

        menu.addPanel("Color").addRow().addObjectProperty(this, 'fillStroke');
    }

    createGrabPoints() {
        return [
            new GrabPoint(this, "x", "y")
        ];
    }
}

GaugeElement.registry.set("Circle", Circle);