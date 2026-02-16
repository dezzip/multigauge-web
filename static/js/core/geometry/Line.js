export class Line {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    intersection(other) {

    }

    slopeIntersection(other) {

    }

    equals(other) { return this.p1.equals(other.p1) && this.p2.equals(other.p2); }

    add(other) { return new Line(this.p1.add(other.p1), this.p2.add(other.p2)); }

    subtract(other) { return new Line(this.p1.subtract(other.p1), this.p2.subtract(other.p2)); }

    multiply(scalar) { return new Line(this.p1.multiply(scalar), this.p2.multiply(scalar)); }

    divide(scalar) { return new Line(this.p1.divide(scalar), this.p2.divide(scalar)); }

    reversed() { return new Line(this.p2, this.p1); }

    isHorizontal() { return this.p1.y === this.p2.y; }

    isVertical() { return this.p1.x === this.p2.x; }

    angle() { return this.p1.angleTo(p2); }

    midpoint() { return this.p1.midpoint(p2); }

    length() { return this.p1.distance(this.p2); }
}