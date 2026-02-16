export class GrabPoint {

    static snapSettings = {
        enabled: true,
        size: 60,
        distance: 10
    };

    constructor(targetObject, xProp, yProp) {
        this.targetObject = targetObject; // The object containing the properties
        this.xProp = xProp; // Name of the x property to update
        this.yProp = yProp; // Name of the y property to update

        this.x = targetObject[xProp]; // Initial position from object
        this.y = targetObject[yProp];

        this.dragging = false;
        this.grabRadius = 5;
    }

    // Returns a new position that is snapped to the grid settings
    snapToGrid(x, y) {
        if (GrabPoint.snapSettings.enabled) {

            const snapSize = GrabPoint.snapSettings.size;
            const snapDistance = GrabPoint.snapSettings.distance;

            const snapToGridLine = (coord) => {
                const remainder = coord % snapSize;
                if (remainder <= snapDistance || remainder >= snapSize - snapDistance) {
                    return Math.round(coord / snapSize) * snapSize;
                }
                return coord;
            };
        
            const snappedX = snapToGridLine(x);
            const snappedY = snapToGridLine(y);
        
            return { x: snappedX, y: snappedY };
        } else {
            return { x: x, y: y };
        }
    }

    // Checks if the position is hovering over the grab point
    hovering(mouseX, mouseY) {
        const translatedX = mouseX - this.x;
        const translatedY = mouseY - this.y;
        
        return Math.sqrt((translatedX * translatedX) + (translatedY * translatedY)) <= this.grabRadius;
    }

    // Moves the grab point based on the provided position
    setPosition(x, y) {
        const snappedPos = this.snapToGrid(x, y);

        this.x = snappedPos.x;
        this.y = snappedPos.y;

        // Update the target object's properties dynamically
        this.targetObject[this.xProp] = this.x;
        this.targetObject[this.yProp] = this.y;
    }

    // Draws the Grab Point on a canvas
    draw(canvas, context) {

        context.fillStyle = this.dragging ? "red" : "white";  // Grab point color

        context.strokeStyle = "grey";
        context.lineWidth = 1;

        context.shadowColor = "black";
        context.shadowBlur = 20;
        context.shadowBlur = 0;

        context.beginPath();
        context.arc(this.x, this.y, this.grabRadius, 0, Math.PI * 2); // Small circle at (x, y)
        context.fill();
        context.stroke();
    }
};
