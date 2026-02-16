import { GaugeElement } from "/static/js/core/gauge/gaugeElement.js";
import { GaugeValue } from "/static/js/core/values/GaugeValue.js";
import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { Color } from "/static/js/core/colors/Color.js";

export class RollOdometer extends GaugeElement {
    constructor() {
        super("RollOdometer"); // No image, just a graphical display.
        this.x = 160;
        this.y = 160;
        this.gaugeValue = new GaugeValue();

        this.segments = 7;
        this.decimals = 2;

        this.primaryColor = new StaticColor("#FFFFFF");
        this.secondaryColor = new StaticColor("#000000");
    }

    clone() {
        const cloned = new RollOdometer();
        Object.assign(cloned, this);

        cloned.gaugeValue = this.gaugeValue.clone();

        cloned.primaryColor   = this.primaryColor.clone();
        cloned.secondaryColor = this.secondaryColor.clone();

        return cloned;
    }

    static image = '/static/images/circular.png';
    static name = "Roll Odometer";
    static description = "Rolling counter styled like a mechanical odometer.";
    static previewGif = null;

    static fromJSON(json) {
        const gauge = Object.assign(new RollOdometer(), json);

        gauge.gaugeValue = GaugeValue.fromJSON(json.gaugeValue);
        gauge.primaryColor = Color.fromJSON(json.primaryColor);
        gauge.secondaryColor = Color.fromJSON(json.secondaryColor);

        return gauge;
    }

    draw(canvas, ctx) {
        const val = this.gaugeValue.getValue();

        const segmentWidth = 18;
        const segmentHeight = 25;
        const padding = 2;
        const totalWidth = segmentWidth * this.segments + padding * (this.segments - 1);
        const xOffset = -totalWidth / 2;

        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = this.primaryColor.getColor();
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Outer border
        ctx.strokeRect(this.x + xOffset - padding, this.y - padding, totalWidth + (padding * 2), segmentHeight + (padding * 2));

        // Format value string
        let v = Math.floor(val * Math.pow(10, this.decimals + 1));
        let valueString = v.toString().slice(0, -1); // remove last digit
        valueString = valueString.padStart(this.segments, "0");

        const charArray = valueString.split("");

        for (let i = 0; i < this.segments; i++) {
            let boxColor = this.secondaryColor.getColor();
            let numberColor = this.primaryColor.getColor();

            const segmentValue = parseInt(charArray[i], 10);
            const segX = this.x + xOffset + (segmentWidth + padding) * i;
            let yOffset = 0;

            if (i >= this.segments - this.decimals) {
                boxColor = this.primaryColor.getColor();
                numberColor = this.secondaryColor.getColor();
            }

            if (i === this.segments - 1) {
                const interpolationValue = (val * Math.pow(10, -this.segments + this.decimals + 1 + i)) % 1;
                const interpolationWidth = 1;
                if (interpolationValue >= 1 - interpolationWidth) {
                    const interpolation = (interpolationValue - 1 + interpolationWidth) / interpolationWidth;
                    yOffset = -this.sharpstep(interpolation) * segmentHeight;
                }
            } else {
                const interpolationValue = (val * Math.pow(10, -this.segments + this.decimals + 2 + i)) % 10;
                const interpolationWidth = Math.pow(10, i - this.segments + 2);
                if (interpolationValue >= 10 - interpolationWidth) {
                    const interpolation = (interpolationValue - 10 + interpolationWidth) / interpolationWidth;
                    yOffset = -this.sharpstep(interpolation) * segmentHeight;
                }
            }

            // Draw segment box
            ctx.fillStyle = boxColor;
            ctx.fillRect(segX, this.y, segmentWidth, segmentHeight);

            // Draw current number
            ctx.fillStyle = numberColor;
            ctx.fillText(
                segmentValue.toString(),
                segX + segmentWidth / 2,
                this.y + segmentHeight / 2 + yOffset
            );

            // Draw next number
            ctx.fillText(
                ((segmentValue + 1) % 10).toString(),
                segX + segmentWidth / 2,
                this.y + segmentHeight / 2 + segmentHeight + yOffset
            );
        }

        // Draw unit label
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(this.gaugeValue.getUnitType().getAbbreviation(), this.x, this.y + segmentHeight + (padding * 2));
    }

    sharpstep(x) {
        return Math.max(0, Math.min(1, x));
    }

    addPanels(menu) {
        const positionPanel = menu.addPanel("Position");

        positionPanel.addRow("Position")
            .addInput("int", this, 'x')
            .addInput("int", this, 'y');

        const appearancePanel = menu.addPanel("Appearance");

        appearancePanel.addRow("Segments", "Decimals").addInput("length", this, 'segments').addInput("length", this, 'decimals');
        
        const colorsPanel = menu.addPanel("Appearance");
        colorsPanel.addRow("Primary").addObjectProperty(this, 'primaryColor');
        colorsPanel.addRow("Secondary").addObjectProperty(this, 'secondaryColor');

        this.gaugeValue.addPanels(menu);
    }
}


GaugeElement.registry.set("RollOdometer", RollOdometer);