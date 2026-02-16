import { getGaugeFace, setGrabPoints } from "/static/js/editor/gauge.js";
import { openDropdown } from "/static/js/dropdown.js";
import menuStack from "/static/js/editor/MenuStack.js";
import { displayProperties } from "/static/js/editor/properties.js";
import { displayInsertElementToolbar } from "/static/js/editor/toolbar.js";
import undoStack from "/static/js/editor/UndoStack.js";

export let selectedElement = null;
let selectedElementParent = null;

let copiedElement = null;

const deleteGroup = document.getElementById("deleteGroup");

export function selectElement(element, parent = null) {
    if (selectedElement === element) return;

    menuStack.closeAll(); // Close all open context menus

    selectedElement = element;
    selectedElementParent = parent;
    displayProperties(element);

    deleteGroup.classList.remove("hide-section");

    // Add grab points if element has them
    if (element.createGrabPoints !== undefined) {
        setGrabPoints(element.createGrabPoints());
    } else {
        setGrabPoints();
    }
}

export function deselectElement(element = null) {
    if (element === null || element === selectedElement) {
        selectedElement = null;
        selectedElementParent = null;
        menuStack.closeAll();
        displayProperties();
        setGrabPoints();
        displayElementsPanel();

        deleteGroup.classList.add("hide-section");
    }
}

export function deleteSelectedElement() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    if (index > -1) {
        undoStack.addRemoveFromListAction(selectedElementParent.elements, selectedElement, index, displayElementsPanel);
        selectedElementParent.elements.splice(index, 1);
        deselectElement();
        displayElementsPanel();
    }
}

function duplicateSelectedElement() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    if (index > -1) {
        const gaugeValue = selectedElementParent?.gaugeValue || null;
        const cloned = selectedElement.clone(gaugeValue);
        
        selectedElementParent.elements.splice(index + 1, 0, cloned);
        undoStack.addInsertToListAction(selectedElementParent.elements, cloned, displayElementsPanel, `Duplicated ${selectedElement.constructor.name}`);
        displayElementsPanel();
    }
}

function toggleSelectedElementVisibility() {
    if (!selectedElement) return;

    selectedElement.visible = !selectedElement.visible;
    displayElementsPanel();
}

function copySelectedElement() {
    if (selectElemented == null) return;

    copiedElement = selectedElement;
}

function pasteIntoSelectedElement() {
    if (copiedElement == null || selectedElement == null) return;

    if (canAddType(selectedElement, copiedElement.constructor)) {
        const cloned = copiedElement.clone();
        selectedElement.elements.push(cloned);
        undoStack.addInsertToListAction(selectedElement.elements, cloned, displayElementsPanel, `Pasted ${selectedElement.constructor.name}`);
        displayElementsPanel();
    } else if (canAddType(selectedElementParent, copiedElement.constructor)) {
        const cloned = copiedElement.clone();
        selectedElementParent.elements.push(cloned);
        undoStack.addInsertToListAction(selectedElementParent.elements, cloned, displayElementsPanel, `Pasted ${selectedElement.constructor.name}`);
        displayElementsPanel();
    }
}

function bringSelectedElementForward() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    if (index <= 0) return;

    [selectedElementParent.elements[index], selectedElementParent.elements[index - 1]] = [selectedElementParent.elements[index - 1], selectedElementParent.elements[index]];
    undoStack.addMoveListAction(selectedElementParent.elements, index, index - 1, displayElementsPanel);
    displayElementsPanel();
}

function sendSelectedElementBackward() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    if (index == -1 || index >= selectedElementParent.elements.length - 1) return;

    [selectedElementParent.elements[index], selectedElementParent.elements[index + 1]] = [selectedElementParent.elements[index + 1], selectedElementParent.elements[index]];
    undoStack.addMoveListAction(selectedElementParent.elements, index, index + 1, displayElementsPanel);
    displayElementsPanel();
}

