import { lerp } from "/static/js/utils.js"

export class Value {
    constructor(name, value, minimumValue, maximumValue, unitType, tag = null) {
        this.name = name;
        this.value = value;
        this.minimumValue = minimumValue;
        this.maximumValue = maximumValue;
        this.unitType = unitType;

        this.history = [];
        this.historyLength = 5000;

        Value.allValues.push(this);

        // Add the value with the tag to the 
        if (Value.valuesMap.has(tag)) {
            const array = Value.valuesMap.get(tag);
            array.push(this);
        } else {
            Value.valuesMap.set(tag, [this]);
        }
    }

    static allValues = [];

    static valuesMap = new Map();

    getMenuOptions() {
        const result = [];

        for (const [tag, options] of Value.valuesMap.entries()) {
            if (tag === null) {
                for (const option of options) {
                    console.log(option);
                    result.push(option.getMenuOption());
                }
                result.push({ /* Divider */ });
            } else {
                result.push({
                    name: tag,
                    options: options.map(v => v.getMenuOption())
                });
            }
        }
        
        return result;
    }

    getMenuOption() {
        return { name: this.getName(), value: this }
    }

    getIndex() {
        return Value.allValues.indexOf(this);
    }

    getAtIndex(index) {
        return Value.allValues[index];
    }

    getValueRaw() { return this.value; }

    setValueRaw(newValue) {
        this.value = Math.min(Math.max(newValue, this.minimumValue), this.maximumValue);

        const now = Date.now();
        this.history.push({ time: now, value: this.value});
        this.removeExpiredHistory(now);
    }

    getValue(unit) { return this.unitType.getUnit(unit).convertFromBase(this.value); }

    setValue(newValue, unit) { this.setValueRaw(this.unitType.getUnit(unit).convertToBase(newValue)); }

    getInterpolationValue() {
        if (this.minimumValue === this.maximumValue) return 0.5;
        return (this.value - this.minimumValue) / (this.maximumValue - this.minimumValue);
    }

    getMinimumRaw() { return this.minimumValue; }

    getMaximumRaw() { return this.maximumValue; }

    setMinimumRaw(newMinimum) {
        this.minimumValue = Math.min(newMinimum, this.maximumValue);
        this.value = Math.max(this.value, this.minimumValue);
    }

    setMaximumRaw(newMaximum) {
        this.maximumValue = Math.max(newMaximum, this.minimumValue);
        this.value = Math.min(this.value, this.maximumValue);
    }

    getMinimum(unit) { return this.unitType.convertFromBase(this.minimumValue, unit); }

    getMaximum(unit) { return this.unitType.convertFromBase(this.maximumValue, unit); }

    setMinimum(newMinimum, unit) { this.setMinimumRaw(this.unitType.convertToBase(newMinimum, unit)); }

    setMaximum(newMaximum, unit) { this.setMaximumRaw(this.unitType.convertToBase(newMaximum, unit)); }

    getName() { return this.name; }

    getValueString(unit, abbreviation = false) {
        let valueString = this.value.toFixed(this.unitType.getDecimalPlaces(unit));
        if (abbreviation) valueString += this.unitType.getAbbreviation(unit);
        return valueString;
    }

    getUnitType() { return this.unitType; }

    getMaxString(unit, abbreviation = false) {
        let roundedValue = Math.round(this.maximumValue * Math.pow(10, this.unitType.getDecimalPlaces(unit))) / Math.pow(10, this.unitType.getDecimalPlaces(unit));
        return abbreviation
            ? `${roundedValue}${this.unitType.getAbbreviation(unit)}`
            : roundedValue.toFixed(this.unitType.getDecimalPlaces(unit));
    }

    /* History */
    removeExpiredHistory(currentTime) {
        const cutoff = currentTime - this.historyLength;
        while(this.history.length && this.history[0].time < cutoff) this.history.shift();
    }

    getHistoryAt(time) {
        if (this.history.length === 0) return this.value;

        if (time <= this.history[0].time) return this.minimumValue;

        if (time >= this.history[this.history.length - 1].time) return this.history[this.history.length - 1].value;

        for (let i = 1; i < this.history.length; i++) {
            if (this.history[i].time >= time) {
                const t0 = this.history[i - 1].time;
                const t1 = this.history[i].time;
                const v0 = this.history[i - 1].value;
                const v1 = this.history[i].value;

                const tNorm = (time - t0) / (t1 - t0); // normalized [0..1]
                return lerp(v0, v1, tNorm);
            }
        }

        // Fallback, should not happen:
        return this.history[this.history.length - 1].value;
    }

