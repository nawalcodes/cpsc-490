// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import MapView from './pages/MapView';
// import Home from './pages/Home';
// import USMap from './components/USMap';
// import React, { useState } from 'react';
// import 'leaflet/dist/leaflet.css';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/map" element={<MapView />} />
//       </Routes>
//     </Router>
//   );
// }
// function App() {
//   const [selectedIndex, setSelectedIndex] = useState('natwalkind');

//   return (
//     <div>
//       <h1>US Walkability Map</h1>

//       <label htmlFor="score-select">Select Walkability Index: </label>
//       <select
//         id="score-select"
//         value={selectedIndex}
//         onChange={(e) => setSelectedIndex(e.target.value)}
//       >
//         <option value="natwalkind">National Walkability Index</option>
//         <option value="slc_score">Smart Location Composite</option>
//         <option value="d4a_ranked">Destination Accessibility (D4A)</option>
//         <option value="d2b_ranked">Employment Mix (D2B)</option>
//       </select>

//       <USMap selectedIndex={selectedIndex} />
//     </div>
//   );
// }

// export default App;
import React from 'react';
import WalkabilityMap from './pages/WalkabilityMap';

function App() {
  return (
    <div className="App">
      <WalkabilityMap />
    </div>
  );
}

export default App;
