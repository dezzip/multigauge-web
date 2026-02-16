import { Unit } from "/static/js/core/units/Unit.js";

export class UnitType {
    constructor(units, icon = "/static/images/units/unit_temperature.png") {
        this.units = units;
        this.defaultUnit = 0;

        this.icon = icon;
    }

    getUnit(index) {
        return this.units[index] || this.units[this.defaultUnit];
    }

    convertFromBase(value, index) {
        return this.getUnit(index).convertFromBase(value);
    }

    convertToBase(value, index) {
        return this.getUnit(index).convertToBase(value);
    }

    getAbbreviation(index) {
        return this.getUnit(index).abbreviation;
    }

    getDecimalPlaces(index) {
        return this.getUnit(index).decimalPlaces;
    }
}

export const temperatureUnitType = new UnitType([
    new Unit("Celsius", "°C", 1.0, 0.0, 2, 10.0),
    new Unit("Fahrenheit", "°F", 1.8, 32.0, 2, 20.0),
    new Unit("Kelvin", "K", 1.0, 273.15, 2, 10.0)
], "/static/images/units/unit_temperature.png");

export const distanceUnitType = new UnitType([
    new Unit("Meter", "m", 1.0, 0.0, 2, 100.0),
    new Unit("Foot", "ft", 3.28084, 0.0, 2, 100.0),
    new Unit("Kilometer", "km", 0.001, 0.0, 2, 1.0),
    new Unit("Mile", "mi", 0.00062137, 0.0, 1, 1.0)
], "/static/images/units/unit_distance.png");

export const pressureUnitType = new UnitType([
    new Unit("PSI", "psi", 1.0, 0.0, 1, 5.0),
    new Unit("Bar", "bar", 0.0689476, 0.0, 4, 1.0),
    new Unit("InHg", "inHg", 2.03602, 0.0, 1, 10.0),
    new Unit("KPa", "kPa", 6.89476, 0.0, 1, 50.0)
], "/static/images/units/unit_pressure.png");

export const velocityUnitType = new UnitType([
    new Unit("Kilometers per hour", "km/h", 1.0, 0.0, 2, 20.0),
    new Unit("Miles per hour", "mph", 0.621371, 0.0, 1, 20.0)
], "/static/images/units/unit_velocity.png");

export const accelerationUnitType = new UnitType([
    new Unit("Meters per second squared", "m/s²", 1.0, 0.0, 2, 5.0),
    new Unit("Feet per second squared", "ft/s²", 3.2808398950131, 0.0, 2, 10.0),
    new Unit("G-Force", "g", 0.10197162129779283, 0.0, 2, 1.0)
], "/static/images/units/unit_acceleration.png");

export const volumeUnitType = new UnitType([
    new Unit("Liter", "L", 1.0, 0.0, 2, 5.0),
    new Unit("Gallon", "gal", 0.264172, 0.0, 3, 1.0),
    new Unit("CC", "cc", 1000.0, 0.0, 0, 1000.0)
], "/static/images/units/unit_volume.png");

export const revolutionsUnitType = new UnitType([
    new Unit("RPM", "rpm", 1.0, 0.0, 0, 1000.0)
], "/static/images/units/unit_revolutions.png");

export const angleUnitType = new UnitType([
    new Unit("Degrees", "°", 1.0, 0.0, 0, 45.0)
]);

export const percentageUnitType = new UnitType([
    new Unit("Percent", "%", 1.0, 0.0, 1, 25.0)
]);

export const volumePerTimeUnitType = new UnitType([
    new Unit("Liters per hour", "L/h", 1.0, 0.0, 2, 1),
    new Unit("Milliliters per minute", "mL/min", 16.6666666667, 0.0, 1, 10),
    new Unit("Gallons per hour", "GPH", 0.264172, 0.0, 1, 1)
]);

export const timeUnitType = new UnitType([
    new Unit("Second", "s", 1.0, 0.0, 2, 15.0),
    new Unit("Minute", "min", 0.0166667, 0.0, 1, 15.0),
    new Unit("Hour", "hr", 0.00027777833333, 0.0, 1, 1.0)
],"/static/images/units/unit_time.png");