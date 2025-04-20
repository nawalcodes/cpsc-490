// fetchFifteenMinute.js

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch Overpass API amenities for a given city and state
 */
async function fetchAmenitiesForCity(city, state) {
    const query = `
[out:json][timeout:60];
area["name"="${city}"]["is_in:state"="${state}"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="school"](area.searchArea);
  way["amenity"="school"](area.searchArea);
  relation["amenity"="school"](area.searchArea);

  node["shop"~"supermarket|grocery|bakery"](area.searchArea);
  way["shop"~"supermarket|grocery|bakery"](area.searchArea);
  relation["shop"~"supermarket|grocery|bakery"](area.searchArea);

  node["amenity"~"cinema|theatre|arts_centre|museum"](area.searchArea);
  way["amenity"~"cinema|theatre|arts_centre|museum"](area.searchArea);
  relation["amenity"~"cinema|theatre|arts_centre|museum"](area.searchArea);

  node["amenity"~"restaurant|bar|pub|cafe"](area.searchArea);
  way["amenity"~"restaurant|bar|pub|cafe"](area.searchArea);
  relation["amenity"~"restaurant|bar|pub|cafe"](area.searchArea);

  node["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](area.searchArea);
  way["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](area.searchArea);
  relation["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](area.searchArea);

  node["leisure"="park"](area.searchArea);
  way["leisure"="park"](area.searchArea);
  relation["leisure"="park"](area.searchArea);
);
out center;
`;

    try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.elements.map(e => {
            const lat = e.lat || e.center?.lat;
            const lon = e.lon || e.center?.lon;
            return {
                id: e.id,
                type: e.tags?.amenity || e.tags?.shop || e.tags?.leisure || "unknown",
                name: e.tags?.name || "Unnamed",
                lat,
                lon,
                tags: e.tags
            };
        }).filter(e => e.lat && e.lon);

    } catch (error) {
        console.error(`Failed to fetch amenities for ${city}, ${state}:`, error);
        return [];
    }
}

/**
 * Batched Overpass fetch for large city lists
 * @param {Array} cityList [{ name, admin1_code, coordinates, population }]
 * @param {Number} batchSize Number of cities per batch
 */
export async function fetchFifteenMinute(cityList = [], batchSize = 5) {
    const results = [];

    for (let i = 0; i < cityList.length; i += batchSize) {
        const batch = cityList.slice(i, i + batchSize);

        if (!Array.isArray(batch)) continue; // Ensure batch is an array
        const batchResults = await Promise.all(
            batch.map(async city => {
                const amenities = await fetchAmenitiesForCity(city.name, city.admin1_code);
                const uniqueTypes = new Set(amenities.map(a => a.type));
                const completenessScore = uniqueTypes.size / 7; // 7 amenity categories
                return {
                    ...city,
                    score: completenessScore
                };
            })
        );

        results.push(...batchResults);
        await sleep(2000); // Sleep 2 seconds between batches to avoid rate limiting
    }

    return results;
}

/**
 * Optional scoring utility if calculating from raw amenities
 */
export function computeFifteenMinuteIndex(amenities) {
    const categoryCounts = {
        schools: 0,
        foodMarkets: 0,
        recreation: 0,
        restaurants: 0,
        healthCare: 0,
        greenAreas: 0,
    };

    amenities.forEach((el) => {
        const tags = el.tags || {};
        if (tags.amenity === "school") categoryCounts.schools++;
        if (["supermarket", "convenience", "grocery", "bakery"].includes(tags.shop)) categoryCounts.foodMarkets++;
        if (["cinema", "theatre", "museum", "arts_centre"].includes(tags.amenity)) categoryCounts.recreation++;
        if (["restaurant", "bar", "pub", "cafe"].includes(tags.amenity)) categoryCounts.restaurants++;
        if (["clinic", "doctors", "hospital", "pharmacy", "dentist"].includes(tags.amenity)) categoryCounts.healthCare++;
        if (["park", "garden", "recreation_ground", "common"].includes(tags.leisure)) categoryCounts.greenAreas++;
    });

    const maxValues = {
        schools: 10,
        foodMarkets: 15,
        recreation: 10,
        restaurants: 20,
        healthCare: 10,
        greenAreas: 5,
    };

    const normalized = Object.fromEntries(
        Object.entries(categoryCounts).map(([key, count]) => [key, Math.min(count / maxValues[key], 1)])
    );

    const values = Object.values(normalized);
    const index = values.reduce((a, b) => a + b, 0) / values.length;

    return {
        index,
        categoryCounts,
        normalized,
    };
}
