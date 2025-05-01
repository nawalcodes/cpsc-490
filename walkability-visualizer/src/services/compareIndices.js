// compareIndices.js

import fs from "fs";
import path from "path";
import { fetchEPAWalkabilityScores } from "../models/fetchEPA.js";

const STATE_TO_FIPS = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10", FL: "12", GA: "13",
  HI: "15", ID: "16", IL: "17", IN: "18", IA: "19", KS: "20", KY: "21", LA: "22", ME: "23", MD: "24",
  MA: "25", MI: "26", MN: "27", MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34",
  NM: "35", NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44", SC: "45",
  SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54", WI: "55", WY: "56"
};

function readCSV(filePath) {
  const [header, ...rows] = fs.readFileSync(filePath, "utf8").trim().split("\n");
  const cols = header.split(",");
  return rows.map(row => {
    const values = row.split(",");
    const entry = {};
    cols.forEach((col, i) => {
      entry[col.trim()] = isNaN(values[i]) ? values[i].replace(/"/g, "") : +values[i];
    });
    return entry;
  });
}

function minMaxNormalize(array, key) {
  const values = array.map(e => e[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return array.map(e => ({ ...e, [key]: ((e[key] - min) / (max - min)) * 100 }));
}

function preference(a, b) {
  return Math.max(0, a - b);
}

function prometheeII(cities, keys, weights) {
  const flows = cities.map(a => {
    let phiPlus = 0, phiMinus = 0;
    for (const b of cities) {
      if (a === b) continue;
      let preferenceAB = 0, preferenceBA = 0;
      keys.forEach(k => {
        preferenceAB += weights[k] * preference(a[k], b[k]);
        preferenceBA += weights[k] * preference(b[k], a[k]);
      });
      phiPlus += preferenceAB;
      phiMinus += preferenceBA;
    }
    const netFlow = (phiPlus - phiMinus) / (cities.length - 1);
    return { ...a, netFlow };
  });
  return flows.sort((a, b) => b.netFlow - a.netFlow);
}

async function main() {
  const cities = JSON.parse(fs.readFileSync("public/us-cities.json", "utf8"));
  const walk = readCSV("public/walk_scores.csv");
  const nda = readCSV("public/nda_index.csv");
  const fifteen = JSON.parse(fs.readFileSync("public/fifteen-minute-scores.json", "utf8"));
  const epaMap = await fetchEPAWalkabilityScores();

  const merged = cities.filter(c => c.population > 50000).map(city => {
    const match = obj => obj.name === city.name && obj.state === city.admin1_code;
    const w = walk.find(match)?.walk_score;
    const n = nda.find(match)?.nda_index;
    const f = fifteen.find(match)?.walkingPerformance;
    const fips = STATE_TO_FIPS[city.admin1_code];
    const e = epaMap.get(fips);
    return {
      name: city.name,
      state: city.admin1_code,
      walkScore: w ?? 0,
      ndaScore: n ?? 0,
      fifteenScore: f != null ? f * 100 : 0,
      epaScore: e != null ? (e / 20) * 100 : 0
    };
  }).filter(e => e.walkScore && e.ndaScore && e.fifteenScore && e.epaScore);

  // Normalize all scores
  let normalized = merged;
  ["walkScore", "ndaScore", "fifteenScore", "epaScore"].forEach(key => {
    normalized = minMaxNormalize(normalized, key);
  });

  // Apply PROMETHEE II
  const weights = {
    walkScore: 0.25,
    ndaScore: 0.25,
    fifteenScore: 0.25,
    epaScore: 0.25
  };
  const ranked = prometheeII(normalized, Object.keys(weights), weights);

  const outputPath = path.join("public", "promethee_ranking.json");
  fs.writeFileSync(outputPath, JSON.stringify(ranked, null, 2));
  console.log(`✅ Saved PROMETHEE II rankings to ${outputPath}`);
}

main();
