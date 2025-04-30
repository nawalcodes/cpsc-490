// walkScoreEstimator.js

import fetch from "node-fetch";
import fs from "fs";
import { distance, point } from "@turf/turf";
import path from "path";

// Configuration
const POINTS = [
  { lat: 47.608013, lon: -122.335167 }, // Example: downtown Seattle
];

const CATEGORIES = [
  {
    name: "grocery",
    tags: ["shop=supermarket", "shop=grocery"],
    weight: 0.25,
  },
  {
    name: "school",
    tags: ["amenity=school"],
    weight: 0.2,
  },
  {
    name: "restaurant",
    tags: ["amenity=restaurant", "amenity=cafe"],
    weight: 0.15,
  },
  {
    name: "park",
    tags: ["leisure=park"],
    weight: 0.15,
  },
  {
    name: "retail",
    tags: ["shop"],
    exclude: ["shop=supermarket", "shop=grocery"],
    weight: 0.15,
  },
  {
    name: "healthcare",
    tags: ["amenity=hospital", "amenity=clinic"],
    weight: 0.1,
  },
];

const DISTANCE_BANDS = [400, 800, 1200, 1600, 2000];
const BAND_SCORES = [5, 4, 3, 2, 1]; // Corresponding to distance bands

async function fetchAmenities(lat, lon, tag) {
  const [k, v] = tag.split("=");
  const overpassQuery = `
    [out:json];
    node["${k}"${v ? `="${v}"` : ""}](around:2000,${lat},${lon});
    out;
  `;
  const url = "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    body: overpassQuery,
  });
  const data = await res.json();
  return data.elements;
}

function scoreAmenities(pt, amenities) {
  return amenities.reduce((score, a) => {
    const dist = distance(
      point([pt.lon, pt.lat]),
      point([a.lon, a.lat]),
      { units: "meters" }
    );
    for (let i = 0; i < DISTANCE_BANDS.length; i++) {
      if (dist <= DISTANCE_BANDS[i]) {
        return score + BAND_SCORES[i];
      }
    }
    return score;
  }, 0);
}

async function computeWalkScore(point) {
  let total = 0;
  for (const cat of CATEGORIES) {
    let allAmenities = [];
    for (const tag of cat.tags) {
      const data = await fetchAmenities(point.lat, point.lon, tag);
      allAmenities = allAmenities.concat(data);
    }
    // filter excluded
    if (cat.exclude) {
      allAmenities = allAmenities.filter((a) => {
        const tagStr = Object.entries(a.tags || {})
          .map(([k, v]) => `${k}=${v}`)
          .join(",");
        return !cat.exclude.some((ex) => tagStr.includes(ex));
      });
    }
    const score = scoreAmenities(point, allAmenities);
    total += cat.weight * score;
  }
  return Math.min(Math.round((total / 30) * 100), 100); // Normalize
}

async function main() {
  const results = [];
  for (const pt of POINTS) {
    const score = await computeWalkScore(pt);
    results.push({ lat: pt.lat, lon: pt.lon, walk_score: score });
    console.log(`Point (${pt.lat}, ${pt.lon}) scored: ${score}`);
  }

  // Ensure public directory exists
  const outputDir = path.resolve("public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save as CSV
  const header = "lat,lon,walk_score";
  const rows = results.map((r) => `${r.lat},${r.lon},${r.walk_score}`);
  fs.writeFileSync(path.join(outputDir, "walk_scores.csv"), [header, ...rows].join("\n"));
  console.log("Saved results to public/walk_scores.csv");
}

main();