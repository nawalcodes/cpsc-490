// fetchNDAI.js
import * as d3 from "d3";

// Loads and returns a Map of stateFIPS => average NDAI
export async function fetchNDAI() {
    const data = await d3.csv("/nda_index.csv");

    // Group by state and aggregate NDAI values
    const stateGroups = new Map();
    for (const row of data) {
        if (!row.state || row.nda_index === "") continue;
        const state = row.state.padStart(2, "0"); // Ensure FIPS-like format
        const score = +row.nda_index;
        if (!stateGroups.has(state)) stateGroups.set(state, []);
        stateGroups.get(state).push(score);
    }

    // Average NDAI per state
    const stateAverages = new Map(
        Array.from(stateGroups.entries()).map(([state, vals]) => [state, d3.mean(vals)])
    );

    return stateAverages;
}
