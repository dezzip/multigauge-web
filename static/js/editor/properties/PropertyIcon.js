export class PropertyIcon {
    constructor(onClick, src) {
        this.onClick = onClick
        this.src = src;
        
        this.iconNode = document.createElement('div');
        this.iconNode.className = "row-icon";

        this.iconNode.addEventListener("click", () => {
            if (this.onClick) this.onClick(this);
        });
    }

    changeSrc(newSrc) {
        this.src = newSrc;
    }

    render() {
        this.iconNode.innerHTML = '';

        const iconImg = document.createElement('img');
        iconImg.src = this.src;
        this.iconNode.appendChild(iconImg);

        return this.iconNode;
    }
}