# models.py
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from geoalchemy2 import Geometry

Base = declarative_base()

class SmartLocation(Base):
    __tablename__ = 'epa_sld_database_v3'

    objectid = Column(Integer, primary_key=True, index=True)
    statefp = Column(String)
    countyfp = Column(String)
    name = Column(String)
    natwalkind = Column(Float)
    slc_score = Column(Float)
    d4a_ranked = Column(Float)
    d2b_ranked = Column(Float)
    shape = Column(Geometry(geometry_type='MULTIPOLYGON', srid=102039))
