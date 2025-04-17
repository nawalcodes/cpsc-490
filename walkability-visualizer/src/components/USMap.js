import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const USMap = () => {
    const svgRef = useRef();

    useEffect(() => {
        const width = 960;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
        const path = d3.geoPath().projection(projection);

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "8px")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("opacity", 0);

        Promise.all([
            d3.json("/counties-10m.json"),
            fetchWalkabilityScores(),
            d3.json("/us-cities.json")
        ]).then(([usTopo, walkScoreMap, cities]) => {
            const counties = feature(usTopo, usTopo.objects.counties).features;

            const scores = Array.from(walkScoreMap.values());
            const [min, max] = d3.extent(scores);
            const colorScale = d3.scaleSequential(d3.interpolatePuOr).domain([max, min]);

            // Draw counties
            svg.selectAll("path")
                .data(counties)
                .join("path")
                .attr("d", path)
                .attr("fill", d => {
                    const stateFips = d.id.slice(0, 2);
                    const score = walkScoreMap.get(stateFips);
                    return score != null ? colorScale(score) : "#ccc";
                })
                .attr("stroke", "#999")
                .attr("stroke-width", 0.3)
                .on("mouseover", (event, d) => {
                    const stateFips = d.id.slice(0, 2);
                    const score = walkScoreMap.get(stateFips);
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`<strong>State FIPS:</strong> ${stateFips}<br/><strong>Avg Walkability:</strong> ${score?.toFixed(2) ?? "N/A"}`)
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY - 28 + "px");
                })
                .on("mousemove", event => {
                    tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(300).style("opacity", 0);
                });

            // Filter and plot city centroids
            const filteredCities = cities.filter(city => city.population > 50000);
            svg.selectAll("circle.city")
                .data(filteredCities)
                .join("circle")
                .attr("class", "city")
                .attr("cx", d => {
                    const coords = projection([d.coordinates.lon, d.coordinates.lat]);
                    return coords ? coords[0] : -1000;
                })
                .attr("cy", d => {
                    const coords = projection([d.coordinates.lon, d.coordinates.lat]);
                    return coords ? coords[1] : -1000;
                })
                .attr("r", 2.5)
                .attr("fill", "black")
                .attr("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`<strong>${d.name}</strong><br/>Population: ${d.population.toLocaleString()}`)
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY - 28 + "px");
                })
                .on("mousemove", event => {
                    tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(300).style("opacity", 0);
                });
        });

        async function fetchWalkabilityScores() {
            const stateFips = Array.from({ length: 56 }, (_, i) => String(i + 1).padStart(2, "0"));
            const scoreMap = new Map();

            for (const fips of stateFips) {
                const url = `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0/query?where=STATEFP='${fips}'&outFields=NatWalkInd&f=json&returnGeometry=false&resultRecordCount=1000`;
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const avg = d3.mean(data.features, d => +d.attributes.NatWalkInd);
                        scoreMap.set(fips, avg);
                    }
                } catch (err) {
                    console.warn(`Failed to load walkability for state ${fips}`, err);
                }
            }

            return scoreMap;
        }
    }, []);

    return <svg ref={svgRef}></svg>;
};

export default USMap;
