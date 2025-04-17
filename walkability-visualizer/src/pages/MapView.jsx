// import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
// import { useEffect, useState } from 'react';
// import L from 'leaflet';

// function FitToBounds({ data }) {
//     const map = useMap();

//     useEffect(() => {
//         if (data && data.features.length) {
//             const geojsonLayer = L.geoJSON(data);
//             map.fitBounds(geojsonLayer.getBounds());
//         }
//     }, [data]);

//     return null;
// }

// function MapView() {
//     const [data, setData] = useState(null);

//     useEffect(() => {
//         fetch('http://localhost:8000/map_data')
//             .then(res => res.json())
//             .then(json => {
//                 console.log("GEOJSON data loaded:", json);
//                 setData(json);
//             })
//             .catch(err => console.error("Fetch error:", err));
//     }, []);

//     return (
//         <div style={{ height: '100vh', width: '100%' }}>
//             <MapContainer
//                 center={[39, -98]}
//                 zoom={4.5}
//                 maxBounds={[[24.396308, -125.0], [49.384358, -66.93457]]}
//                 maxBoundsViscosity={1.0}
//                 scrollWheelZoom={true}
//                 style={{ height: '100vh', width: '100vw', backgroundColor: '#f5f5f5' }}
//             >
//                 {/* OPTIONAL: comment this out if you want no base map at all */}
//                 <TileLayer
//                     url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
//                     attribution='&copy; Carto'
//                 />
//                 {data && (
//                     <>
//                         <GeoJSON data={data} />
//                         <FitToBounds data={data} />
//                     </>
//                 )}
//             </MapContainer>

//         </div>
//     );
// }

// export default MapView;

import React from 'react';
import USMap from '../components/USMap';

function MapView() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
      <h1>US Map</h1>
      <USMap />
    </div>
  );
}

export default MapView;
