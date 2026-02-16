export const RadiusAlignment = Object.freeze({
    RADIUS_OUTER: 0,
    RADIUS_CENTER: 1,
    RADIUS_INNER: 2
});

export class Radii {
    constructor(outerRadius, innerRadius) {
        this.outer = outerRadius;
        this.inner = innerRadius;
    }
}

export function alignRadius(radius, length, alignment) {
    switch (alignment) {
        case RadiusAlignment.RADIUS_OUTER:
            return new Radii(radius, radius - length + 1);

        case RadiusAlignment.RADIUS_CENTER:
            return new Radii(radius + (length / 2.0) - 0.5, radius - (length / 2.0) + 0.5);

        case RadiusAlignment.RADIUS_INNER:
            return new Radii(radius - length + 1, radius);

        default:
            return new Radii(radius, radius); // Failsafe
    }
}