const dropdownOverlay = document.getElementById("dropdownOverlay");
const openDropdownStack = [];

function createItem(name, context = null, disabled = null, selected = false) {
    const item = document.createElement("li");
    item.className = "dropdown-item";
    if (disabled === true) item.classList.add("disabled");
    if (selected === true) item.classList.add("selected");
    
    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    item.appendChild(nameSpan);

    if (context != null && typeof context === 'string') {
        const contextSpan = document.createElement("span");
        contextSpan.className = "dropdown-item-context";
        contextSpan.textContent = context;
        item.appendChild(contextSpan);
    }

    return item;
}

export function openDropdown(options, left, top, onSelect = null, first = true, search = false) {
    if (first) {
        dropdownOverlay.innerHTML = '';
        dropdownOverlay.classList.add("locked");
        openDropdownStack.length = 0;
    }

    const dropdownList = document.createElement("ul");
    dropdownList.className = "dropdown-list";
    dropdownList.style.left = `${left}px`;
    dropdownList.style.top = `${top}px`;
    dropdownList.addEventListener('click', (e) => e.stopPropagation());
    dropdownOverlay.appendChild(dropdownList);

    // Add to stack
    openDropdownStack.push(dropdownList);
    
    let originalOptions = [...options];

    if (first && search) {
        // Create and add search input only for the first dropdown
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search...";
        searchInput.className = "dropdown-search";
        dropdownList.appendChild(searchInput);
        addDivider(dropdownList);

        const renderOptions = (filteredOptions) => {
            // Remove all except the input
            while (dropdownList.children.length > 1) {
                dropdownList.removeChild(dropdownList.lastChild);
            }
            filteredOptions.forEach((option) => {
                addDropdownItem(option, dropdownList, onSelect);
            });
        };

        renderOptions(originalOptions);

        searchInput.addEventListener("input", () => {
            const filtered = filterDropdownOptions(originalOptions, searchInput.value.toLowerCase());
            renderOptions(filtered);
        });
    } else {
        // For nested dropdowns, no search bar, just add all items
        options.forEach((option) => {
            addDropdownItem(option, dropdownList, onSelect);
        });
    }

    // Correct horizontal overflow
    const rect = dropdownList.getBoundingClientRect();
    const overflowRight = rect.right - window.innerWidth;

    if (overflowRight > 0) {
        const adjustedLeft = left - overflowRight;
        dropdownList.style.left = `${adjustedLeft}px`;
    }

    return dropdownList;
}

function filterDropdownOptions(options, search) {
    const query = search.toLowerCase();

    return options
        .map(option => {
            // Keep dividers (empty objects)
            if (Object.keys(option).length === 0) return option;

            const name = option.name?.toLowerCase() || '';
            const context = option.context?.toLowerCase() || '';
            const nameOrContextMatches = name.includes(query) || context.includes(query);

            if (option.options && Array.isArray(option.options)) {
                // Recursively filter sub-options
                const filteredSubOptions = filterDropdownOptions(option.options, search);
                if (filteredSubOptions.length > 0 || nameOrContextMatches) {
                    return {
                        ...option,
                        options: filteredSubOptions
                    };
                }
                return null;
            }

            return nameOrContextMatches ? option : null;
        })
        .filter(Boolean); // Remove nulls
}

function removeDropdownsDeeperThan(targetDropdown) {
    const targetIndex = openDropdownStack.indexOf(targetDropdown);
    while (openDropdownStack.length > targetIndex + 1) {
        const removed = openDropdownStack.pop();
        dropdownOverlay.removeChild(removed);
    }
}

function addDivider(dropdownList) {
    const divider = document.createElement("li");
    divider.className = "dropdown-divider";
    dropdownList.appendChild(divider);
}

