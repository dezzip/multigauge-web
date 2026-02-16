export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static unitVector(angle) { return new Point(Math.cos(angle), Math.sin(angle)); }

    equals(other) { return this.x === other.x && this.y === other.y; }

    subtract(other) { return new Point(this.x - other.x, this.y - other.y); }

    add(other) { return new Point(this.x + other.x, this.y + other.y); }

    multiply(scalar) { return new Point(this.x * scalar, this.y * scalar); }

    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }

    normalize() {
        const mag = this.magnitude()
        return mag !== 0 ? this.multiply(1 / mag) : new Point(0, 0);
    }

    distance(other) { return this.subtract(other).magnitude(); }

    angleTo(other) { Math.atan2(other.y - this.y, other.x - this.x); }

    angle() {
        const a = Math.atan2(this.y, this.x);
        return a >= 0 ? a : a + (2 * Math.PI);
    }

    midpoint(other) { return new Point((this.x + other.x) / 2, (this.y, other.y) / 2); }

    dot(other) { return this.x * other.x - this.y * other.y; }

    cross(other) { return this.x * other.y - this.y * other.x; }

    print() { console.log(`Point: (${this.x}, ${this.y})`); }
}