"""Vercel ASGI entry point for FastAPI backend."""
import sys
import traceback
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Set production mode
import os
os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"

# Import FastAPI app with detailed error logging
try:
    from main import app
    print("FastAPI app imported successfully", file=sys.stderr)
except Exception:
    print("FATAL: FastAPI app import failed", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    raise
