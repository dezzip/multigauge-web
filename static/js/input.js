import { StaticColor } from "/static/js/core/colors/StaticColor.js";
import { CycleColor } from "/static/js/core/colors/CycleColor.js";
import { ValueColor } from "/static/js/core/colors/ValueColor.js";
import menuStack from "/static/js/editor/MenuStack.js";

import { roundTo } from "/static/js/utils.js"

import { makeSelectMenu } from "/static/js/dropdown.js"

import undoStack from "/static/js/editor/UndoStack.js";

/** Helper function to pair an input with a label inside a container
 * 
 * @param {*} labelText Label to display
 * @param {*} input input to display
 * @returns 
 */
export function createLabeledInputRow(labelText, input) {
    const row = document.createElement('div');
    row.classList.add('property-row');

    const label = document.createElement('label');
    label.textContent = `${labelText}:`;
    label.classList.add("property-label");

    input.classList.add("property-input");

    row.appendChild(label);
    row.appendChild(input);

    return row;
}

/** Creates a property field for an integer value
 * 
 * @param {*} labelText The label to display for the field
 * @param {*} property The property to update on change
 * @returns 
 */
export function createIntField(obj, property, min, max, labelText, onChange = null) {
    const input = creators["integer"](obj, propertyName, {min: min, max: max, onChange: onChange});

    return createLabeledInputRow(labelText || property, input);
}

/**************************************
                HELPERS
**************************************/

function createInputFieldWithImage(src, input) {
    const property = document.createElement("div");

    // Icon
    const propertyIcon = document.createElement("div");
    propertyIcon.className = "property-icon";
    property.appendChild(propertyIcon);

    // Icon Image
    const propertyIconImage = document.createElement('img');
    propertyIconImage.src = src;
    propertyIcon.appendChild(propertyIconImage);

    // Input
    const propertyInput = document.createElement("div");
    propertyInput.className = "property-input";
    propertyInput.appendChild(input);
    property.appendChild(propertyInput);

    return property;
}

function createInputFieldWithChar(char, input) {
    const property = document.createElement("div");
    property.style.display = "flex";

    // Icon
    const propertyIcon = document.createElement("div");
    propertyIcon.className = "property-icon";
    property.appendChild(propertyIcon);

    // Icon Label 
    const propertyIconLabel = document.createElement('label');
    propertyIconLabel.textContent = char;
    propertyIcon.appendChild(propertyIconLabel);

    // Input
    const propertyInput = document.createElement("div");
    propertyInput.className = "property-input";
    propertyInput.appendChild(input);
    property.appendChild(propertyInput);

    return property;
}

/**************************************
          PROPERTY FIELDS
**************************************/

// TODO: Put this somewhere else (It should update on unfocus)
export function createTextField(obj, propertyName, onChange = null) {
    const property = document.createElement("div");

    // Input
    const propertyInput = document.createElement("div");
    propertyInput.className = "property-input";
    property.appendChild(propertyInput);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = obj[propertyName];

    const displayValue = (value) => { input.value = value; }

    input.addEventListener('input', (event) => {
        undoStack.addPropertyChangeAction(obj, propertyName, event.target.value, obj[propertyName], (value) => { displayValue(value); });
        obj[propertyName] = event.target.value;
        if (onChange) onChange();
    });

    propertyInput.appendChild(input);

    return property;
}

export function createTestIntField(obj, propertyName, min = null, max = null, labelText, onChange = null, placeholderText = null) {
    const input = creators["integer"](obj, propertyName, {min: min, max: max, onChange: onChange});

    return createInputFieldWithChar(labelText, input);
}

/** Creates a UI field for editing a single angle on a given object.
 * 
 * @param {Object} obj  The object containing the properties to edit.
 * @param {string} angleProperty The name of the angle property representing the angle.
 * @param {string} minAngle The minimum allowed angle.
 * @param {string} maxAngle The maximum allowed angle.
 * @param {function} onChange Optional callback function to call when the value changes.
 * @returns {HTMLDivElement} A div element containing the input field for the angle.
 */
export function createAngleField(obj, propertyName, minAngle, maxAngle, onChange = null) {
    const input = creators["integer"](obj, propertyName, {min: minAngle, max: maxAngle, onChange: onChange});

    return createInputFieldWithImage("/static/images/angle.png", input);
}

