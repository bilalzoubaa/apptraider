import os

class Config:
    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    # Database configuration
    # We use a local SQLite database named 'tradesense_dev.db' to avoid lock issues
    DB_PATH = os.path.join(BASE_DIR, 'database', 'tradesense_dev.db')
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    
    # Disable modification tracking to save memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Security and CORS
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    ADMIN_KEY = os.getenv("ADMIN_KEY", "super-secret-admin-key")
