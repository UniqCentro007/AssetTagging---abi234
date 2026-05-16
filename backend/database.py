from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Use local SQLite by default for easy distribution and running without a separate DB server.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./asset_db.sqlite3")
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Image Metadata Table 
class ImageMetadata(Base):
    __tablename__ = "image_metadata"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    tag_prompt = Column(String)
    confidence = Column(Float)
    box_coordinates = Column(JSON) # [x1, y1, x2, y2]
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)