export function createPercentField(obj, percentProperty, onChange = null) {
    // Input
    const input = document.createElement('input');
    input.type = 'number';
    input.value = Math.round(obj[percentProperty] * 100);
    input.min = 0;
    input.max = 100;

    input.addEventListener('input', (event) => {
        let val = parseFloat(event.target.value);
        
        if (!isNaN(val)) {
            obj[percentProperty] = val / 100;
            if (onChange) onChange();
        }
    });

    return createInputFieldWithChar('%', input);
}

export function createLengthField(obj, propertyName, max, onChange = null) {
    const input = creators["integer"](obj, propertyName, {min: 0, max: max, onChange: onChange});

    return createInputFieldWithImage('/static/images/ruler.png', input);
}

export function createRadiusField(obj, propertyName, max, onChange = null) {
    const input = creators["integer"](obj, propertyName, {min: 0, max: max, onChange: onChange});

    return createInputFieldWithImage('/static/images/radius.png', input);
}

export function createValueField(obj, valueProperty, options) {
    // Input
    const input = creators["unit"](obj, valueProperty, options)

    let image = "/static/images/core/units/unit_temperature.png";

    if (options.valueParentObj != null) {
        image = options.valueParentObj[options.valuePropertyName].unitType.icon;
    } else {
        image = obj[options.valuePropertyName].unitType.icon;
    }

    const blankInput = document.createElement('div');
    blankInput.className = "input-and-unit";

    return createInputFieldWithImage(image, input);
}

import { ColorKeyframe } from "/static/js/core/colors/ColorKeyframe.js";


/** Creates a UI field for a color timeline.
 * 
 * @param {Object} obj The object containing the keyframes property.
 * @param {string} keyframesPropertyName The name of the keyframes property to get the list of keyframes from.
 * @param {function} onChange Optional callback function that executes when the keyframes are changed.
 * @param {(keyframe: ColorKeyframe) => void} onAdd Optional callback function that executes when a keyframe is added. Passes the new keyframe back.
 * @returns {HTMLDivElement} The DOM element containing the gradient.
 */
export function createGradientField(obj, keyframesPropertyName, onChange = null, onAdd = null) {
    const keyframes = obj[keyframesPropertyName];

    if (!Array.isArray(keyframes)) throw new Error(`Property "${keyframesPropertyName}" is undefined or not an array.`);

    const container = document.createElement('div');

    const gradientContainer = document.createElement('div');
    gradientContainer.className = "gradient-container";
    container.appendChild(gradientContainer);

    const gradient = document.createElement('div');
    gradient.classList.add("gradient");
    gradientContainer.appendChild(gradient);

    const updateGradient = () => {
        gradient.style.background = obj.getGradient();
    };

    updateGradient(); // Update the gradient when the form is created

    if (typeof getPosition === 'function' && keyframes.length > 1) {
        const positionIndicator = document.createElement('div');
        positionIndicator.classList.add("gradient-position-indicator");
        gradient.appendChild(positionIndicator);
    
        const updateIndicator = () => {
            if (keyframes.length < 2) return;
    
            const currentValue = getPosition();
            const position = obj.getPositionAtValue(currentValue) * 100;
            positionIndicator.style.left = `${position}%`;
    
            requestAnimationFrame(updateIndicator);
        };
    
        requestAnimationFrame(updateIndicator);
    }

    // Add a keyframe when clicking on gradient
    gradientContainer.addEventListener("click", (event) => {
        // Get the relative click position
        const rect = gradientContainer.getBoundingClientRect();
        const clickPosition = event.clientX - rect.left;
        const position = (clickPosition / rect.width);

        const newValue = obj.getValueAtPosition(position); // Calculate the value for the new keyframe

        // Create a new keyframe with the color at the selected positoin
        const newKeyframe = new ColorKeyframe(new StaticColor(obj.getColor(newValue)), newValue, true);
        
        if (typeof onAdd === 'function') onAdd(newKeyframe);

        obj.addKeyframe(newKeyframe);

        if (typeof onChange === 'function') onChange();
        updateGradient(); // Recalculate and update the gradient background
        updateKeyframeStops();
    });

    const gradientStops = document.createElement('div');
    gradientStops.classList.add("gradient-stop-container");
    gradientContainer.appendChild(gradientStops);

    // Add keyframe stop elements
    const updateKeyframeStops = () => {
        gradientStops.innerHTML = ''; // Clear existing stops

        // Loop through each keyframe and add them
        keyframes.forEach((keyframe, index) => {
            const stop = document.createElement('div');
            stop.classList.add("gradient-stop");
            stop.style.backgroundColor = keyframe.getColor();
            stop.style.left = `${obj.getPositionAtValue(keyframe.value) * 100}%`;
            stop.style.transform = "translateX(-50%)"; // Center on position

            let isDragging = false;
            let startX = 0;
            let originalLeft = parseFloat(stop.style.left);

            // Gradient stop clicked
            stop.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent clicks from bubbling

                const rect = stop.getBoundingClientRect();

                // Open the menu at this element
                menuStack.openObject(keyframe.color, () => { updateGradient(); }, rect.left, rect.top);
            });

            // Start dragging
            stop.addEventListener("mousedown", (event) => {
                isDragging = true;
                startX = event.clientX;
            });

            // Handle dragging
            document.addEventListener("mousemove", (event) => {
                if (isDragging) {
                    const dx = event.clientX - startX;
                    const rect = gradient.getBoundingClientRect();
                    const newLeft = originalLeft + (dx / rect.width) * 100;
                    const clampedLeft = Math.min(Math.max(newLeft, 0), 100); // Ensure it's within the gradient bounds

                    stop.style.left = `${clampedLeft}%`;

                    // Update the keyframe value based on the stop's new position
                    const newValue = obj.getValueAtPosition(clampedLeft / 100);
                    keyframe.value = newValue;

                    obj.sortKeyframes();

                    if (typeof onChange === 'function') onChange();
                    updateGradient(); // Recalculate and update the gradient background
                    updateKeyframeStops();
                }
            });

            // End dragging
            document.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                }
            });

            gradientStops.appendChild(stop);
        });
    };

    updateKeyframeStops(); // Initialize the keyframe stops

    return container;
}

