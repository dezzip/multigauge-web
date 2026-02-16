export class Unit {
    constructor(name, abbreviation, factor, offset, decimalPlaces, displayInterval) {
        this.name = name;
        this.abbreviation = abbreviation;
        this.factor = factor;
        this.offset = offset;
        this.decimalPlaces = decimalPlaces;
        this.displayInterval = displayInterval;
    }

    convertToBase(value) {
        return (value - this.offset) / this.factor;
    }

    convertFromBase(value) {
        return value * this.factor + this.offset;
    }
}