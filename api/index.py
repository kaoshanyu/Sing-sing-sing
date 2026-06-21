"""Vercel serverless entry point for FastAPI backend."""
import sys
import os
import importlib
import traceback
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"


def _load_app():
    try:
        print("Loading backend FastAPI app...", file=sys.stderr)
        mod = importlib.import_module("main")
        app = mod.app
        print(f"FastAPI app loaded successfully: {app.title}", file=sys.stderr)
        return app
    except Exception:
        traceback.print_exc(file=sys.stderr)
        print("ERROR: FastAPI app import failed!", file=sys.stderr)
        raise


# Vercel builder detects `app` at module level
app = _load_app()