/** Creates a UI field that opens a context menu on an object's property.
 * 
 * @param {Object} obj The object containing the property.
 * @param {string} propertyName The name of the property to open in a context menu when clicked.
 * @param {string} labelText 
 * @param {function} onChange Optional callback function that executes when the object's property is changed.
 * @returns {HTMLDivElement} The DOM element containing the object property.
 */
export function createObjectPropertyField(obj, propertyName, onChange = null) {
    if (obj[propertyName] == null) return;

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";

    function render() {
        const currentInstance = obj[propertyName];

        function effectiveOnChange() {
            if (obj[propertyName] !== currentInstance) render(); // Rerenders on instance change to new object property field
            if (typeof onChange === 'function') onChange();
        }

        const field = (typeof currentInstance?.createObjectPropertyField === 'function')
            ? currentInstance.createObjectPropertyField(obj, propertyName, effectiveOnChange)
            : createDefaultObjectPropertyField(obj, propertyName, effectiveOnChange);

        field.classList.add("object-property");

        container.replaceChildren(field);
    }

    render();

    return container;
}

function createDefaultObjectPropertyField(obj, propertyName, onChange) {
    const field = document.createElement("div");

    const label = document.createElement('label');
    label.textContent = "Test";
    field.appendChild(label);

    field.addEventListener("click", () => {
        const rect = field.getBoundingClientRect();
        menuStack.openProperty(obj, propertyName, onChange, rect.left, rect.top);
    });

    return field;
}


/** Creates a UI field that opens a context menu on an object.
 * 
 * @param {Object} obj The object to open in a context menu when clicked.
 * @param {string} labelText 
 * @param {function} onChange Optional callback function that executes when the object is changed.
 * @returns {HTMLDivElement} The DOM element containing the object.
 */
export function createObjectField(obj, labelText = null, onChange = null) {
    if (obj == null) throw new Error("Object is null or undefined");

    // Check for createObjectField override in object
    if (typeof obj.createObjectField === 'function') {
        const objectField = obj.createObjectField(onChange);
        objectField.classList.add("object-property");
        return objectField;
    }

    const propertyObject = document.createElement("div");
    propertyObject.classList.add("object-property");

    // Label
    const objectLabel = document.createElement('label');
    objectLabel.textContent = labelText || "Unnamed";
    propertyObject.appendChild(objectLabel);

    propertyObject.addEventListener("click", () => {
        const rect = propertyObject.getBoundingClientRect();

        menuStack.openObject(obj, onChange, rect.left, rect.top);
    });

    return propertyObject;
}

