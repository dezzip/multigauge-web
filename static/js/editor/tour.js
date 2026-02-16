import { selectedElement, deselectElement } from "/static/js/editor/elements.js";
import { getGaugeFace } from "/static/js/editor/gauge.js";
import { closeToolbarMenu } from "/static/js/editor/toolbar.js";
import { openChangelog } from "/static/js/editor/changelog.js";

const currentVersion = "v0.2.0-alpha"
window.addEventListener('DOMContentLoaded', () => {
	// Wait for Shepherd to load
	if (typeof Shepherd === 'undefined') {
		console.error('Shepherd is not defined. Check if the library is loaded before this file.');
		return;
	}

	let firstVisit = false;
	if (!localStorage.getItem('firstVisitDone')) {
		firstVisit = true;
		localStorage.setItem('firstVisitDone', 'true');
	} else {
		const lastVisitedVersion = localStorage.getItem("lastVisitedVersion");
		console.log(lastVisitedVersion)
		if (lastVisitedVersion !== currentVersion) {
			openChangelog();
		}
	}

	localStorage.setItem("lastVisitedVersion", currentVersion);

	if (firstVisit) {
		startTutorial(true);
	}
});

function startTutorial(firstVisit) {
	const tour = new Shepherd.Tour({
		useModalOverlay: true,
		defaultStepOptions: {
		scrollTo: true,
		cancelIcon: { enabled: true },
		classes: 'shepherd-theme-default',
		}
	});

	console.log(tour);

	if (firstVisit) {
		tour.addStep({
		title: 'Getting Started',
		text: 'This is your first visit. Would you like to take a short tutorial of the editor?',
		buttons: [
			{ text: 'Yes', action: tour.next },
			{ text: 'No', action: tour.complete }
		]
		});
	} else {
		tour.addStep({
		title: 'Getting Started',
		text: 'Welcome to the editor! This is a quick tutorial of all the features.',
		buttons: [
			{ text: 'Next', action: tour.next },
		]
		});
	}

	tour.addStep({
		title: 'Elements 1/2',
		text: 'This panel shows the elements in the current gauge face.',
		attachTo: { element: '#elementList', on: 'left' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		id: 'elements-select-step',
		title: 'Elements 2/2',
		text: 'Select an element to view its properties.',
		attachTo: { element: '#elementList', on: 'left' },
		when: {
			show() {
				function update() {
				if (selectedElement !== null) {
					clearInterval(interval);
					tour.next();
				}
				}

				const interval = setInterval(update, 100);

				return () => clearInterval(interval);
			}
		}
	});

	tour.addStep({
		title: 'Properties',
		text: 'This panel will display the properties of the currently selected element.',
		attachTo: { element: '#propertiesPanel', on: 'right' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		title: 'Gauge View',
		text: 'This panel displays a live view of the gauge face.',
		attachTo: { element: '#gaugeFace', on: 'top' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		title: 'Toolbar',
		text: 'The toolbar has various useful buttons for editing the gauge face.',
		attachTo: { element: '#toolbelt', on: 'top' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		title: 'Add Element 1/2',
		text: 'Click this button to open a menu of elements.',
		attachTo: { element: '#toolbeltAddElement', on: 'top' },
		when: {
			show() {
				function update() {
				if (document.getElementById("toolbeltMenu").getAttribute('data-screen') === 'insert') {
					clearInterval(interval);
					tour.next();
				}
				}

				const interval = setInterval(update, 100);

				return () => clearInterval(interval);
			}
		}
	});

	tour.addStep({
		title: 'Add Element 2/2',
		text: 'Select an element to add it to the gauge face.',
		attachTo: { element: '#toolbeltMenu', on: 'top' },
		when: {
			show() {
				function update() {
				if (getGaugeFace().elements.length > 0) {
					clearInterval(interval);
					tour.next();
				}
				}

				const interval = setInterval(update, 100);

				return () => clearInterval(interval);
			}
		}
	});

	tour.addStep({
		title: 'Values',
		text: 'If any elements in the gauge face use a value, they will be displayed here.',
		attachTo: { element: '#valuesPanel', on: 'top' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		title: 'Delete Element 1/2',
		text: 'You can also delete the currently selected element with this button.',
		attachTo: { element: '#toolbeltRemoveElement', on: 'top' },
		buttons: [
			{ text: 'Next', action: tour.next }
		]
	});

	tour.addStep({
		title: 'Delete Element 2/2',
		text: 'Click the button to delete the newly added element.',
		attachTo: { element: '#toolbeltRemoveElement', on: 'top' },
		when: {
			show() {
				function update() {
					if (getGaugeFace().elements.length <= 0) {
						clearInterval(interval);
						tour.next();
					}
				}

				const interval = setInterval(update, 100);

				return () => clearInterval(interval);
			}
		}
	});

	tour.addStep({
		title: 'Tutorial',
		text: 'If you ever need to access this tutorial again, you can access it with this button.',
		attachTo: { element: '#helpButton', on: 'bottom' },
		buttons: [
			{ text: 'Finish', action: tour.complete }
		]
	});

	tour.start();
}

const helpButton = document.getElementById("helpButton");

helpButton.addEventListener("click", () => {
	startTutorial(false);
});