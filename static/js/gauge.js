import { GaugeFace } from "/static/js/core/gauge/gaugeFace.js";

// Draw the gauge on the canvas
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gaugeCanvas");
    const context = canvas.getContext("2d");

    // Ensure postData is available and not undefined
    if (postData) {
        postData = JSON.parse(postData);
        
        // Deserialize the JSON into a GaugeFace object
        const gaugeFace = GaugeFace.fromJSON(postData);

        // Draw the gauge face on the canvas
        gaugeFace.draw(canvas, context);
    } else {
        console.error("Post data is missing!");
    }
});