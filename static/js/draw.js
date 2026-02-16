import { Orientation, alignPoint, alignLength, lengthAlignmentsToBox } from "/static/js/core/geometry/alignments.js";

function blendColors(alpha, color1, color2) {
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    };
  
    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
  
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
  
    const blendedRgb = {
        r: Math.round(rgb1.r * (1 - alpha) + rgb2.r * alpha),
        g: Math.round(rgb1.g * (1 - alpha) + rgb2.g * alpha),
        b: Math.round(rgb1.b * (1 - alpha) + rgb2.b * alpha),
    };
  
    return rgbToHex(blendedRgb.r, blendedRgb.g, blendedRgb.b);
}

export function fillStrokeArc(canvas, context, x, y, radius, startAngle, endAngle, thickness, alignment, fillStroke) {
    const radii = alignLength(radius, thickness, alignment);

    startAngle *= (Math.PI / 180);
    endAngle *= (Math.PI / 180);

    context.beginPath()
    context.arc(x, y, radii[1], startAngle, endAngle, false);
    context.arc(x, y, radii[0], endAngle, startAngle, true);

    if (fillStroke.fill) {
        context.fillStyle = fillStroke.fill.getColor();
        context.fill();
    }

    if (fillStroke.stroke) {
        context.strokeStyle = fillStroke.stroke.getColor();
        context.lineWidth = fillStroke.stroke.thickness;
        context.stroke();
    }
}

function drawCircle(canvas, context, x, y, r, fillStroke) {
    context.beginPath();

    context.arc(x, y, r, 0, 2 * Math.PI);

    if (fillStroke.fill) {
        context.fillStyle = fillStroke.fill.getColor();
        context.fill();
    }

    if (fillStroke.stroke) {
        context.strokeStyle = fillStroke.stroke.color.getColor();
        context.lineWidth = fillStroke.stroke.thickness;
        context.stroke();
    }
}

function drawWideLine(canvas, context, x0, y0, x1, y1, w, fillStroke) {
    context.beginPath();

    context.moveTo(x0, y0);
    context.lineTo(x1, y1);

    if (fillStroke.stroke) {
        context.lineCap = "round";
        context.strokeStyle = fillStroke.stroke.color.getColor();
        context.lineWidth = w + fillStroke.stroke.thickness;

        context.stroke();
    }

    if (fillStroke.fill) { 
        context.strokeStyle = fillStroke.fill.getColor();
        context.lineWidth = w;

        context.stroke();
    }
}

export function fillStrokeRectangleBoxAligned(canvas, context, x, y, width, height, cornerRadius, boxAlignment, fillStroke) {
    if (width <= 0 || height <= 0) return;
    
    const point = alignPoint(x, y, width, height, boxAlignment);

    context.beginPath();
    context.roundRect(point.x, point.y, width, height, cornerRadius);

    if (fillStroke.fill) {
        context.fillStyle = fillStroke.fill.getColor();
        context.fill();
    }

    if (fillStroke.stroke) {
        context.strokeStyle = fillStroke.stroke.getColor();
        context.lineWidth = fillStroke.stroke.thickness;
        context.stroke();
    }
}

export function fillStrokeRectangleHVAligned(canvas, context, x, y, width, height, cornerRadius, horizontal, vertical, fillStroke) {
    const alignment = lengthAlignmentsToBox(horizontal, vertical);

    fillStrokeRectangleBoxAligned(canvas, context, x, y, width, height, cornerRadius, alignment, fillStroke);
}

export function fillStrokeRectangleOrientation(canvas, context, lengthComponent, thicknessComponent, length, thickness, cornerRadius, orientation, LengthAlignment, thicknessAlignment, fillStroke) {
    if (orientation = Orientation.HORIZONTAL) {
        fillStrokeRectangleHVAligned(canvas, context, lengthComponent, thicknessComponent, length, thickness, cornerRadius, LengthAlignment, thicknessAlignment, fillStroke);
    } else {
        fillStrokeRectangleHVAligned(canvas, context, thicknessComponent, lengthComponent, thickness, length, cornerRadius, thicknessAlignment, LengthAlignment, fillStroke);
    }
}

export { blendColors, drawCircle, drawWideLine };