// ndaIndexEstimator.js

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const cities = JSON.parse(fs.readFileSync("../public/us-cities.json", "utf-8"))
  .filter(city => city.population > 50000)
  .map(city => ({
    lat: city.coordinates.lat,
    lon: city.coordinates.lon,
    name: city.name,
    state: city.admin1_code
  }));

const DOMAINS = [
  {
    name: "education",
    weight: 4,
    tags: ["amenity=school", "amenity=kindergarten", "amenity=college", "amenity=university"],
    type: "binary"
  },
  {
    name: "transport",
    weight: 5,
    tags: ["highway=bus_stop", "railway=station", "public_transport=platform"],
    type: "intensity"
  },
  {
    name: "recreation",
    weight: 5,
    tags: ["leisure=park", "leisure=pitch", "leisure=sports_centre", "leisure=swimming_pool"],
    type: "intensity"
  },
  {
    name: "social_cultural",
    weight: 3,
    tags: ["amenity=library", "amenity=community_centre", "amenity=arts_centre", "amenity=place_of_worship"],
    type: "binary"
  },
  {
    name: "food_retail",
    weight: 5,
    tags: ["shop=supermarket", "shop=convenience", "amenity=fast_food", "shop=bakery", "shop=greengrocer"],
    type: "intensity"
  },
  {
    name: "financial",
    weight: 3,
    tags: ["amenity=bank", "amenity=atm", "amenity=post_office"],
    type: "binary"
  },
  {
    name: "health",
    weight: 2,
    tags: ["amenity=clinic", "amenity=doctors", "amenity=pharmacy", "amenity=hospital"],
    type: "binary"
  },
  {
    name: "other_retail",
    weight: 4,
    tags: ["shop=mall", "shop=clothes", "shop=charity"],
    type: "intensity"
  }
];

const BUFFER_RADIUS = 800; // meters

async function fetchAmenities(lat, lon, tag) {
  const [k, v] = tag.split("=");
  const query = `
    [out:json];
    node["${k}"${v ? `="${v}"` : ""}](around:${BUFFER_RADIUS},${lat},${lon});
    out;
  `;
  const url = "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    body: query,
  });
  const data = await res.json();
  return data.elements;
}

async function computeNDAI(city) {
  let score = 0;
  for (const domain of DOMAINS) {
    let allAmenities = [];
    for (const tag of domain.tags) {
      const results = await fetchAmenities(city.lat, city.lon, tag);
      allAmenities = allAmenities.concat(results);
    }
    if (domain.type === "binary") {
      score += allAmenities.length > 0 ? domain.weight : 0;
    } else if (domain.type === "intensity") {
      const count = allAmenities.length;
      let bandScore = 0;
      if (count === 0) bandScore = 0;
      else if (count <= 3) bandScore = 1;
      else if (count <= 7) bandScore = 2;
      else bandScore = 3;
      score += bandScore * domain.weight / 3; // normalize to weight
    }
  }
  return Math.round(score * 10) / 10;
}

async function main() {
  const results = [];

  for (const city of cities) {
    const index = await computeNDAI(city);
    results.push({ ...city, nda_index: index });
    console.log(`${city.name}, ${city.state} NDAI: ${index}`);
  }

  const outputDir = path.resolve("public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const header = "lat,lon,name,state,nda_index";
  const rows = results.map(r => `${r.lat},${r.lon},"${r.name}",${r.state},${r.nda_index}`);
  fs.writeFileSync(path.join(outputDir, "nda_index.csv"), [header, ...rows].join("\n"));
  console.log("Saved NDAI index to public/nda_index.csv");
}

main();