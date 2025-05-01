# 🗺️ Walkability Visualizer — CPSC 490 Senior Project

This project is an interactive data visualization tool that maps walkability across U.S. cities using four different methodologies:  
- **EPA Walkability Index**  
- **Approximate Walk Score**  
- **15-Minute City Accessibility**  
- **NDAI (Neighborhood Destination Accessibility Index)**

Users can explore how cities compare based on each metric and view visual patterns through a map-based UI built with React and D3.js.

---

## Features

- **Compare Methodologies**: Toggle between walkability models to observe differences in city rankings and spatial distribution.
- **Geospatial Visualization**: View walkability scores plotted on a U.S. map using TopoJSON and D3.
- **Interactive Tooltip**: Hover over cities to inspect detailed scores by method.
- **Custom Indices**: Includes reverse-engineered scores and PROMETHEE-inspired composite ranking.

---

## 🛠️ Installation

### 1. Clone the repo
```bash
git clone https://github.com/nawalcodes/cpsc-490.git
cd cpsc-490
```
### 2. Install dependencies
```bash
npm install
```
### 3. Start the development server
```bash
npm start
```
The app should open at http://localhost:3000
