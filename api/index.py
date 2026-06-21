"""Vercel serverless entry point - standalone FastAPI app."""
import os
os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"

import sys
import traceback
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Log whether backend/ exists
_backend_exists = Path(BACKEND_DIR).exists()
print(f"BACKEND_DIR={BACKEND_DIR} exists={_backend_exists}", file=sys.stderr)

if _backend_exists:
    print(f"Contents: {[str(p.name) for p in Path(BACKEND_DIR).iterdir()]}", file=sys.stderr)

# Try importing backend main
try:
    from main import app
    print("Successfully imported FastAPI app from backend/main", file=sys.stderr)
except Exception as e:
    print(f"Failed to import backend/main: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    # Fallback: create minimal FastAPI app
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="API (fallback)")

    @app.get("/api/v1/health")
    @app.get("/health")
    async def health():
        return {"status": "healthy (fallback)", "error": str(e)}

    @app.get("/")
    async def root():
        return {"message": "API (fallback) running"}
