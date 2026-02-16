import { displayElementsPanel } from "/static/js/editor/elements.js";

class UndoStack {
    constructor () {
        this.history = [{ undo() {}, redo() {}, getOption: () => ({ name: "Created new Gauge Face", onSelect: () => {} }) }];
        this.index = 0;
    }

    addPropertyChangeAction(obj, property, oldValue, newValue, displayCallback = null) {
        const action = {
            undo() {
                console.warn(`Changed value of ${property} back to ${oldValue}`);
                obj[property] = oldValue;
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback(oldValue);
            },
            redo() {
                console.warn(`Changed value of ${property} to ${newValue}`);
                obj[property] = newValue;
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback(newValue);
            },
            getOption(onSelect) {
                return { name: `Changed ${property} to ${newValue}`, onSelect: onSelect };
            }
        }

        this.push(action);
    }

    addMoveListAction(list, indexFrom, indexTo) {
        const action = {
            undo() {
                console.warn(`Moved item from ${indexTo} back to ${indexFrom}`);
                const item = list.splice(indexTo, 1)[0];
                list.splice(indexFrom, 0, item);
                if (typeof displayElementsPanel === 'function') displayElementsPanel();
            },
            redo() {
                console.warn(`Moved item from ${indexFrom} to ${indexTo}`);
                const item = list.splice(indexFrom, 1)[0];
                list.splice(indexTo, 0, item);
                if (typeof displayElementsPanel === 'function') displayElementsPanel();
            },
            getOption(onSelect) {
                return { name: `Moved item from ${indexFrom} to ${indexTo}`, onSelect: onSelect };
            }
        }

        this.push(action);
    }

    addInsertToListAction(list, item, displayCallback = null, customName = null) {
        const index = list.indexOf(item);

        const action = {
            undo() {
                console.warn(`Removed ${item} from list`);

                if (index > -1) list.splice(index, 1);
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback();
            },
            redo() {
                console.warn(`Added ${item} back to list`);
                
                list.splice(index, 0, item);
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback();
            },
            getOption(onSelect) {
                return { name: customName || `Added ${item}`, onSelect: onSelect };
            }
        };

        this.push(action);
        console.log(this.history);
    }

    addRemoveFromListAction(list, item, index, displayCallback = null, customName = null) {
        const action = {
            undo() {
                list.splice(index, 0, item);
                console.warn(`Added ${item} back to list`);
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback();
            },
            redo() {
                list.splice(index, 1);
                console.warn(`Removed ${item} from list`);
                if (displayCallback != null && typeof displayCallback === 'function') displayCallback();
            },
            getOption(onSelect) {
                return { name: customName || `Removed ${item}`, onSelect: onSelect };
            }
        };

        this.push(action);
    }

    push(action) {
        if (this.index > 0) {
            this.history.splice(0, this.index);
            this.index = 0;
        }

        this.history.unshift(action);
    }

    undo() {
        console.log(this);
        if (this.index >= this.history.length) {
            console.warn("No more actions to undo");
            return;
        }

        const action = this.history[this.index];
        action.undo();
        this.index++;
    }
    
    redo() {
        if (this.index <= 0) {
            console.warn("No more actions to redo");
            return;
        }

        this.index--;
        const action = this.history[this.index];
        action.redo();
        return true;
    }

    jumpTo(index) {
        console.log(`Jumping to index ${index} in undo stack`);
        if (index < 0 || index > this.history.length) return;

        while (this.index < index) this.undo();
        while (this.index > index) this.redo();
    }

    reset() {
        this.history = [];
        this.index = 0;
    }

    getUndoOptions() {
        const options = [];

        for (let i = 0; i < this.history.length; i++) {
            const optionSelected = () => { console.log("SELECTED INDEX:", i); this.jumpTo(i); }
            const option = this.history[i].getOption(optionSelected);

            if (this.index === i) option.selected = true;

            options.push(option);
        }

        return options;
    }
}

const undoStack = new UndoStack(); // Singleton
export default undoStack;