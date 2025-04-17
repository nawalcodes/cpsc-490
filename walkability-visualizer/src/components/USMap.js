// import React, { useEffect, useRef } from 'react';
// import * as d3 from 'd3';
// import * as topojson from 'topojson-client';

// function USMap() {
//   const ref = useRef();

//   useEffect(() => {
//     fetch('/us-states.json') 
//       .then(res => res.json())
//       .then(geoData => {
//         const svg = d3.select(ref.current);
//         const width = 960;
//         const height = 600;

//         const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
//         const path = d3.geoPath().projection(projection);

//         svg.attr('width', width).attr('height', height);

//         svg.append('g')
//           .selectAll('path')
//           .data(geoData.features)
//           .enter()
//           .append('path')
//           .attr('d', path)
//           .attr('fill', '#eee')
//           .attr('stroke', '#333')
//           .attr('stroke-width', 1);
//       });
//   }, []);

//   return <svg ref={ref}></svg>;
// }

// export default USMap;
// import React, { useEffect, useRef, useState } from 'react';
// import * as d3 from 'd3';

// const WIDTH = 960;
// const HEIGHT = 600;

// const USMap = ({ selectedIndex }) => {
//   const svgRef = useRef();
//   const [geoData, setGeoData] = useState(null);

//   // Fetch GeoJSON from FastAPI
//   useEffect(() => {
//     fetch('http://localhost:8000/api/walkability')
//       .then(res => res.json())
//       .then(data => setGeoData(data))
//       .catch(err => console.error('Failed to fetch geojson:', err));
//   }, []);

//   // Render map when data or selectedIndex changes
//   useEffect(() => {
//     if (!geoData) return;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll('*').remove(); // clear previous render

//     const projection = d3.geoAlbersUsa().translate([WIDTH / 2, HEIGHT / 2]).scale(1000);
//     const path = d3.geoPath().projection(projection);

//     const scores = geoData.features.map(f => f.properties[selectedIndex]);
//     const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
//       .domain([d3.min(scores), d3.max(scores)]);

//     svg.attr('width', WIDTH).attr('height', HEIGHT);

//     svg.selectAll('path')
//       .data(geoData.features)
//       .enter()
//       .append('path')
//       .attr('d', path)
//       .attr('fill', d => {
//         const score = d.properties[selectedIndex];
//         return score != null ? colorScale(score) : '#ccc';
//       })
//       .attr('stroke', '#333')
//       .attr('stroke-width', 0.25);
//   }, [geoData, selectedIndex]);

//   return (
//     <div>
//       <svg ref={svgRef}></svg>
//     </div>
//   );
// };

// export default USMap;
// import React, { useEffect, useRef, useState } from 'react';
// import * as d3 from 'd3';

// const USMap = () => {
//   const svgRef = useRef();
//   const [geoData, setGeoData] = useState(null);

//   useEffect(() => {
//     fetch('http://localhost:8000/map_data') // adjust if necessary
//       .then((res) => res.json())
//       .then((data) => {
//         setGeoData(data);
//       });
//   }, []);

//   useEffect(() => {
//     if (!geoData) return;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll('*').remove(); // clear previous renders

//     const width = 960;
//     const height = 600;

//     const projection = d3.geoAlbersUsa(); // uses lower 48 + Alaska + Hawaii projection
//     const path = d3.geoPath().projection(projection);

//     // Create a fitting scale based on feature bounds
//     projection.fitSize([width, height], geoData);

//     svg
//       .attr('viewBox', `0 0 ${width} ${height}`)
//       .attr('preserveAspectRatio', 'xMidYMid meet');

//     svg
//       .selectAll('path')
//       .data(geoData.features)
//       .enter()
//       .append('path')
//       .attr('d', path)
//       .attr('stroke', '#333')
//       .attr('fill', '#b3cde0');
//   }, [geoData]);

//   return (
//     <div>
//       <h1>US Walkability Map</h1>
//       <svg ref={svgRef} width="100%" height="600px" />
//     </div>
//   );
// };

// export default USMap;
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const USMap = () => {
  const svgRef = useRef();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/map_data")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load data:", err));
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const width = 960;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#d3d3d3")
      .attr("stroke", "#333");
  }, [geoData]);

  return (
    <div>
      <h2>US Walkability Map</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default USMap;
