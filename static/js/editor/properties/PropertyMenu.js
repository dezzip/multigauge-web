import { PropertyPanel } from "/static/js/editor/properties/PropertyPanel.js";

export class PropertyMenu {
    constructor(menuContainer) {
        this.menuContainer = menuContainer;
        this.selectedElement = null;

        this.panels = [];
    }

    /** Adds a panel to the menu.
     * 
     * @param {*} title 
     * @returns 
     */
    addPanel(title = null, element = null) {
        const panel = new PropertyPanel(title, element);
        this.panels.push(panel);
        return panel;
    }

    addCollapsiblePanel(title = "Collapsible", element = null) {
        const panel = new PropertyPanel(title, element, true);
        this.panels.push(panel);
        return panel;
    }

    /** Displays the properties of an element on the menu.
     * 
     * @param {Object} element 
     * @param {function} onChange 
     * @param {Object} obj 
     * @param {string} propertyName 
     */
    displayProperties(element, onChange = null, obj, propertyName, isContextMenu = false) {
        this.selectedElement = element;
        this.panels = [];

        if (isContextMenu) {
            this.addPanel("Title", element);
        }

        if (this.selectedElement != null) {
            if (typeof this.selectedElement.addPanels === 'function') {
                this.selectedElement.addPanels(this, onChange, obj, propertyName);
            } else {
                console.warn('Selected element has no addPanels() function');
            }
        } else {
            this.panels = [];
        }
        
        this.render();
    }

    render() {
        if (!this.menuContainer) {
            console.warn("Target menu container could not be found");
            return;
        }

        this.menuContainer.innerHTML = '';

        for (const panel of this.panels) {
            this.menuContainer.appendChild(panel.render());
        }
    }
}

const propertyMenu = new PropertyMenu(); // Singleton
export default propertyMenu;