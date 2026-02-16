import { displayElementsPanel, selectedElement, selectElement, deleteSelectedElement } from "/static/js/editor/elements.js"
import { getGaugeFace } from "/static/js/editor/gauge.js";

const toolbeltMenu = document.getElementById("toolbeltMenu");

export function closeToolbarMenu() {
    toolbeltMenu.setAttribute('data-screen', 'closed');
    toolbeltMenu.classList.remove("open");
}

export function displayInsertElementToolbar(element) {
    if (!element || !element.getInsertOptions) {
        console.warn("Invalid element provided to displayInsertElementToolbar");
        return;
    }

    toolbeltMenu.innerHTML = '';
    toolbeltMenu.setAttribute('data-screen', 'insert');
    toolbeltMenu.classList.add("open");

    const toolbeltElementSelect = document.createElement('div');
    toolbeltElementSelect.className = "toolbelt-element-select";
    toolbeltMenu.appendChild(toolbeltElementSelect);

    const insertOptions = element.getInsertOptions();

    insertOptions.forEach(option => {
        if (Object.keys(option).length === 0) return; // Skip divider entries

        const { elementType, args = [] } = option;

        const toolbeltElement = document.createElement('div');
        toolbeltElement.className = "toolbelt-element";
        toolbeltElement.textContent = elementType.name;
        toolbeltElementSelect.appendChild(toolbeltElement);

        toolbeltElement.addEventListener("click", () => {
            const newElement = new elementType(...args);
            element.elements.push(newElement);
            
            selectElement(newElement, element);
            displayElementsPanel();

            closeToolbarMenu();
            addElementButton.classList.remove("active");
        });

        toolbeltElement.addEventListener("mouseenter", () => {
            toolbeltElementPreviewAnimation.src = elementType.previewGif || "/static/images/placeholder.jpg";
            toolbeltElementPreviewDescription.textContent = elementType.description || elementType.name || "No description";
        });
    });

    /* PREVIEW */
    const toolbeltElementPreview = document.createElement('div');
    toolbeltElementPreview.className = "toolbelt-element-preview";
    toolbeltMenu.appendChild(toolbeltElementPreview);

    const toolbeltElementPreviewAnimation = document.createElement('img');
    toolbeltElementPreviewAnimation.className = "toolbelt-element-preview-animation";
    toolbeltElementPreviewAnimation.src = "/static/images/placeholder.jpg";
    toolbeltElementPreview.appendChild(toolbeltElementPreviewAnimation);

    const toolbeltElementPreviewDescription = document.createElement('h5');
    toolbeltElementPreviewDescription.className = "toolbelt-element-preview-animation";
    toolbeltElementPreviewAnimation.textContent = "description";
    toolbeltElementPreview.appendChild(toolbeltElementPreviewDescription);
}

const addElementButton = document.getElementById("toolbeltAddElement");

if (addElementButton) {
    addElementButton.addEventListener("click", () => {
        const toolbeltMenu = document.getElementById("toolbeltMenu");
        if (toolbeltMenu.classList.contains("open")) {
            closeToolbarMenu();
            addElementButton.classList.remove("active");
        } else {
            if (selectedElement === null) selectElement(getGaugeFace());
            displayElementsPanel(); // Change this so select element updates the highlight

            displayInsertElementToolbar(selectedElement);

            addElementButton.classList.add("active");
        }
    });
}

const deleteElementButton = document.getElementById("toolbeltRemoveElement");

if (deleteElementButton) {
    deleteElementButton.addEventListener("click", () => {
        deleteSelectedElement();
    });
}
