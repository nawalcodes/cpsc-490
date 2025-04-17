// src/components/ChoroplethMap.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import useWalkabilityData from "../hooks/useWalkabilityData";
import usJson from "../assets/us-states.json"; // or counties topojson

const ChoroplethMap = () => {
    const svgRef = useRef();
    const walkabilityData = useWalkabilityData();

    useEffect(() => {
        if (!walkabilityData.length) return;

        const width = 960, height = 600;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        const projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);
        const path = d3.geoPath().projection(projection);

        const geoData = feature(usJson, usJson.objects.states || usJson.objects.counties).features;

        const walkabilityMap = new Map(
            walkabilityData.map(d => [d.GEOID.slice(0, 2), d.score])  // assumes GEOID is full 12-digit, and score is a number
        );

        const scores = Array.from(walkabilityMap.values()).filter(d => d != null);
        const color = d3.scaleSequential(d3.interpolateBlues).domain(d3.extent(scores));

        svg.selectAll("path")
            .data(geoData)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const val = walkabilityMap.get(d.properties.STATE);
                return val != null ? color(val) : "#ccc";
            })
            .attr("stroke", "#fff");

    }, [walkabilityData]);

    return (
        <div>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ChoroplethMap;
