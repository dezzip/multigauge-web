import { GaugeFace } from "/static/js/core/gauge/gaugeFace.js";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.querySelector('input[name="data"]');
  const canvas = document.getElementById("gaugeCanvas");
  const context = canvas.getContext("2d");

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Only accept .gauge files (you already set accept attribute)
    if (!file.name.endsWith(".gauge")) {
      alert("Please select a valid .gauge file");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const jsonData = JSON.parse(fileContent);

        // Deserialize to GaugeFace and draw it
        const gaugeFace = GaugeFace.fromJSON(jsonData);
        gaugeFace.draw(canvas, context);
      } catch (error) {
        console.error("Failed to parse or render the gauge file", error);
        alert("Invalid gauge file format.");
      }
    };

    reader.readAsText(file);
  });
});
