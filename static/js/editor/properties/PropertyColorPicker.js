import { hsvToHex, hexToHsv } from "/static/js/utils.js";
import undoStack from "/static/js/editor/UndoStack.js";

export class PropertyColorPicker {
    constructor(obj, property, options = {}) {
        this.obj = obj;
        this.property = property;
        this.options = options;

        this.colorPickerNode = document.createElement('div');
        this.colorPickerNode.className = "property-color-picker";
    }

    render() {
        // TODO: revisit this, a lot seems like it could be simplified
        this.colorPickerNode.innerHTML = '';

        const satLightSquare = document.createElement('div');
        satLightSquare.className = "sat-light-square";
        satLightSquare.style.position = 'relative';
        this.colorPickerNode.appendChild(satLightSquare);

        const marker = document.createElement('div');
        marker.className = 'sat-light-marker';
        satLightSquare.appendChild(marker);

        const hueSlider = document.createElement('input');
        hueSlider.type = 'range';
        hueSlider.min = 0;
        hueSlider.max = 360;
        hueSlider.value = 0;
        hueSlider.className = "hue-slider";
        this.colorPickerNode.appendChild(hueSlider);

        // Create eyedropper button
        const eyedropperBtn = document.createElement('button');
        eyedropperBtn.textContent = '🎨'; // or use an icon
        eyedropperBtn.title = 'Pick color from screen';
        eyedropperBtn.className = 'eyedropper-btn';

        this.colorPickerNode.appendChild(eyedropperBtn);

        // Eyedropper API usage
        eyedropperBtn.addEventListener('click', async () => {
            if (!window.EyeDropper) {
                alert('Your browser does not support the EyeDropper API.');
                return;
            }

            try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();  // waits for user to pick a color
                const pickedHex = result.sRGBHex;

                // Update your color picker value & UI with the picked color
                this.obj[this.property] = pickedHex;
                const [h, s, v] = hexToHsv(pickedHex);
                hueSlider.value = h * 360;
                currentS = s;
                currentV = v;
                updateSatLightBackground();
                updateMarkerPosition(s, v);
                marker.style.backgroundColor = pickedHex;

                if (this.options.onChange) this.options.onChange();
            } catch (err) {
                console.warn('Color picking cancelled or failed:', err);
            }
        });

        /* UPDATES */
        const updateMarkerPosition = (s, v) => {
            const rect = satLightSquare.getBoundingClientRect();

            marker.style.left = `${s * rect.width}px`;
            marker.style.top = `${(1 - v) * rect.height}px`;
        };

        const updateColor = (h, s, v) => {
            const hex = hsvToHex(h / 360, s, v);
            this.obj[this.property] = hex;
            updateMarkerPosition(s, v);
            marker.style.backgroundColor = hex;

            if (hueSlider.value !== h) {
                hueSlider.value = h;
                updateSatLightBackground();
            }

            if (typeof this.options.onChange === 'function') this.options.onChange();
        };

        const updateSatLightBackground = () => {
            const hue = hueSlider.value;
            satLightSquare.style.background = `
                linear-gradient(to top, black, transparent),
                linear-gradient(to right, white, hsl(${hue}, 100%, 50%))
            `;
        };

        const initialHex = this.obj[this.property];
        marker.style.backgroundColor = initialHex;
        let initialH = 0, initialS = 1, initialV = 0.5;
    
        let currentS = 1;
        let currentV = 0.5;

        if (initialHex) {
            try {
                const [h, s, v] = hexToHsv(initialHex);

                initialH = h * 360;
                initialS = s;
                initialV = v;

                hueSlider.value = initialH;
                currentS = s;
                currentV = v;
            } catch (e) {
                console.warn("Invalid initial color:", initialHex);
                console.warn(e);
            }
        }

        let prevColor = initialHex;

        const addUndoAction = () => {
            const displayCallback = () => {
                const [h, s, v] = hexToHsv(this.obj[this.property]);
                updateColor(h * 360, s, v);
                if (typeof this.options.onChange === 'function') this.options.onChange();
            }
            undoStack.addPropertyChangeAction(this.obj, this.property, prevColor, this.obj[this.property], displayCallback);
            prevColor = this.obj[this.property];
        }

        hueSlider.addEventListener('mousedown', () => {
            prevColor = this.obj[this.property];
        });

        hueSlider.addEventListener('input', () => {
            updateSatLightBackground(); 
            updateColor(parseFloat(hueSlider.value), currentS, currentV);
        });

        hueSlider.addEventListener('mouseup', () => {
            addUndoAction();
        });

        const getRelativePos = (e) => {
            const rect = satLightSquare.getBoundingClientRect();
            let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

            const saturation = x / rect.width;
            const value = 1 - y / rect.height;

            return {
                s: saturation,
                v: value
            };
        };

        const onPick = (event) => {
            const { s, v } = getRelativePos(event);
            currentS = s;
            currentV = v;
            const h = parseFloat(hueSlider.value);
            updateColor(h, s, v);
        };

        let dragging = false;

        /* MOUSE EVENTS */
        satLightSquare.addEventListener('mousedown', (event) => {
            event.preventDefault();

            prevColor = this.obj[this.property];
            onPick(event);
            dragging = true;
        });

        window.addEventListener('mousemove', (event) => { if (dragging) onPick(event); });

        window.addEventListener('mouseup', () => {
            if (dragging) {
                dragging = false;
                addUndoAction();
            }
        });

        updateSatLightBackground();

        requestAnimationFrame(() => {
            updateMarkerPosition(initialS, initialV);
        });

        this.colorPickerNode.addEventListener('mousedown', (e) => e.stopPropagation());
        this.colorPickerNode.addEventListener('click', (e) => e.stopPropagation());

        return this.colorPickerNode;
    }
}