export function createButtonSelector(obj, propertyName, onChange = null, selectedIndex = null, ...imageSrcs) {
    const propertyInput = document.createElement("div");
    propertyInput.className = "property-selector-buttons";

    let selectedButton = null;

    imageSrcs.forEach((src, index) => {
        const button = document.createElement("button");
        button.className = "selector-button";
        if (selectedIndex !== null && selectedIndex === index) {
            button.classList.add('selected');
            selectedButton = button;
        }

        // Create an image element and set its source
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "20px";
        img.style.height = "20px";
        img.alt = "selector image";
        img.className = "selector-image"; // Optional: style the image if needed

        // Append the image to the button
        button.appendChild(img);

        // Button click listener
        button.addEventListener('click', () => {
            if (selectedButton) {
                selectedButton.classList.remove('selected');
            }

            button.classList.add('selected');
            selectedButton = button;

            if (typeof onChange === 'function') {
                onChange(index);
            } else if (obj[propertyName] !== undefined) {
                // If no onChange function is defined, set the object's property to the index
                obj[propertyName] = index;
            } else {
                console.warn(`No onChange() function defined and property "${propertyName} not defined"`)
            }
        });

        propertyInput.appendChild(button);
    });

    return propertyInput;
}

export function createAlignmentField(obj, propertyName) {
    return createButtonSelector(obj, propertyName, (index) => {
        obj[propertyName] = index - 1;
    }, obj[propertyName] + 1,
    "/static/images/left.png", "/static/images/circular.png", "/static/images/right.png");
}

/** Creates a selection menu for a unit index property of an object.
 * I literally only made this for GaugeValue, and I doubt I'll use it for something else, but who knows.
 * 
 * @param {Object} obj The object containing the property to bind to the menu.
 * @param {string} unitPropertyName The name of the unit index property to update when the selection changes.
 * @param {string} valuePropertyName The name of the value property to get the list of units from.
 * @param {(index: number) => void} [onChange=null] Optional callback function that executes when the selection changes. Passes the index back.
 * @returns {HTMLDivElement} The DOM element containing the dropdown menu.
 * 
 * @throws {Error} If the value property does not exist.
 */
export function createUnitMenu(obj, unitPropertyName, valuePropertyName, onChange = null) {
    
    const units = obj[valuePropertyName].unitType.units;

    if (!units) throw new Error(`Cannot find property "${valuePropertyName}"`)

    const unitList = [
        { name: "Default", value: -1, context: obj[valuePropertyName].unitType.getUnit().name },
        { /* Divider */ },
        ...units.map((unit, index) => ({
            name: unit.name,
            context: unit.abbreviation,
            value: index
        }))
    ];

    const selectedName = obj[valuePropertyName].unitType.getUnit(obj[unitPropertyName]).name;

    return makeSelectMenu(unitList, selectedName, (newValue) => {
        obj[unitPropertyName] = newValue;
        console.log("Changing property: ", unitPropertyName, " To: ", newValue);
        if (onChange != null && typeof onChange === 'function') onChange();
    });
}

/** Creates a selection menu for a property of an object that supports list-based selection.
 * 
 * The property must be an object that implements `getList()`, `getIndex()`, and `getAtIndex(index)`.
 * The generated menu allows choosing an item from the list, and updates the object's property
 * based on the selected index. An optional callback can be used to react to changes.
 *
 * @param {Object} obj The object containing the property to bind to the menu.
 * @param {string} propertyName The name of the property to update when the selection changes.
 * @param {(index: number) => void} [onChange=null] Optional callback function that executes when the selection changes. Passes the index back.
 * @returns {HTMLDivElement} The DOM element containing the dropdown menu.
 * 
 * @throws {Error} If the property does not exist or does not implement the required interface.
 */
export function createObjectMenu(obj, propertyName, onChange = null) {
    const object = obj[propertyName];

    if (!object) throw new Error(`Cannot find property "${propertyName}"`);
    if (typeof object.getMenuOptions !== 'function') throw new Error(`${propertyName} does not have a getMenuOptions() function`);
    if (typeof object.getMenuOption !== 'function') throw new Error(`${propertyName} does not have a getMenuOption() function`);

    const menuOptions = object.getMenuOptions();
    const selectedName = object.getMenuOption().name;
    const onChangeMenu = (newObject) => {
        obj[propertyName] = newObject;
        if (onChange != null && typeof onChange === 'function') onChange();
    };

    return makeSelectMenu(menuOptions, selectedName, onChangeMenu);
}

