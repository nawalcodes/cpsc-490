# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from geoalchemy2.shape import to_shape
from fastapi.responses import JSONResponse
from shapely.geometry import mapping
from models import Base, SmartLocation
import geojson
import json


# Database connection string
DATABASE_URL = "postgresql://nawalnaz:kahanahmed@localhost/sld"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Smart Location API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/map_data")
def get_map_data():
    session = SessionLocal()
    try:
        rows = session.query(
            SmartLocation.objectid,
            func.ST_Transform(SmartLocation.shape, 4326).label("shape"))

        features = []
        for row in rows:
            geom = to_shape(row.shape)  # convert to shapely geometry
            geo = mapping(geom)         # cnvert to GeoJSON-like dict
            feature = geojson.Feature(
                geometry=geo,
                properties={"objectid": row.objectid}
            )
            features.append(feature)

        return geojson.FeatureCollection(features)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
        
@app.get("/api/walkability")
def get_walkability_geojson():
    session = SessionLocal()
    try:
        rows = session.query(
            SmartLocation.statefp,
            SmartLocation.countyfp,
            SmartLocation.natwalkind,
            SmartLocation.slc_score,
            SmartLocation.d4a_ranked,
            SmartLocation.d2b_ranked,
            func.ST_Transform(SmartLocation.shape, 4326).label("geom")
        ).limit(5000).all()

        features = []
        for row in rows:
            geometry = mapping(to_shape(row.geom))
            # geom = to_shape(row.geom)
            # print(mapping(geom)['coordinates'][0][:5])  # print 5 coordinate pairs
            properties = {
                "statefp": row.statefp,
                "countyfp": row.countyfp,
                "natwalkind": row.natwalkind,
                "slc_score": row.slc_score,
                "d4a_ranked": row.d4a_ranked,
                "d2b_ranked": row.d2b_ranked,
            }
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            })

        return JSONResponse(content={
            "type": "FeatureCollection",
            "features": features
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
