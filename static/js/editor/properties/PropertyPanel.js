import { PropertyRow } from "/static/js/editor/properties/PropertyRow.js";
import { PropertyIcon } from "/static/js/editor/properties/PropertyIcon.js";
import { PropertyList } from "/static/js/editor/properties/PropertyList.js";
import { PropertyColorPicker } from "/static/js/editor/properties/PropertyColorPicker.js";
import menuStack from "/static/js/editor/MenuStack.js"

export class PropertyHeader {
    constructor(title, element = null, parentPanel = null) {
        this.title = title;
        this.icons = []

        this.parentPanel = parentPanel;

        if (element != null) {
            this.addIcon(() => { menuStack.closeFrom(element); }, "/static/images/close.png");
        }

        this.headerNode = document.createElement('div');
        this.headerNode.className = "properties-header";

        if (this.parentPanel != null) {
            this.headerNode.addEventListener('click', () => {
                this.parentPanel.collapsed = !this.parentPanel.collapsed;
                this.parentPanel.render();
            });
        }
    }

    addIcon(onChange, src) {
        const icon = new PropertyIcon(onChange, src);

        this.icons.push(icon);
        return this; // For method chaining
    }

    generateGridLayout() {
        const iconCount = Math.max(this.icons.length, 1);

        const columns = [];
        const areas = [];

        if (this.parentPanel != null) {
            columns.push('10px');
            areas.push('expand');
        }

        columns.push('1fr');
        areas.push('label');

        for (let i = 0; i < iconCount; i++) {
            columns.push('30px');
            areas.push(`icon${i}`);
        }

        this.headerNode.style.gridTemplateColumns = columns.join(' ');
        this.headerNode.style.gridTemplateAreas = `"${areas.join(' ')}"`;
    }

    render() {
        this.headerNode.innerHTML = '';

        this.generateGridLayout();

        if (this.parentPanel != null) {
            const collapseButton = document.createElement('img');
            collapseButton.className = "properties-header-expand";
            collapseButton.src = this.parentPanel.collapsed ? "/static/images/right.png" : "/static/images/down.png";
            this.headerNode.appendChild(collapseButton);
        }

        const label = document.createElement('span');
        label.className = ('properties-header-label');
        label.textContent = this.title;
        this.headerNode.appendChild(label);

        for(let i = 0; i < this.icons.length; i++) {
            const icon = this.icons[i];
            if (icon) {
                const iconNode = icon.render();
                iconNode.style.gridArea = `icon${i}`;
                this.headerNode.appendChild(iconNode);
            }
        }

        return this.headerNode;
    }
}

export class PropertyPanel {
    constructor(title = null, element = null, collapsible = false) {
        this.header = null;
        this.collapsed = collapsible;

        if (title != null) this.header = new PropertyHeader(title, element, collapsible ? this : null);
        
        this.rows = [];
        
        this.panelNode = document.createElement('div');
        this.panelNode.className = "properties-panel";
    }

    addRow(...labels) {
        const row = new PropertyRow(...labels);
        this.rows.push(row);
        return row;
    }

    addList(obj, propertyName, options) {
        const list = new PropertyList(obj, propertyName, options);
        this.rows.push(list);
        return list;
    }

    addColorPicker(obj, propertyName, options) {
        const colorPicker = new PropertyColorPicker(obj, propertyName, options);
        this.rows.push(colorPicker);
        return colorPicker;
    }

    addToggleableObjectProperty(labelText = null, obj, propertyName, objectType, onAdd, onRemove, onChange) {
        this.addRow(labelText).addToggleableObjectProperty(obj, propertyName, objectType, onAdd, onRemove, onChange, false);
    }

    render() {
        this.panelNode.innerHTML = '';

        if (this.header != null) {
            this.panelNode.appendChild(this.header.render());
        }

        if (!this.collapsed) {
            for (const row of this.rows) {
                this.panelNode.appendChild(row.render());
            }
        }

        return this.panelNode;
    }
}