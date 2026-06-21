"""Voice timbre conversion server.

Standalone FastAPI server for voice conversion features.
Runs on port 8001 (separate from the main API on Vercel).

Usage:
    python voice_server.py
    # or: uvicorn voice_server:app --host 0.0.0.0 --port 8001 --reload
"""
import os
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend is on path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from routers.voice_router import router as voice_router
from services.voice_service import VOICE_DATA_DIR

app = FastAPI(
    title="Voice Conversion Server",
    description="AI voice timbre conversion for singing-assessment-app",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register voice routes
API_PREFIX = "/api/v1"
app.include_router(voice_router, prefix=API_PREFIX)

# Serve static output files (converted audio, etc.)
static_voice_dir = VOICE_DATA_DIR
os.makedirs(static_voice_dir, exist_ok=True)
app.mount("/static/voice", StaticFiles(directory=str(static_voice_dir)), name="voice_static")


@app.get(f"{API_PREFIX}/health")
@app.get("/health")
async def health():
    return {"status": "voice_server_running"}


@app.get("/")
async def root():
    return {
        "service": "Voice Conversion Server",
        "version": "1.0.0",
        "endpoints": {
            "status": "GET /api/v1/voice/status",
            "profiles": "GET /api/v1/voice/profiles",
            "create_profile": "POST /api/v1/voice/profile (multipart)",
            "convert": "POST /api/v1/voice/convert (multipart)",
            "seedvc_convert": "POST /api/v1/voice/seedvc/convert (multipart)",
        },
    }


if __name__ == "__main__":
    port = int(os.getenv("VOICE_PORT", "8001"))
    debug = os.getenv("ENV", "development") == "development"
    print(f"Voice server starting on http://0.0.0.0:{port}")
    print(f"API docs at http://0.0.0.0:{port}/docs")
    uvicorn.run("voice_server:app", host="0.0.0.0", port=port, reload=debug)
