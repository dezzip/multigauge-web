
import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";


import { FillStroke } from "/static/js/core/colors/FillStroke.js";
import { ColorTimeline } from "/static/js/core/colors/ColorTimeline.js";

import { fillStrokeRectangleBoxAligned } from "/static/js/draw.js";

import { GrabPoint } from "/static/js/editor/GrabPoint.js";

import { BoxAlignment } from "/static/js/core/geometry/alignments.js";

export class Rectangle extends GaugeElement {
    constructor() {
        super("Rectangle");

        this.x = 120;
        this.y = 120;
        this.width = 50;
        this.height = 50;

        this.alignment = BoxAlignment.MIDDLE_CENTER;
        
        this.fillStroke = new FillStroke();
    }

    clone() {
        const cloned = new Rectangle();
        Object.assign(cloned, this);
        
        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Rectangle";
    static description = "Rectangle.";
    static previewGif = "/static/images/preview-gifs/placeholder.gif";

    static fromJSON(json) {
        const rectangle = Object.assign(new Rectangle(), json);
    
        rectangle.fillStroke = FillStroke.fromJSON(json.fillStroke);

        return rectangle;
    }
    
    draw(canvas, context) {
        if (this.visible) {
            fillStrokeRectangleBoxAligned(canvas, context, this.x, this.y, this.width, this.height, 0, this.alignment, this.fillStroke)
        }
    }
    
    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        positionPanel.addRow("Width", "Height")
            .addInput("length", this, 'width')
            .addInput("length", this, 'height');

        menu.addPanel("Color").addRow().addObjectProperty(this, 'fillStroke');
    }

    createGrabPoints() {
        return [
            new GrabPoint(this, "x", "y")
        ];
    }
}

GaugeElement.registry.set("Rectangle", Rectangle);