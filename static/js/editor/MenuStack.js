import { PropertyMenu } from "/static/js/editor/properties/PropertyMenu.js";
import { isNestedWithin } from "/static/js/utils.js";
import { ContextMenu } from "/static/js/editor/ContextMenu.js";

class MenuStack {
    constructor() {
        if (MenuStack.instance) return MenuStack.instance;
        this.stack = [];
        MenuStack.instance = this;
    }

    findIndexOfParent(element) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (isNestedWithin(element, this.stack[i].getObject())) {
                return i;
            }
        }

        return -1;
    }

    /** Opens a context menu of an object.
     * 
     * @param {Object} obj The object to open a context menu of.
     * @param {function} onChange Optional callback function that executes when the object is changed.
     * @param {function} onClose 
     * @param {function} onDelete 
     */
    openObject(obj, onChange = null, x = 0, y = 0) {
        x = x - 250;
        
        // Close if clicked while opened
        const existingMenu = this.stack.find(menu => menu.element === obj);
        if (existingMenu) {
            this.closeFrom(obj);
            this.render();
            return;
        }

        this.closeAbove(obj);

        const contextMenu = new ContextMenu(obj, null, null, onChange, x, y);
        this.stack.push(contextMenu);

        const container = document.querySelector('.contextMenuContainer');
        container.appendChild(contextMenu.render());
    }

    /** Opens a context menu of an object's property.
     * 
     * @param {Object} obj The object containing the property to open.
     * @param {string} propertyName The property to open a context menu of.
     * @param {function} onClose 
     * @param {function} onDelete 
     */
    openProperty(obj, propertyName, onChange = null, x = 0, y = 0) {
        x = x - 250;

        // Close if clicked while opened
        const existingMenu = this.stack.find(menu => menu.element === obj[propertyName]);
        if (existingMenu) {
            this.closeFrom(obj[propertyName]);
            this.render();
            return;
        }

        this.closeAbove(obj[propertyName]);

        const contextMenu = new ContextMenu(obj[propertyName], obj, propertyName, onChange, x, y);
        this.stack.push(contextMenu);

        const container = document.querySelector('.contextMenuContainer');
        container.appendChild(contextMenu.render());
    }
    
    replaceProperty(obj, propertyName, newOnChange = null) {
        // Find the context menu with the original property
        const index = this.stack.findIndex(menu => menu.obj === obj && menu.propertyName === propertyName);

        if (index !== -1) {
            const contextMenu = this.stack[index];

            contextMenu.element = obj[propertyName];
            contextMenu.onChange = newOnChange;

            for (let i = this.stack.length - 1; i > index; i--) {
                const menu = this.stack[i];
                if (menu.node && menu.node.parentNode) {
                    menu.node.parentNode.removeChild(menu.node);
                }
                this.stack.pop();
            }

            contextMenu.render();
        } else {
            console.warn("No context menu found for the specified object and property name.");
        }
    }

    /** Close all menus from an element.
     * 
     * @param {Object} element The element to close all context menus from.
     */
    closeFrom(element) {
        if (element != null) {
            // Check if the parent is the element of any menu and get the index
            const index = this.stack.findIndex(contextMenu => contextMenu.element === element)

            if (index === -1) return;

            for (let i = index; i < this.stack.length; i++) {
                const menu = this.stack[i];
                if (menu.node && menu.node.parentNode) {
                    menu.node.parentNode.removeChild(menu.node);
                }
            }
            this.stack.splice(index);
        }
    }

    /** Closes all menus after an element.
     * 
     * @param {Object} element The element to close all context menus above.
     */
    closeAbove(element) {
        const index = this.findIndexOfParent(element);

        if (index === -1) {
            this.closeAll();
        } else { // Otherwise close any menus above the parent's index and append this menu
            for (let i = this.stack.length - 1; i > index; i--) {
                const menu = this.stack[i];
                if (menu.node && menu.node.parentNode) {
                    menu.node.parentNode.removeChild(menu.node);
                }
                this.stack.pop();
            }
        }
    }
  
    /** Close all context menus.
     */
    closeAll() {
        // Remove all menus
        this.stack = [];
        this.render();
    }

    render() {
        const container = document.querySelector('.contextMenuContainer');

        container.innerHTML = '';

        for (const contextMenu of this.stack) {
            container.appendChild(contextMenu.render());
        }
    }    
}
  
const menuStack = new MenuStack(); // Singleton
export default menuStack;
  