function addDropdownItem(option, dropdownList, onSelect = null) {
    if (Object.keys(option).length === 0) { addDivider(dropdownList); return; }

    const name     = option.name || "NO NAME";
    const context  = option.context;
    const disabled = option.disabled || false;
    const selected = option.selected || false;

    if (option.options && Array.isArray(option.options)) { // Sub-options
        const nestedItem = createItem(name, ">", disabled, selected);
        dropdownList.appendChild(nestedItem);

        nestedItem.addEventListener("mouseenter", () => {
            const stickyItem = dropdownList.querySelector(".stuck");

            if (stickyItem && stickyItem !== nestedItem) {
                stickyItem.classList.remove("stuck");
            }
            
            nestedItem.classList.add("stuck");

            removeDropdownsDeeperThan(dropdownList);

            const rect = nestedItem.getBoundingClientRect();
            openDropdown(option.options, rect.right, rect.top, onSelect, false);
        });
    } else { // Option
        const item = createItem(name, context, disabled, selected);
        dropdownList.appendChild(item);

        if (!disabled) {
            item.addEventListener("mouseenter", () => {
                const stickyItem = dropdownList.querySelector(".stuck");
                if (stickyItem) stickyItem.classList.remove("stuck");

                removeDropdownsDeeperThan(dropdownList);
            });

            item.addEventListener("click", () => {
                dropdownOverlay.innerHTML = '';
                dropdownOverlay.classList.remove("locked");
                openDropdownStack.length = 0;

                // Call both the menu and option's onSelect functions
                if (onSelect && typeof onSelect === 'function') onSelect(option);
                if (option.onSelect && typeof option.onSelect === 'function') option.onSelect();
            });   
        }
    }
}

/* 
    Options can have the following properties:

    name       - Displayed name
    context    - Optional displayed context (i.e. "Ctrl+X" or "Del")
    onSelect() - Callback function ran on selection of this option
    options    - Array of nested options that appears in another dropdown on hover
    value      - value this option represent, whether it be a index, object, e.t.c
    disabled   - whether the option is grayed out or not
    selected   - whether the option is selected or not (for select menus)

    Empty option just draws a divider
*/

export function makeActionMenu(options, labelText = "Actions") {
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const dropdownButton = document.createElement("div");
    dropdownButton.className = "dropdown-button";
    dropdown.appendChild(dropdownButton);

    const dropdownText = document.createElement("span");
    dropdownText.textContent = labelText;
    dropdownButton.appendChild(dropdownText);

    const dropdownCaret = document.createElement("span");
    dropdownCaret.textContent = "▽";
    dropdownButton.appendChild(dropdownCaret);

    dropdownButton.addEventListener("click", () => {
        const rect = dropdownButton.getBoundingClientRect();

        openDropdown(options, rect.left + window.scrollX, rect.bottom + window.scrollY);
    });

    return dropdown;
}

export function makeSelectMenu(options, labelText = "Select", onChange = null) {
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const dropdownButton = document.createElement("div");
    dropdownButton.className = "dropdown-button";
    dropdown.appendChild(dropdownButton);

    const dropdownText = document.createElement("span");
    dropdownText.textContent = labelText;
    dropdownButton.appendChild(dropdownText);

    const dropdownCaret = document.createElement("span");
    dropdownCaret.textContent = "▽";
    dropdownButton.appendChild(dropdownCaret);

    const onSelect = (option) => {
        dropdownText.textContent = option.name;

        if (onChange != null && typeof onChange === 'function') onChange(option.value);
    }

    dropdownButton.addEventListener("click", () => {
        const rect = dropdownButton.getBoundingClientRect();

        openDropdown(options, rect.left + window.scrollX, rect.bottom + window.scrollY, onSelect);
    });

    return dropdown;
}

if (dropdownOverlay != null) {
    dropdownOverlay.addEventListener('click', () => {
        // Close dropdown if clicked outside
        if (dropdownOverlay.classList.contains("locked")) {
            dropdownOverlay.innerHTML = '';
            dropdownOverlay.classList.remove("locked");
        }
    });

    dropdownOverlay.addEventListener('mousedown', (event) => {
        if (dropdownOverlay.classList.contains("locked") && event.button === 2) {
            dropdownOverlay.innerHTML = '';
            dropdownOverlay.classList.remove("locked");
        }
    });
}