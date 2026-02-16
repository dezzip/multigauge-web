import { availableValues, Value } from "/static/js/core/values/Value.js";

export class GaugeValue {
    constructor(value = availableValues[0], unitIndex = -1, customMinimum = null, customMaximum = null) {
        this.value = value;
        this.unitIndex = unitIndex;

        this.customMinimum = customMinimum;
        this.customMaximum = customMaximum;

        this.observers = [];
    }

    clone() {
        const cloned = new GaugeValue();
        Object.assign(cloned, this);
        
        cloned.observers = [];

        return cloned;
    }

    static fromJSON(json) {
        const gaugeValue = Object.assign(new GaugeValue(), json);

        gaugeValue.value = Value.allValues.find(v => v.name === json.value);

        return gaugeValue;
    }

    subscribe(observer) {
        console.log("GaugeValue: Subscribing observer", observer);
        this.observers.push(observer);
        observer.changeDisplay(this.getMinimum(), this.getMaximum());
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    unsubscribeAll() {
        this.observers = [];
    }

    notify() {
        this.observers.forEach(observer => observer.changeDisplay(this.getMinimum(), this.getMaximum()))
    }

    getValueRaw() {
        // Use custom minimum and maximum if available; otherwise, use the `Value` object's limits
        const minimum = this.getMinimumRaw();
        const maximum = this.getMaximumRaw();

        return Math.min(Math.max(this.value.getValueRaw(), minimum), maximum);
    }
    
    getUnitType() { return this.value.getUnitType(); }
    
    getUnit() { return this.value.getUnitType().getUnit(this.unitIndex); }

    getValue() { return this.value.getUnitType().getUnit(this.unitIndex).convertFromBase(this.getValueRaw()); }

    getInterpolationValue() {
        const minimum = this.getMinimumRaw();
        const maximum = this.getMaximumRaw();

        // Prevent division by zero
        if (minimum === maximum) return 0.5;

        return (this.value.getValueRaw() - minimum) / (maximum - minimum);
    }

    getMinimumRaw() { return (this.customMinimum != null) ? this.customMinimum : this.value.getMinimumRaw(); }

    getMaximumRaw() { return (this.customMaximum != null) ? this.customMaximum : this.value.getMaximumRaw(); }

    getMinimum() { return this.value.getUnitType().getUnit(this.unitIndex).convertFromBase(this.getMinimumRaw()); }

    getMaximum() { return this.value.getUnitType().getUnit(this.unitIndex).convertFromBase(this.getMaximumRaw()); }

    getValueObject() { return this.value; }

    getValueString(abbreviation = false) { return this.value.getValueString(this.unitIndex, abbreviation); }

    addPanels(menu) {
        const valuePanel = menu.addPanel("Value");

        valuePanel.addRow("Display Value").addInput("menu", this, 'value', {
            onChange: () => {
                this.unitIndex = -1; // Set index back to default
                unitsRow.setVisible(this.value.unitType.units.length > 1);
                unitsRow.render();
                boundsRow.render();
                this.notify();
            }
        });

        const unitsRow = valuePanel.addRow("Display Unit").addInput("unit", this, 'unitIndex', { onChange: (index) => { this.notify(); }}).setVisible(this.value.unitType.units.length > 1);

        const boundsRow = valuePanel.addRow("Minimum", "Maximum");

        boundsRow.addInput("value", this, 'customMinimum', { valuePropertyName: "value" })
            .addInput("value", this, 'customMaximum', { valuePropertyName: "value" });
    }

    toJSON() {
        const json = {
            value: this.value.name,
            unitIndex: this.unitIndex
        };
    
        if (this.customMinimum != null) {
            json.customMinimum = this.customMinimum;
        }
    
        if (this.customMaximum != null) {
            json.customMaximum = this.customMaximum;
        }
    
        return json;
    }
};