    getInterpolatedHistoryAt(time) {
        const rawValue = this.getHistoryAt(time);
        return (rawValue - this.minimumValue) / (this.maximumValue - this.minimumValue);
    }
}

import { temperatureUnitType, revolutionsUnitType, pressureUnitType, velocityUnitType, volumeUnitType, distanceUnitType } from "/static/js/core/units/UnitType.js";

// RPM
const engineRPM = new Value("RPM", 0, 0, 8000, revolutionsUnitType, "Engine");

// Temperatures
const engineCoolantTemp = new Value("Coolant Temp", 0, -40, 120, temperatureUnitType, "Engine");
const engineOilTemp = new Value("Oil Temp", 0, -40, 120, temperatureUnitType, "Engine");
const transmissionTemp = new Value("Transmission Temp", 0, -40, 120, temperatureUnitType, "Transmission");

// Pressures
const engineOilPressure = new Value("Oil Pressure", 0, 0, 100, pressureUnitType, "Engine");
const transmissionFluidPressure = new Value("Transmission Fluid Pressure", 0, 0, 100, pressureUnitType, "Transmission");
const fuelPressure = new Value("Fuel Pressure", 0, 0, 100, pressureUnitType, "Fuel");
const boostPressure = new Value("Boost Pressure", 0, 0, 100, pressureUnitType, "Engine");

// Distances
const distanceDriver = new Value("Distance Driven", 0, 0, 100000, distanceUnitType, "Motion");

// Velocities
const speed = new Value("Speed", 0, 0, 160, velocityUnitType, "Motion");

// Volumes
const fuelLevel = new Value("Fuel Level", 8, 0, 12, volumeUnitType, "Fuel");

// Store all values in an array
export const availableValues = [engineRPM, engineCoolantTemp, engineOilTemp, engineOilPressure, fuelPressure, speed];

let simulatedSpeed = 0;
let simulatedRPM = 0;
let throttle = 0.5;

let simulationTime = 0; // simulation time in ms
let lastFrameTime = performance.now();
let simulationPaused = false;

function pauseSimulation() {
    simulationPaused = true;
}

function resumeSimulation() {
    simulationPaused = false;
    lastFrameTime = performance.now(); // reset to avoid large time jump
}

export function runSimulation() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    if (!simulationPaused) {
        simulationTime += deltaTime;
    }

    const timeSeconds = simulationTime / 1000;
    const delta = 0.016; // fixed simulation tick, or could use deltaTime / 1000

    // Simulate throttle oscillation (simulate driver input)
    throttle = 0.4 + 0.3 * Math.sin(simulationTime * 0.0005);

    // RPM responds to throttle and speed
    simulatedRPM = 800 + throttle * 6000 + Math.sin(simulationTime * 0.002) * 200;

    // Speed follows throttle slowly
    const acceleration = (throttle - 0.2) * 10;
    simulatedSpeed += acceleration * delta;
    simulatedSpeed = Math.max(0, Math.min(simulatedSpeed, 160));

    // Oil pressure increases with RPM
    const oilPressure = 20 + (simulatedRPM / 8000) * 80;

    // Coolant and oil temperature rise gradually
    const warmUpRate = throttle * 0.1;
    const maxTemp = 100;
    engineCoolantTemp.setValueRaw(Math.min(maxTemp, engineCoolantTemp.getValueRaw() + warmUpRate));
    engineOilTemp.setValueRaw(Math.min(maxTemp, engineOilTemp.getValueRaw() + warmUpRate * 1.2));

    // Fuel pressure drops under load
    const fuelPress = 45 - throttle * 2 + Math.sin(simulationTime * 0.003) * 0.5;

    // Set values
    engineRPM.setValueRaw(simulatedRPM);
    speed.setValueRaw(simulatedSpeed);
    engineOilPressure.setValueRaw(oilPressure);
    fuelPressure.setValueRaw(fuelPress);

    const line = availableValues.map(value => `${value.name}: ${value.getValueString(-1)}`).join(" | ");
    // console.log(line);
}

const simulationPlayButton = document.getElementById("simulationPlayButton");

if (simulationPlayButton) {
    simulationPlayButton.addEventListener("click", () => {
        const simulationPlayIcon = document.getElementById("simulationPlayIcon");
        if (simulationPaused) {
            resumeSimulation();
            simulationPlayIcon.src = "/static/images/play.png";
        } else {
            pauseSimulation();
            simulationPlayIcon.src = "/static/images/pause.png";
        }
    });
}