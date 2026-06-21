"""Vercel serverless entry point for FastAPI backend."""
import sys
from pathlib import Path

# Add backend directory to Python path (via symlink in api/ or parent dir)
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if not BACKEND_DIR.exists():
    BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Set production mode
import os
os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"

# Import FastAPI app - Vercel Python runtime detects `app` as ASGI handler
from main import app