function bringSelectedElementToFront() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    if (index <= 0) return;

    [selectedElementParent.elements[index], selectedElementParent.elements[0]] = [selectedElementParent.elements[0], selectedElementParent.elements[index]];
    undoStack.addMoveListAction(selectedElementParent.elements, index, 0, displayElementsPanel);
    displayElementsPanel();
}

function sendSelectedElementToBack() {
    if (!(selectedElementParent && selectedElement)) return;

    const index = selectedElementParent.elements.indexOf(selectedElement);
    const last = selectedElementParent.elements.length - 1;
    if (index == -1 || index >= last) return;
    
    [selectedElementParent.elements[index], selectedElementParent.elements[last]] = [selectedElementParent.elements[last], selectedElementParent.elements[index]];
    undoStack.addMoveListAction(selectedElementParent.elements, index, last, displayElementsPanel);
    displayElementsPanel();
}


export function displayElementsPanel() {
    const leftPanel = document.getElementById("leftPanel");
    const listElement = document.getElementById("elementList");

    const propertiesPanel = document.getElementById("propertiesPanel");

    // Show the properties panel
    propertiesPanel.classList.toggle("hidden", false);

    // Retract the left panel
    leftPanel.classList.toggle("extended", false);

    listElement.innerHTML = ""; // Clear the current list
    
    const gaugeFaceListItem = createListItem(getGaugeFace()); // Create a list item for the gaugeFace
    
    listElement.appendChild(gaugeFaceListItem); // Add the gauge face element to the list
}



export let draggingList = null; // The list of elements being dragged from
export let draggingIndex = null; // The index of the element being dragged (draggedElement = draggingList[draggingIndex])



