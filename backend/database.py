from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# PostgreSQL Connection String
# 'postgresql://username:password@localhost:5432/database_name'
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:AbIsh721416%40@localhost:5432/asset_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
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