import sys
from pathlib import Path

# Add backend directory to Python path so imports work
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Disable reload in production
import os
os.environ["ENV"] = "production"

from main import app