function createListItem(element, parent = null, level = 0) {
    const elementContainer = document.createElement("div");
    elementContainer.className = "element-container";

    /*
        MAIN ELEMENT
    */

    const elementDiv = document.createElement("div");
    elementDiv.className = "element-item";
    elementDiv.style.paddingLeft = `${level * 20 + 5}px`;

    elementDiv.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const x = event.clientX; // X position within the viewport
        const y = event.clientY; // Y position within the viewport

        const options = createElementContextMenuOptions(element, parent);
        
        openDropdown(options, x, y);

        event.stopPropagation(); // Prevent the click from propagating to the parent element
    });

    elementDiv.addEventListener("click", () => {
        if (selectedElement != element) {
            selectElement(element, parent);
        } else {
            deselectElement();
        }

        displayElementsPanel(); // Update the elements panel to show the new selected element
    });

    if (element === selectedElement) {
        document.getElementById("selected")?.removeAttribute("id"); // Remove the id from any currently selected element
        
        elementDiv.id = "selected"; // Set this element to "selected"
    }

    // Container for element image and name
    const contentDiv = document.createElement("div");
    contentDiv.style.display = "flex";
    contentDiv.style.alignItems = "center";
    contentDiv.style.gap = "10px";

    // Image for element
    const elementIcon = document.createElement('div');
    elementIcon.className = "element-icon";

    let img = document.createElement("img");
    img.src = element.constructor.image;
    elementIcon.appendChild(img);
    elementDiv.appendChild(elementIcon);

    // Text for element
    const textNode = document.createElement("span");
    textNode.textContent = element.constructor.name;
    textNode.style.gridArea = "name";

    // Append image and text to the content div
    elementDiv.appendChild(textNode);

    // Right-aligned container for visibility toggle button
    const rightDiv = document.createElement("div");
    rightDiv.className = "visibility";

    // Visibility Toggle Button
    if (element && "visible" in element) {
        const visibleButton = document.createElement("button");
        visibleButton.classList.add("mini-icon");

        const visibleImg = document.createElement("img");
        visibleImg.src = element.visible ? "/static/images/visible.png" : "/static/images/not_visible.png";
        visibleButton.appendChild(visibleImg);

        visibleButton.onclick = (e) => {
            e.stopPropagation();
            element.visible = !element.visible;
            visibleImg.src = element.visible ? "/static/images/visible.png" : "/static/images/not_visible.png";
        };

        rightDiv.appendChild(visibleButton);
    }

    // Append the right-aligned container to the element div
    elementDiv.appendChild(rightDiv);

    // Append the element div to the final list element
    elementContainer.appendChild(elementDiv);

    /*
        CHILD ELEMENTS
    */

    // Expand/Collapse Button Div
    const expandDiv = document.createElement("div");
    expandDiv.className = "expand-button";
    elementDiv.prepend(expandDiv); // Add the expand button to the left side of the element

    // Check if the element has an "elements" property
    // This property is used to display child elements nested inside this element
    if ("elements" in element && element.elements.length > 0) {
        // Create the child elements div
        const childrenDiv = document.createElement("div");
        childrenDiv.className = "element-children";

        elementContainer.appendChild(childrenDiv); // Append the children div to the list item

        // Add all the child elements to the list
        element.elements.map((el, index) => {
            // Create a new list item using the child element
            const child = createListItem(el, element, level + 1);

            const childElementDiv = child.getElementsByClassName("element-item")[0];

            childElementDiv.draggable = true;

            // Set the dragging class when the drag ends & set draggingList and draggingIndex
            childElementDiv.addEventListener('dragstart', () => {
                childElementDiv.classList.add('dragging');

                draggingList = element.elements;
                draggingIndex = index;
            });

            // Swap elements on valid drop
            childElementDiv.addEventListener('drop', () => {
                // Checks if the list we are dragging from is the same as the list we're dropping into
                if (draggingList === element.elements) {
                    // Swap the indexes
                    [element.elements[index], element.elements[draggingIndex]] = [element.elements[draggingIndex], element.elements[index]];
                    undoStack.addMoveListAction(element.elements, draggingIndex, index, displayElementsPanel);
                    displayElementsPanel();
                }
                // TODO: maybe add the ability to drag to & from different lists in two different (but same type) elements
            });

            childElementDiv.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            // Remove the dragging class when the drag ends & reset draggingList and draggingIndex
            childElementDiv.addEventListener('dragend', () => {
                childElementDiv.classList.remove('dragging');

                draggingList = null;
                draggingIndex = null;
            });

            // Add the child to the children list
            childrenDiv.appendChild(child)
        });

        // Expand/Collapse Button (only if children exist)
        let isExpanded = true; // Open by default

        const toggleImg = document.createElement("img");
        toggleImg.src = "/static/images/down.png"; // Default to open

    
        // Toggle Expand/Collapse on click
        toggleImg.onclick = (e) => {
            e.stopPropagation();
            isExpanded = !isExpanded;
            childrenDiv.style.display = isExpanded ? "block" : "none";
            toggleImg.src = isExpanded ? "/static/images/down.png" : "/static/images/right.png";
        };
    
        expandDiv.appendChild(toggleImg);     
    }

    return elementContainer; // Return the list item
}

function canAddType(element, type) {
    if (typeof element.getInsertOptions !== 'function') return false;

    const insertOptions = element.getInsertOptions();
    
    return insertOptions.some(option => option.elementType === type);
}

