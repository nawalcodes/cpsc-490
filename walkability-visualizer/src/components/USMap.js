import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { fetchEPAWalkabilityScores } from "../models/fetchEPA";

const USMap = ({ model }) => {
    const svgRef = useRef();

    useEffect(() => {
        const width = 960;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .html("");

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

        // ✅ Always render the base US counties map
        d3.json("/counties-10m.json").then(usTopo => {
            const counties = feature(usTopo, usTopo.objects.counties).features;
            svg.selectAll("path")
                .data(counties)
                .join("path")
                .attr("d", path)
                .attr("fill", "#eee")
                .attr("stroke", "#999")
                .attr("stroke-width", 0.3);
        });

        // Model-specific visualizations
        if (model === "EPA") {
            Promise.all([
                fetchEPAWalkabilityScores(),
                d3.json("/us-states.json")
            ]).then(([walkScoreMap, states]) => {
                const fipsToName = new Map(states.features.map(d => [d.properties.STATE.padStart(2, "0"), d.properties.NAME]));
                const scores = Array.from(walkScoreMap.values());
                const [min, max] = d3.extent(scores);
                const colorScale = d3.scaleSequential(d3.interpolatePuOr).domain([max, min]);

                d3.json("/counties-10m.json").then(usTopo => {
                    d3.json("/us-cities.json").then(cities => {
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

                    const counties = feature(usTopo, usTopo.objects.counties).features;
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
                            const stateName = fipsToName.get(stateFips) || "Unknown";
                            tooltip.transition().duration(200).style("opacity", 0.9);
                            tooltip.html(`<strong>${stateName}</strong><br/>Walkability Score: ${score?.toFixed(2) ?? "N/A"}`)
                                .style("left", event.pageX + 10 + "px")
                                .style("top", event.pageY - 28 + "px");
                        })
                        .on("mousemove", event => {
                            tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.transition().duration(300).style("opacity", 0);
                        });

                    // Legend
                    const legendWidth = 200;
                    const legendHeight = 10;
                    const legendMargin = 20;

                    const legendGroup = svg.append("g")
                        .attr("class", "legend")
                        .attr("transform", `translate(${width - legendWidth - legendMargin},${height - 50})`);

                    const defs = svg.append("defs");
                    const gradient = defs.append("linearGradient")
                        .attr("id", "legend-gradient")
                        .attr("x1", "0%")
                        .attr("x2", "100%")
                        .attr("y1", "0%")
                        .attr("y2", "0%");

                    const numStops = 10;
                    const step = 1 / (numStops - 1);
                    const stops = d3.range(numStops).map(i => ({
                        offset: `${i * step * 100}%`,
                        color: d3.interpolatePuOr(1 - i * step)
                    }));

                    gradient.selectAll("stop")
                        .data(stops)
                        .enter()
                        .append("stop")
                        .attr("offset", d => d.offset)
                        .attr("stop-color", d => d.color);

                    legendGroup.append("rect")
                        .attr("width", legendWidth)
                        .attr("height", legendHeight)
                        .style("fill", "url(#legend-gradient)")
                        .style("stroke", "#999")
                        .style("stroke-width", 0.5);

                    legendGroup.append("text")
                        .attr("x", 0)
                        .attr("y", -4)
                        .attr("text-anchor", "start")
                        .attr("font-size", "10px")
                        .text(min.toFixed(2));

                    legendGroup.append("text")
                        .attr("x", legendWidth)
                        .attr("y", -4)
                        .attr("text-anchor", "end")
                        .attr("font-size", "10px")
                        .text(max.toFixed(2));

                    legendGroup.append("text")
                        .attr("x", legendWidth / 2)
                        .attr("y", -16)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "11px")
                        .attr("font-weight", "bold")
                        .text("EPA Walkability Index");

                });
            });

        } else if (model === "WALK_SCORE") {
            Promise.all([
                d3.csv("/walk_scores.csv"),
                d3.json("/counties-10m.json")
            ]).then(([walkScoresRaw, usTopo]) => {
                // Filter out rows with missing/invalid data
                const walkScores = walkScoresRaw
                    .filter(d => d.lat && d.lon && !isNaN(+d.walk_score))
                    .map(d => ({
                        lat: +d.lat,
                        lon: +d.lon,
                        score: +d.walk_score
                    }));
        
                // Base US counties map
                const counties = feature(usTopo, usTopo.objects.counties).features;
                svg.selectAll("path")
                    .data(counties)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", "#eee")
                    .attr("stroke", "#999")
                    .attr("stroke-width", 0.3);
        
                const [min, max] = d3.extent(walkScores, d => d.score);
                const colorScale = d3.scaleSequential(d3.interpolatePuOr).domain([max, min]);
        
                svg.selectAll("circle.walk-point")
                    .data(walkScores)
                    .join("circle")
                    .attr("class", "walk-point")
                    .attr("cx", d => {
                        const coords = projection([d.lon, d.lat]);
                        return coords ? coords[0] : -1000;
                    })
                    .attr("cy", d => {
                        const coords = projection([d.lon, d.lat]);
                        return coords ? coords[1] : -1000;
                    })
                    .attr("r", 4)
                    .attr("fill", d => colorScale(d.score))
                    .attr("opacity", 0.8)
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(`<strong>Walk Score</strong><br/>Score: ${d.score.toFixed(0)}`)
                            .style("left", event.pageX + 10 + "px")
                            .style("top", event.pageY - 28 + "px");
                    })
                    .on("mousemove", event => {
                        tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.transition().duration(300).style("opacity", 0);
                    });
        
                // Add legend
                const legendWidth = 200;
                const legendHeight = 10;
                const legendMargin = 20;
        
                const legendGroup = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${width - legendWidth - legendMargin},${height - 50})`);
        
                const defs = svg.append("defs");
                const gradient = defs.append("linearGradient")
                    .attr("id", "legend-gradient-walk")
                    .attr("x1", "0%").attr("x2", "100%")
                    .attr("y1", "0%").attr("y2", "0%");
        
                const numStops = 10;
                const step = 1 / (numStops - 1);
                const stops = d3.range(numStops).map(i => ({
                    offset: `${i * step * 100}%`,
                    color: d3.interpolatePuOr(1 - i * step)
                }));
        
                gradient.selectAll("stop")
                    .data(stops)
                    .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);
        
                legendGroup.append("rect")
                    .attr("width", legendWidth)
                    .attr("height", legendHeight)
                    .style("fill", "url(#legend-gradient-walk)")
                    .style("stroke", "#999")
                    .style("stroke-width", 0.5);
        
                legendGroup.append("text")
                    .attr("x", 0)
                    .attr("y", -4)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(min.toFixed(0));
        
                legendGroup.append("text")
                    .attr("x", legendWidth)
                    .attr("y", -4)
                    .attr("text-anchor", "end")
                    .attr("font-size", "10px")
                    .text(max.toFixed(0));
        
                legendGroup.append("text")
                    .attr("x", legendWidth / 2)
                    .attr("y", -16)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "11px")
                    .attr("font-weight", "bold")
                    .text("Approx. Walk Score");
            });       

        } else if (model === "15MIN") {
            Promise.all([
                d3.json("/us-cities.json"),
                d3.json("/fifteen-minute-scores.json")
            ]).then(([cities, scoreData]) => {
                const scoreMap = new Map(
                    scoreData.map(d => [`${d.city},${d.state}`, d.walkingPerformance])
                );

                const enriched = cities
                    .filter(c => c.population > 50000)
                    .map(c => {
                        const id = `${c.name},${c.admin1_code}`;
                        return {
                            ...c,
                            score: scoreMap.get(id) ?? null
                        };
                    })
                    .filter(c => c.score != null);

                const [min, max] = d3.extent(enriched, d => d.score);
                const colorScale = d3.scaleSequential(d3.interpolatePuOr).domain([max, min]);

                svg.selectAll("circle.city")
                    .data(enriched)
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
                    .attr("r", 4)
                    .attr("fill", d => colorScale(d.score))
                    .attr("opacity", 0.8)
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(`<strong>${d.name}</strong><br/>15-Minute Score: ${(d.score).toFixed(1)}%`)
                            .style("left", event.pageX + 10 + "px")
                            .style("top", event.pageY - 28 + "px");
                    })
                    .on("mousemove", event => {
                        tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.transition().duration(300).style("opacity", 0);
                    });

                // Add legend
                const legendWidth = 200;
                const legendHeight = 10;
                const legendMargin = 20;

                const legendGroup = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${width - legendWidth - legendMargin},${height - 50})`);

                const defs = svg.append("defs");
                const gradient = defs.append("linearGradient")
                    .attr("id", "legend-gradient-15min")
                    .attr("x1", "0%")
                    .attr("x2", "100%")
                    .attr("y1", "0%")
                    .attr("y2", "0%");

                const numStops = 10;
                const step = 1 / (numStops - 1);
                const stops = d3.range(numStops).map(i => ({
                    offset: `${i * step * 100}%`,
                    color: d3.interpolatePuOr(1 - i * step)
                }));

                gradient.selectAll("stop")
                    .data(stops)
                    .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);

                legendGroup.append("rect")
                    .attr("width", legendWidth)
                    .attr("height", legendHeight)
                    .style("fill", "url(#legend-gradient-15min)")
                    .style("stroke", "#999")
                    .style("stroke-width", 0.5);

                legendGroup.append("text")
                    .attr("x", 0)
                    .attr("y", -4)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(min.toFixed(2));  // Keep raw scale (e.g. 0.00)

                legendGroup.append("text")
                    .attr("x", legendWidth)
                    .attr("y", -4)
                    .attr("text-anchor", "end")
                    .attr("font-size", "10px")
                    .text(max.toFixed(2));  // e.g. 6.13


                legendGroup.append("text")
                    .attr("x", legendWidth / 2)
                    .attr("y", -16)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "11px")
                    .attr("font-weight", "bold")
                    .text("15-Minute Score (%)");
            });

        } else if (model === "NDAI") {
            Promise.all([
                d3.json("/us-cities.json"),
                d3.csv("/nda_index.csv")
            ]).then(([cities, ndaData]) => {
                const ndaMap = new Map(ndaData.map(d => [`${d.name},${d.state}`, +d.nda_index]));

                const enriched = cities
                    .filter(c => c.population > 50000)
                    .map(c => {
                        const id = `${c.name},${c.admin1_code}`;
                        const score = ndaMap.get(id);
                        return { ...c, nda_index: score };
                    })
                    .filter(c => c.nda_index != null);

                const [min, max] = d3.extent(enriched, d => d.nda_index);
                const colorScale = d3.scaleSequential(d3.interpolatePuOr).domain([max, min]);

                svg.selectAll("circle.city")
                    .data(enriched)
                    .join("circle")
                    .attr("class", "city")
                    .attr("cx", d => projection([d.coordinates.lon, d.coordinates.lat])[0])
                    .attr("cy", d => projection([d.coordinates.lon, d.coordinates.lat])[1])
                    .attr("r", 4)
                    .attr("fill", d => colorScale(d.nda_index))
                    .attr("opacity", 0.8)
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(`<strong>${d.name}</strong><br/>NDAI: ${d.nda_index.toFixed(1)}`)
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
        }
    }, [model]);

    return <div className="map-container"><svg ref={svgRef}></svg></div>;
};

export default USMap;
