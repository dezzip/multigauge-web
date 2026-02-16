import { GaugeFace } from "/static/js/core/gauge/GaugeFace.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvases = document.querySelectorAll(".post-canvas");

    canvases.forEach((canvas) => {
        const postId = canvas.id.split("-")[1]; // Extract the post ID from the canvas ID
        const gaugeDataElement = document.getElementById(`gaugeData-${postId}`);

        let gaugeData;

        try {
            gaugeData = JSON.parse(gaugeDataElement.textContent); // Parse the JSON data
            if (typeof gaugeData === "string") {
                gaugeData = JSON.parse(gaugeData);
            }
        } catch (error) {
            console.error(`Failed to parse JSON for post ID ${postId}:`, error);
            return;
        }

        console.log("Loaded JSON:", gaugeData);

        const context = canvas.getContext("2d");
        const loadedGaugeFace = GaugeFace.fromJSON(gaugeData); // Deserialize the GaugeFace
        
        console.log("GaugeFace:", loadedGaugeFace);

        loadedGaugeFace.draw(canvas, context); // Draw the GaugeFace on the canvas
    });
});