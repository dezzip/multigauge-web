import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";
import { Point } from "/static/js/core/geometry/Point.js";

import { CircularGauge } from "/static/js/core/gauge/gauge-elements/CircularGauge.js";
import { LinearGauge } from "/static/js/core/gauge/gauge-elements/LinearGauge.js";
import { Graph } from "/static/js/core/gauge/gauge-elements/Graph.js"
import { RollOdometer } from "/static/js/core/gauge/gauge-elements/RollOdometer.js";
import { Circle } from "/static/js/core/gauge/gauge-elements/primitives/Circle.js";
import { Rectangle } from "/static/js/core/gauge/gauge-elements/primitives/Rectangle.js";

export class Group extends GaugeElement {
    constructor() {
        super("Group");
        this.elements = [];
    }

    clone() {
        const cloned = new CircularGauge();

        cloned.elements = this.elements.map(el => el.clone());

        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Group";
    static description = "Container for multiple gauge elements.";
    static previewGif = "/static/images/preview-gifs/placeholder.gif";

    static fromJSON(json) {

    }
    
    draw(canvas, context) {
        if (!this.visible) return;

        for (const element of this.elements) {
            element.draw(canvas, context, this.x, this.y, this.scaleX, this.scaleY);
        }
    }
    
    addElement(element) { this.elements.push(element); }

    removeElement(index) { this.elements.splice(index, 1);}

    addPanels(menu) {
    }

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

    createGrabPoints() {
        return [
        ];
    }
}

GaugeElement.registry.set("Group", Group);