function createElementContextMenuOptions(element, parent = null) {
    const options = [];

    const hasAddElements = typeof element.getInsertOptions === "function";
    const hasParent = parent != null;

    const index = hasParent ? parent.elements.indexOf(element) : -1;
    const moreThanOneInParent = hasParent && parent.elements.length > 1;
    const isNotFirstIndex = moreThanOneInParent && index !== 0;
    const isNotLastIndex  = moreThanOneInParent && index !== parent.elements.length - 1;
    const hasVisible = element.visible != null;

    let canPasteToParent = false;
    let canPasteToElement = false;

    if (copiedElement != null) {
        if (hasParent) canPasteToParent = canAddType(parent, copiedElement.constructor);
        canPasteToElement = canAddType(element, copiedElement.constructor);
    }

    const pasteable = copiedElement != null && (canPasteToParent || canPasteToElement);

    if (hasAddElements) {
        const insertOptions = element.getInsertOptions();

        const elementOptions = [
            {
                name: "Open Insert Panel", context: "Ctrl+I",
                onSelect: () => {
                    displayInsertElementToolbar(element);
                    displayElementsPanel();
                }
            },
            { /* Divider */ },
            ...insertOptions.map(option => {
                if (Object.keys(option).length === 0) {
                    return {}; // Divider
                }

                const { elementType, args = [] } = option;

                return {
                    name: elementType.name,
                    onSelect: () => {
                        const newElement = new elementType(...args);
                        element.elements.push(newElement);
                        
                        undoStack.addInsertToListAction(element.elements, newElement, displayElementsPanel);

                        selectElement(newElement, element);
                        displayElementsPanel();
                    }
                };
            })
        ];

        options.push({ name: "Insert", options: elementOptions });
    } else {
        options.push({ name: "Insert", disabled: true });
    }

    options.push({ /* Divider */ });

    options.push({
        name: "Copy",
        context: "Ctrl+C",
        disabled: !hasParent,
        onSelect: copySelectedElement
    });

    options.push({
        name: "Paste",
        context: "Ctrl+V",
        disabled: !pasteable,
        onSelect: pasteIntoSelectedElement
    });

    options.push({
        name: "Duplicate",
        context: "Ctrl+D",
        disabled: !hasParent,
        onSelect: duplicateSelectedElement
    });

    options.push({
        name: "Delete", context: "Del",
        disabled: !hasParent,
        onSelect: deleteSelectedElement
    });

    options.push({ /* Divider */ });

    options.push({
        name: "Bring to front", context: "Ctrl+]",
        disabled: !isNotFirstIndex,
        onSelect: bringSelectedElementToFront
    });

    options.push({
        name: "Send to back", context: "Ctrl+[",
        disabled: !isNotLastIndex,
        onSelect: sendSelectedElementToBack
    });

    options.push({
        name: "Bring forward", context: "]",
        disabled: !isNotFirstIndex,
        onSelect: bringSelectedElementForward
    });

    options.push({
        name: "Send backward", context: "[",
        disabled: !isNotLastIndex,
        onSelect: sendSelectedElementBackward
    });

    options.push({ /* Divider */ });

    options.push({
        name: "Show/Hide",
        context: "Ctrl+H",
        disabled: !hasVisible,
        onSelect: toggleSelectedElementVisibility
    });

    return options;
}

const shortcutActions = {
    'ctrl+c': copySelectedElement,
    'ctrl+v': pasteIntoSelectedElement,
    'ctrl+d': duplicateSelectedElement,
    'ctrl+h': toggleSelectedElementVisibility,
    ']':      bringSelectedElementForward,
    'ctrl+]': bringSelectedElementToFront,
    '[':      sendSelectedElementBackward,
    'ctrl+[': sendSelectedElementToBack,
    'ctrl+i': () => { displayInsertElementToolbar(selectedElement); },
    'ctrl+z': () => { undoStack.undo(); },
    'ctrl+y': () => { undoStack.redo(); },
    'ctrl+shift+z': () => { undoStack.redo(); },
    'delete': deleteSelectedElement
}

// Shortcuts
document.addEventListener('keydown', function(event) {
    if (!selectedElement) return; // only run if there is a selected element

    let key = '';
    if (event.ctrlKey) key += 'ctrl+';
    if (event.shiftKey) key += 'shift+';
    key += event.key.toLowerCase();

    console.log("Key pressed:", key);

    if (shortcutActions[key]) {
        event.preventDefault();
        shortcutActions[key]();
    }
});