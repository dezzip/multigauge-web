import { PropertyRow } from "/static/js/editor/properties/PropertyRow.js";

import menuStack from "/static/js/editor/MenuStack.js";
import undoStack from "/static/js/editor/UndoStack.js";

export class PropertyList {
    constructor(obj, propertyName, options = {}) {
        this.obj = obj;
        this.propertyName = propertyName;
        this.options = options;

        this.selectedIndex = (options.selectable === true) ? 0 : -1;
        this.selectable = options.selectable;

        this.rows = [];

        this.listNode = document.createElement('div');
        this.listNode.className = "property-row-list";
    }

    createRows() {
        const objectType = this.options.objectType;
        const onChange = this.options.onChange;
        const sortMethod = this.options.sortMethod;

        this.rows = [];

        let objectList = this.obj[this.propertyName];

        // This sorts properly, but the add/remove functions stop working?
        if (typeof sortMethod === 'function') {
            objectList = [...objectList].sort(sortMethod);
        }

        for (let index = 0; index < objectList.length; index++) {
            const obj = objectList[index];
            const row = new PropertyRow();
            
            if (index === this.selectedIndex) row.rowNode.classList.add("selected");
            row.rowNode.addEventListener("click", (e) => {
                this.rows.forEach((r) => r.rowNode.classList.remove("selected"));

                this.selectedIndex = index;
                row.rowNode.classList.add("selected");
            });

            row.addObject(obj, this.options.label, this.options.onChange, this.options.rerenderOnChange);

            if (objectType) {
                row.addIcon(() => {
                    const i = this.obj[this.propertyName].indexOf(obj);
                    if (i !== -1) {
                        this.obj[this.propertyName].splice(i, 1);
                        undoStack.addRemoveFromListAction(this.obj[this.propertyName], obj, i, this.render.bind(this));
                        // TODO: This rerenders the whole list. probably could just remove the row somehow?
                        this.render(); // Re-render
                    }

                    menuStack.closeFrom(obj); // Close object's context menu if it is open

                    if (this.options.onRemove) this.options.onRemove(obj);

                    if (typeof onChange === 'function') onChange();
                }, '/static/images/subtract.png');
            }

            this.rows.push(row);
        }

        if (objectType && (this.options.max === undefined || this.options.max > objectList.length)) {
            const addRow = new PropertyRow();

            addRow.addIcon(() => {

                if (!objectType?.getDefault) {
                    console.warn("No getDefault() method provided on objectType ", objectType);
                    return;
                }

                const newItem = objectType.getDefault();
                if (this.options.onAdd) this.options.onAdd(newItem);

                this.obj[this.propertyName].push(newItem);

                undoStack.addInsertToListAction(this.obj[this.propertyName], newItem, this.render.bind(this));
                
                // Not a fan of this, but works fine as were adding to an array, not an object
                if (typeof sortMethod === 'function') {
                    this.obj[this.propertyName] = [...this.obj[this.propertyName]].sort(sortMethod);
                }

                this.render(); // Re-render

                if (typeof onChange === 'function') onChange();
            }, '/static/images/add.png');

            this.rows.push(addRow);
        }
    }

    render() {
        this.listNode.innerHTML = '';

        this.createRows();

        for (const row of this.rows) {
            this.listNode.appendChild(row.render());
        }

        return this.listNode;
    }
}