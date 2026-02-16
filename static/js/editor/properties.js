import { PropertyMenu } from "/static/js/editor/properties/PropertyMenu.js";

export function displayProperties(element) {
    const menuContainer = document.getElementById('properties');
    const menu = new PropertyMenu(menuContainer);
    menu.displayProperties(element);
}