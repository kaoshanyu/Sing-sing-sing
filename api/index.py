"""Vercel serverless entry point for FastAPI backend."""
import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Set production mode (must happen before importing main)
import os
os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"

# Import FastAPI app - must be at module level for Vercel builder detection
from main import app
