import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';

const WalkabilityMap = () => {
    useEffect(() => {
        const existingMap = L.DomUtil.get('map');
        if (existingMap !== null) {
            existingMap._leaflet_id = null;
        }

        const map = L.map('map').setView([37.8, -96], 4); // Center on US

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // EPA ArcGIS Walkability Layer
        esri.dynamicMapLayer({
            url: 'https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer',
            layers: [0],
            opacity: 0.7
        }).addTo(map);

    }, []);

    return (
        <div>
            <h2>National Walkability Index</h2>
            <div id="map" style={{ height: '600px', width: '100%' }}></div>
        </div>
    );
};

export default WalkabilityMap;
