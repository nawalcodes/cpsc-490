import fs from "fs";
import fetch from "node-fetch";
import path from "path";

// Load cities
const cities = JSON.parse(fs.readFileSync("us-cities.json", "utf-8"));
const filteredCities = cities.filter(city => city.population > 50000);

// Define categories and preference weights
const CATEGORY_WEIGHTS = {
  schools: 0.15,
  foodMarkets: 0.2,
  recreation: 0.15,
  restaurants: 0.2,
  healthCare: 0.2,
  greenAreas: 0.1
};

// Helper to create bbox based on center and radius in meters
function makeBBoxFromRadius(lat, lon, radiusMeters) {
  const R = 6371000; // Earth radius in meters
  const deltaLat = (radiusMeters / R) * (180 / Math.PI);
  const deltaLon = deltaLat / Math.cos(lat * Math.PI / 180);
  return `${lat - deltaLat},${lon - deltaLon},${lat + deltaLat},${lon + deltaLon}`;
}

// Fetch amenities within a bounding box
async function fetchAmenities(bbox) {
  const query = `[out:json][timeout:25];
      (
        node["amenity"="school"](${bbox});
        node["shop"~"supermarket|grocery|bakery"](${bbox});
        node["amenity"~"cinema|theatre|arts_centre|museum"](${bbox});
        node["amenity"~"restaurant|bar|pub|cafe"](${bbox});
        node["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](${bbox});
        node["leisure"="park"](${bbox});
      );
      out tags center;`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: query.trim()
  });

  if (!response.ok) throw new Error(`Overpass error ${response.status}`);
  const data = await response.json();
  return data.elements;
}

// Simple category counter
function countAmenities(elements) {
  const counts = {
    schools: 0,
    foodMarkets: 0,
    recreation: 0,
    restaurants: 0,
    healthCare: 0,
    greenAreas: 0
  };

  elements.forEach(el => {
    const tags = el.tags || {};
    if (tags.amenity === "school") counts.schools++;
    if (["supermarket", "grocery", "bakery"].includes(tags.shop)) counts.foodMarkets++;
    if (["cinema", "theatre", "arts_centre", "museum"].includes(tags.amenity)) counts.recreation++;
    if (["restaurant", "bar", "pub", "cafe"].includes(tags.amenity)) counts.restaurants++;
    if (["hospital", "clinic", "doctors", "dentist", "pharmacy"].includes(tags.amenity)) counts.healthCare++;
    if (tags.leisure === "park") counts.greenAreas++;
  });

  return counts;
}

// Run main loop
async function main() {
  const results = [];

  for (const city of filteredCities) {
    const { lat, lon } = city.coordinates;

    try {
      const bbox1km = makeBBoxFromRadius(lat, lon, 1000);
      const bbox15min = makeBBoxFromRadius(lat, lon, 1200); // 15-minute approx

      const [nearby, walkable] = await Promise.all([
        fetchAmenities(bbox1km),
        fetchAmenities(bbox15min)
      ]);

      const total = countAmenities(nearby);
      const accessible = countAmenities(walkable);

      const totalSum = Object.values(total).reduce((a, b) => a + b, 0);
      const accessibleSum = Object.values(accessible).reduce((a, b) => a + b, 0);

      const walkingPerformance = totalSum > 0 ? accessibleSum / totalSum : 0;

      results.push({
        city: city.name,
        state: city.admin1_code,
        walkingPerformance: +walkingPerformance.toFixed(3),
        totalDestinations: total,
        walkableDestinations: accessible
      });

      console.log(`✓ ${city.name}, ${city.admin1_code}: ${walkingPerformance.toFixed(3)}`);
      //await new Promise(res => setTimeout(res, 2000)); // avoid API rate limit
    } catch (e) {
      console.warn(`Failed ${city.name}: ${e.message}`);
    }
  }

  fs.writeFileSync("fifteen-minute-scores.json", JSON.stringify(results, null, 2));
  console.log("Scores saved to fifteen-minute-scores.json");
}

main();
