import { PropertyMenu } from "/static/js/editor/properties/PropertyMenu.js";

export class ContextMenu {
    constructor(element, obj = null, propertyName = null, onChange = null, x = 0, y = 0) {
        this.element = element;
        this.obj = obj;
        this.propertyName = propertyName;
        this.onChange = onChange;
        
        this.x = x;
        this.y = y;

        this.node = document.createElement('div');
        this.node.classList.add('context-menu');

        this.propertyMenu = new PropertyMenu(this.node);

        this.initDrag();
    }

    getObject() {
        if (this.obj != null && this.propertyName != null) return this.obj[this.propertyName];

        return this.element;
    }

    changePosition(x, y) {
        this.x = x;
        this.y = y;

        this.keepInBounds();

        this.node.style.left = `${this.x}px`;
        this.node.style.top = `${this.y}px`;
    }

    keepInBounds() {
        // Get the viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (this.x < 0) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.x + this.node.offsetWidth > viewportWidth) {
            this.x = viewportWidth - this.node.offsetWidth;
        }
        if (this.y + this.node.offsetHeight > viewportHeight) {
            this.y = viewportHeight - this.node.offsetHeight;
        }
    }

    render() {
        this.node.innerHTML = '';

        this.propertyMenu.displayProperties(this.getObject(), this.onChange, this.obj, this.propertyName, true);

        this.changePosition(this.x, this.y);

        return this.node;
    }

    initDrag() {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        this.node.addEventListener('mousedown', (e) => {
            if (e.target.closest('.property')) {
                return;
            }

            isDragging = true;
            offsetX = e.clientX - this.node.offsetLeft;
            offsetY = e.clientY - this.node.offsetTop;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            this.changePosition(newX, newY);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}