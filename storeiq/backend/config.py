import os

class Config:
    SECRET_KEY = "storeiq-secret-key-2024"
    SQLALCHEMY_DATABASE_URI = "sqlite:///storeiq.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "storeiq-jwt-super-secret-key-2024-nagpur-store"