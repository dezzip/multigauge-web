import { Point } from "/static/js/core/geometry/Point.js";

export const Rotation = Object.freeze({
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3,
});

export const BoxAlignment = Object.freeze({
    TOP_LEFT: 0,
    TOP_CENTER: 1,
    TOP_RIGHT: 2,
    MIDDLE_LEFT: 3,
    MIDDLE_CENTER: 4,
    MIDDLE_RIGHT: 5,
    BOTTOM_LEFT: 6,
    BOTTOM_CENTER: 7,
    BOTTOM_RIGHT: 8
});

export const LengthAlignment = Object.freeze({
    LENGTH_OUTER: -1,
    LENGTH_CENTER: 0,
    LENGTH_INNER: 1
});

export const Orientation = Object.freeze({
    HORIZONTAL: 0,
    VERTICAL: 1
});

export function alignLength(start, length, alignment = LengthAlignment.LENGTH_CENTER, lowestFirst = false) {
    switch(alignment) {
        case LengthAlignment.LENGTH_OUTER:
            return lowestFirst ? [start - length, start] : [start, start - length];

        case LengthAlignment.LENGTH_CENTER: {
            const halfLength = length / 2;
            return [start - halfLength, start + halfLength];
        }

        case LengthAlignment.LENGTH_INNER:
            return [start, start + length];

        default:
            return [start, start];
    }
}

export function lengthAlignmentsToBox(horizontal, vertical) {
    switch(horizontal) {
        case LengthAlignment.LENGTH_OUTER: // LEFT
            switch(vertical) {
                case LengthAlignment.LENGTH_OUTER: return BoxAlignment.TOP_LEFT;
                case LengthAlignment.LENGTH_CENTER: return BoxAlignment.MIDDLE_LEFT;
                case LengthAlignment.LENGTH_INNER: return BoxAlignment.BOTTOM_LEFT;
                default: return BoxAlignment.TOP_LEFT;
            }

        case LengthAlignment.LENGTH_CENTER: // CENTER
            switch(vertical) {
                case LengthAlignment.LENGTH_OUTER:  return BoxAlignment.TOP_CENTER;
                case LengthAlignment.LENGTH_CENTER: return BoxAlignment.MIDDLE_CENTER;
                case LengthAlignment.LENGTH_INNER:  return BoxAlignment.BOTTOM_CENTER;
                default: return BoxAlignment.TOP_CENTER;
            }

        case LengthAlignment.LENGTH_INNER: // RIGHT
            switch(vertical) {
                case LengthAlignment.LENGTH_OUTER:  return BoxAlignment.TOP_RIGHT;
                case LengthAlignment.LENGTH_CENTER: return BoxAlignment.MIDDLE_RIGHT;
                case LengthAlignment.LENGTH_INNER:  return BoxAlignment.BOTTOM_RIGHT;
                default: return BoxAlignment.TOP_RIGHT;
            }
        
        default:
            return BoxAlignment.TOP_LEFT;
    }
}

export function alignPoint(x, y, width, height, alignment) {
    switch (alignment) {
        case BoxAlignment.TOP_LEFT:
            return new Point(x, y);
        case BoxAlignment.TOP_CENTER:
            return new Point(x - width / 2, y);
        case BoxAlignment.TOP_RIGHT:
            return new Point(x - width, y);
        case BoxAlignment.MIDDLE_LEFT:
            return new Point(x, y - height / 2);
        case BoxAlignment.MIDDLE_CENTER:
            return new Point(x - width / 2, y - height / 2);
        case BoxAlignment.MIDDLE_RIGHT:
            return new Point(x - width, y - height / 2);
        case BoxAlignment.BOTTOM_LEFT:
            return new Point(x, y - height);
        case BoxAlignment.BOTTOM_CENTER:
            return new Point(x - width / 2, y - height);
        case BoxAlignment.BOTTOM_RIGHT:
            return new Point(x - width, y - height);
        default:
            return new Point(x, y); // Default to TOP_LEFT if alignment is unknown
    }
}