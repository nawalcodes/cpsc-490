// fetchEPA.js
import * as d3 from "d3";

export async function fetchEPAWalkabilityScores() {
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
