import React, { useState } from "react";
import USMap from "./components/USMap";

// Define available walkability models
const WALKABILITY_MODELS = [
  { id: "EPA", label: "EPA National Walkability Index" },
  { id: "15MIN", label: "15-Minute City Model" },
  { id: "WALKSCORE", label: "Walk Score" },
  { id: "NDAI", label: "Neighborhood Destination Accessibility Index (NDAI)" }
];

const App = () => {
  const [selectedModel, setSelectedModel] = useState("EPA");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Walkability Visualizer</h1>

      <label htmlFor="model-select" style={{ marginRight: "10px" }}>
        Select a walkability model:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        style={{ padding: "6px 10px", fontSize: "14px" }}
      >
        {WALKABILITY_MODELS.map(model => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>

      <h2 style={{ marginTop: "20px" }}>
        Showing: {WALKABILITY_MODELS.find(m => m.id === selectedModel)?.label}
      </h2>

      {/* Pass selected model to the map */}
      <USMap model={selectedModel} />
    </div>
  );
};

export default App;
