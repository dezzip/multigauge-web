import { createAlignmentField, createGradientField, createButtonSelector, createPercentField, createRadiusField, createLengthField, createUnitMenu, createTestIntField, createAngleField, createTextField, createValueField, createObjectMenu } from "/static/js/input.js";

const InputCreators = {
    int:    (obj, propertyName, options) => createTestIntField(obj, propertyName, options.min, options.max, options.label ?? "", options.onChange),
    value:  (obj, propertyName, options) => createValueField(obj, propertyName, options),
    text:   (obj, propertyName, options) => createTextField(obj, propertyName, options.onChange),
    angle:  (obj, propertyName, options) => createAngleField(obj, propertyName, options.min, options.max, options.onChange),
    menu:   (obj, propertyName, options) => createObjectMenu(obj, propertyName, options.onChange),
    unit:   (obj, propertyName, options) => createUnitMenu(obj, propertyName, options.valuePropertyName || 'value', options.onChange),

    length:  (obj, propertyName, options) => createLengthField(obj, propertyName),
    time:    (obj, propertyName, options) => createLengthField(obj, propertyName),
    percent: (obj, propertyName, options) => createPercentField(obj, propertyName),
    radius:  (obj, propertyName, options) => createRadiusField(obj, propertyName),

    gradient: (obj, propertyName, options) => createGradientField(obj, propertyName, options.onChange, options.onAdd),
    buttonMenu: (obj, propertyName, options) => createButtonSelector(obj, propertyName, options.onChange, options.selectedIndex, ...options.images),

    alignment: (obj, propertyName, options) => createAlignmentField(obj, propertyName),
    orientation: (obj, propertyName, options) => createButtonSelector(obj, propertyName, (index) => { obj[propertyName] = index; if (options.onChange != null && typeof options.onChange === `function`) options.onChange(); }, obj[propertyName], "/static/images/left.png", "/static/images/up.png")
};

export class PropertyInput {
    constructor(type, obj, propertyName, options = {}) {
        this.type = type;
        this.obj = obj;
        this.propertyName = propertyName;
        this.options = options;

        this.inputNode = null;
    }

    render() {
        const creator = InputCreators[this.type];
        if (!creator) {
            console.warn("Unknown input type:" + this.type);
            return;
        }

        this.inputNode = creator(this.obj, this.propertyName, this.options);
        return this.inputNode;
    }
}