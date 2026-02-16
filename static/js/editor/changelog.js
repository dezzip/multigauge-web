export function openChangelog() {
    const overlay = document.getElementById('changelogOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    loadChangelog(); // optional: if you load from JSON
}

export function closeChangelog() {
    const overlay = document.getElementById('changelogOverlay');
    if (!overlay) return;

    overlay.style.display = 'none';
}

export async function loadChangelog() {
    const container = document.getElementById('changelogList');
    if (!container) return;

    const response = await fetch('/static/data/changelog.json');
    const data = await response.json();

    container.innerHTML = '';
    data.forEach(entry => {
        const entryDiv = document.createElement('div');

        const header = document.createElement('div');
        header.className = 'flex-row';

        const version = document.createElement('h2');
        version.className = 'version-name';
        version.textContent = entry.version;

        const date = document.createElement('h4');
        date.className = 'version-date';
        date.textContent = entry.date;

        header.appendChild(version);
        header.appendChild(date);
        entryDiv.appendChild(header);

        // Loop through sections inside changes
        entry.changes.forEach(section => {
            // Section title
            const sectionTitle = document.createElement('h3');
            sectionTitle.className = 'change-section-title';
            sectionTitle.textContent = section.section;
            entryDiv.appendChild(sectionTitle);

            // List of changes under this section
            const list = document.createElement('ul');
            list.className = 'version-changes';

            section.items.forEach(change => {
                const li = document.createElement('li');
                li.textContent = change;
                list.appendChild(li);
            });

            entryDiv.appendChild(list);
        });

        container.appendChild(entryDiv);
    });
}


// Optional initializer
export function setupChangelog() {
    const overlay = document.getElementById('changelogOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeChangelog();
            }
        });
    }

    const editorVersion = document.getElementById('editorVersion');
    if (editorVersion) {
        editorVersion.addEventListener('click', () => {
            openChangelog();
        });
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupChangelog();
});