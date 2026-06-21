"""Vercel serverless entry point for FastAPI backend."""
import sys
import os
import traceback
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

os.environ["ENV"] = "production"
os.environ["VERCEL"] = "1"

# Vercel builder detects `app` at module level (app = None placeholder)
_import_error = None
app = None  # type: ignore

try:
    from main import app  # noqa: E402
except Exception:
    _import_error = traceback.format_exc()
    print("FAILED to import backend FastAPI app:", _import_error, file=sys.stderr)
    # Fallback: minimal FastAPI app so health check reveals the error
    from fastapi import FastAPI  # noqa: E402

    app = FastAPI(title="API (degraded)")

    @app.get("/api/v1/health")
    @app.get("/health")
    async def health():
        return {"status": "import_error", "detail": _import_error}
