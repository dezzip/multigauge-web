import { PropertyInput } from "/static/js/editor/properties/PropertyInput.js";
import { PropertyIcon } from "/static/js/editor/properties/PropertyIcon.js";
import { createObjectField, createObjectPropertyField } from "/static/js/input.js";
import { makeActionMenu, makeSelectMenu } from "/static/js/dropdown.js";

import undoStack from "/static/js/editor/UndoStack.js";

import menuStack from "/static/js/editor/MenuStack.js";

export class PropertyObject {
    constructor(obj, labelText = null, onChange = null) {
        this.obj = obj;
        this.labelText = labelText;
        this.onChange = onChange;

        this.objectNode = document.createElement('div');
    }

    render() {
        this.objectNode = createObjectField(this.obj, this.labelText, this.onChange);

        return this.objectNode;
    }
}

export class PropertyObjectProperty {
    constructor(obj, propertyName, onChange = null) {
        this.obj = obj;
        this.propertyName = propertyName;
        this.onChange = onChange;

        this.objectNode = document.createElement('div');
    }

    render() {
        this.objectNode.innerHTML = '';

        if (this.obj[this.propertyName] != null) {
            const objectPropertyField = createObjectPropertyField(this.obj, this.propertyName, this.onChange);
            this.objectNode.appendChild(objectPropertyField);
        }

        return this.objectNode;
    }
}


export class PropertyRow {
    constructor(...labels) {
        this.labels = labels;
        this.inputs = [];
        this.icons = [];

        this.visible = true;

        this.rowNode = document.createElement('div');
        this.rowNode.className = "property-row";
    }

    addInput(type, obj, propertyName, options = {}) {
        const input = new PropertyInput(type, obj, propertyName, options);

        this.inputs.push(input);

        return this; // For method chaining
    }

    addObject(obj, labelText, onChange, rerenderOnChange = false) {
        const effectiveOnChange = () => {
            if (rerenderOnChange) this.render();
            if (onChange != null && typeof onChange === 'function') onChange();
        };

        const object = new PropertyObject(obj, labelText, effectiveOnChange);

        this.inputs.push(object);

        return this; // For method chaining
    }

    addObjectProperty(obj, propertyName, onChange, rerenderOnChange = false) {
        const effectiveOnChange = () => {
            if (rerenderOnChange) this.render();
            if (onChange != null && typeof onChange === 'function') onChange();
        };

        const objectProperty = new PropertyObjectProperty(obj, propertyName, effectiveOnChange);

        this.inputs.push(objectProperty);

        return this; // For method chaining
    }

    addToggleableObjectProperty(obj, propertyName, objectType, onAdd, onRemove, onChange, rerenderOnChange = false) {
        const effectiveOnChange = () => {
            if (rerenderOnChange) this.render();  // Rerender row if flag is set
            if (onChange != null && typeof onChange === 'function') onChange();             // Also call user-provided callback
        };
        
        const objectProperty = new PropertyObjectProperty(obj, propertyName, effectiveOnChange);

        this.inputs.push(objectProperty);

        this.addIcon((icon) => {
            if (obj[propertyName] != null) { // Remove the object
                if (onRemove != null && typeof onRemove === 'function') onRemove(obj[propertyName]);
                menuStack.closeFrom(obj[propertyName], false); // If the menu is open for this object close it

                undoStack.addPropertyChangeAction(obj, propertyName, obj[propertyName], null, this.render.bind(this));

                obj[propertyName] = null;

                icon.changeSrc("/static/images/add.png");
                this.render();
            } else { // Add a new object
                if (!objectType?.getDefault) {
                    console.warn("No getDefault() method provided on objectType ", objectType);
                    return;
                }

                const newObject = objectType.getDefault();
                if (onAdd != null && typeof onAdd === 'function') onAdd(newObject);

                undoStack.addPropertyChangeAction(obj, propertyName, null, newObject, this.render.bind(this));

                obj[propertyName] = newObject;

                icon.changeSrc("/static/images/trash.png");
                this.render();
            }
        }, (obj[propertyName] != null) ? "/static/images/trash.png" : "/static/images/add.png");

        return this; // For method chaining
    }

    addIcon(onChange, src) {
        const icon = new PropertyIcon(onChange, src);

        this.icons.push(icon);
        return this; // For method chaining
    }

    setVisible(isVisible) {
        if (this.visible !== isVisible) {
            this.visible = isVisible;
            this.rowNode.classList.toggle('hidden', !this.visible);
            this.render();
        }

        return this; // For method chaining
    }

    generateGridLayout() {
        this.rowNode.style.display = 'grid';

        const iconCount = Math.max(this.icons.length, 1);
        const inputCount = this.inputs.length;

        this.rowNode.style.gridTemplateColumns = [
            ...Array(inputCount).fill('1fr'),
            ...Array(iconCount).fill('30px')
        ].join(' ');
        this.rowNode.style.gridTemplateRows = 'auto 30px'

        const row1 = [
            ...Array(inputCount).fill().map((_, i) => `label${i}`),
            ...Array(iconCount).fill('.')
        ].join(' ');

        const row2 = [
            ...Array(inputCount).fill().map((_, i) => `input${i}`),
            ...Array(iconCount).fill().map((_, i) => `icon${i}`)
        ].join(' ');

        const gridTemplateAreas = `"${row1}" "${row2}"`;

        this.rowNode.style.gridTemplateAreas = gridTemplateAreas;
    }

    render() {
        this.rowNode.innerHTML = '';

        if (!this.visible) {
            return this.rowNode;
        }

        this.generateGridLayout();

        for(let i = 0; i < this.inputs.length; i++) {
            const labelText = this.labels[i];
            if (labelText) {
                const labelNode = document.createElement('label');
                labelNode.className = "row-label";
                labelNode.textContent = labelText;
                labelNode.style.gridArea = `label${i}`;
                this.rowNode.appendChild(labelNode);
            }

            const input = this.inputs[i];
            if (input) {
                const inputNode = input.render();
                inputNode.classList.add("property");
                inputNode.style.gridArea = `input${i}`;
                this.rowNode.appendChild(inputNode);
            }
        }

        if (this.labels.length <= 0) { // Empty label, literally just for spacing
            const emptyLabel = document.createElement('label');
            emptyLabel.className = "row-label";
            emptyLabel.style.gridArea = `label0`;
            this.rowNode.appendChild(emptyLabel);
        }

        for(let i = 0; i < this.icons.length; i++) {
            const icon = this.icons[i];
            if (icon) {
                const iconNode = icon.render();
                iconNode.style.gridArea = `icon${i}`;
                this.rowNode.appendChild(iconNode);
            }
        }

        return this.rowNode;
    }
}