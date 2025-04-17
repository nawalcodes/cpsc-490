// src/hooks/useWalkabilityData.js
import { useEffect, useState } from "react";

export default function useWalkabilityData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchWalkability = async () => {
      const response = await fetch(
        `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0/query?where=1%3D1&outFields=GEOID,NatWalkInd&f=json&returnGeometry=false&resultRecordCount=20000`
      );
      const json = await response.json();
      setData(json.features.map(f => ({
        GEOID: f.attributes.GEOID,
        score: f.attributes.NatWalkInd
      })));
    };

    fetchWalkability();
  }, []);

  return data;
}
