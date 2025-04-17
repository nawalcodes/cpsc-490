import requests
import json

# Base URL of the ArcGIS REST service (Layer 0 is the block group layer)
base_url = "https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0/query"

# Define the query parameters
params = {
    "where": "STATEFP = '09'",  # Connecticut's FIPS code is '09'
    "outFields": "GEOID10,NatWalkInd,D2A_Ranked,D3B_Ranked,D4A_Ranked",
    "f": "json",
    "returnGeometry": False,
    "resultRecordCount": 1000  # Optional: max records per query (ArcGIS limits large queries)
}

# Send the request
response = requests.get(base_url, params=params)

# Check for success
if response.status_code == 200:
    data = response.json()
    
    # Print number of features and a sample
    features = data.get("features", [])
    print(f"Retrieved {len(features)} features.")
    for feature in features[:5]:  # Print a sample
        print(json.dumps(feature["attributes"], indent=2))
else:
    print("Request failed:", response.status_code)