const creators = {
    integer: (obj, propertyName, options) => {
        const input = document.createElement('input');
        input.type = 'text';

        const min = options.min;
        const max = options.max;

        const displayValue = (value) => { input.value = value; }
        
        const applyValue = () => {
            let newValue = parseInt(input.value);

            if (!isNaN(newValue)) { // Input is valid number
                if (min != null && newValue < min) newValue = min;
                if (max != null && newValue > max) newValue = max;
        
                // Add action to undo menu with old value
                undoStack.addPropertyChangeAction(obj, propertyName, obj[propertyName], newValue, displayValue);

                obj[propertyName] = newValue;
                displayValue(newValue);

                if (options.onChange != null && typeof options.onChange === 'function') options.onChange();
            } else {
                displayValue(obj[propertyName]);
            }
        };

        input.addEventListener('blur', applyValue);

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') input.blur(); // optional: remove focus after Enter
        });

        displayValue(obj[propertyName]);

        return input;
    },
    decimal: (obj, propertyName, options) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = obj[propertyName];

        if (options.min != null) input.min = options.min;
        if (options.max != null) input.max = options.max;

        const decimals = options.decimals || 0;

        const applyValue = () => {
            let newValue = parseFloat(target.value);
            
            if (!isNaN(newValue)) {
                let roundedValue = parseFloat(newValue.toFixed(decimals));
                obj[lengthProperty] = roundedValue;
                if (options.onChange != null && typeof options.onChange === 'function') options.onChange();
            } else {
                input.value = obj[propertyName];
            }
        };

        input.addEventListener('blur', applyValue);

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                applyValue();
                input.blur(); // optional: remove focus after Enter
            }
        });

        return input;
    },
    unit: (obj, propertyName, options) => {
        const inputContainer = document.createElement('div');
        inputContainer.className = "input-and-unit"

        const min = options.min;
        const max = options.max;

        const getUnitType = () => {
            if (options.valueParentObj != null) {
                return options.valueParentObj[options.valuePropertyName].unitType;
            } else {
                return obj[options.valuePropertyName].unitType;
            }
        }
    
        let unitIndex = 0;

        const unitAbbreviation = document.createElement('div');
        unitAbbreviation.className = "unit-abbreviation";
        inputContainer.append(unitAbbreviation);

        // Unit selector
        if (getUnitType().units.length > 1) {
            const unitList = [
                ...getUnitType().units.map((unit, index) => ({
                    name: unit.abbreviation,
                    context: unit.name,
                    value: index
                }))
            ];

            const selectedName = getUnitType().getUnit(obj[propertyName]).abbreviation;
            
            const unitSelector = makeSelectMenu(unitList, selectedName, (newValue) => {
                unitIndex = newValue;
                displayValue(obj[propertyName]);
                if (options.onChange != null && typeof options.onChange === 'function') options.onChange();
            });

            unitAbbreviation.append(unitSelector);
        } else {
            const unitSpan = document.createElement('span');
            unitSpan.textContent = getUnitType().units[0].abbreviation;
            unitAbbreviation.append(unitSpan);
        }

        const input = document.createElement('input');
        inputContainer.prepend(input);
        input.type = 'text';

        const displayValue = (value) => {
            const unitType = getUnitType();

            input.value = roundTo(unitType.convertFromBase(value, unitIndex), unitType.getUnit(unitIndex).decimalPlaces);
        }

        const parseInput = (value) => {
            return parseFloat(value);
        }
        
        const updateValue = () => {
            const newValue = parseInput(input.value);

            if (!isNaN(newValue)) { // Input is valid number
                let baseUnit = getUnitType().convertToBase(input.value, unitIndex);

                if (min !== undefined && baseUnit < min) baseUnit = min;
                if (max !== undefined && baseUnit > max) baseUnit = max;
        
                obj[propertyName] = baseUnit;
                displayValue(baseUnit);
                if (options.onChange != null && typeof options.onChange === 'function') onChange();
            } else {
                displayValue(obj[propertyName]);
            }
        };

        input.addEventListener('blur', updateValue);

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') input.blur(); // optional: remove focus after Enter
        });

        displayValue(obj[propertyName]);

        return inputContainer;
    }
}

function createInput(obj, propertyName, onChange = null) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = obj[propertyName];

    // For whole integers
    input.addEventListener('input', (event) => {
        let newValue = parseInt(event.target.value);
        
        if (!isNaN(newValue)) {
            obj[lengthProperty] = newValue;
            if (typeof onChange === 'function') onChange();
        }
    });

    // For decimal numbers
    const decimalPlace = 1;

    input.addEventListener('input', (event) => {
        let newValue = parseFloat(event.target.value);
        
        if (!isNaN(newValue)) {
            let roundedValue = parseFloat(newValue.toFixed(decimalPlace));
            obj[lengthProperty] = roundedValue;
            if (typeof onChange === 'function') onChange();
        }
    });

    return input;
}