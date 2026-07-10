"""
Production server: serves React frontend + FastAPI backend on a single port.
Designed for Render.com free tier.
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import the backend app
from app.main import app as backend_app
from app.core.database import create_tables

# Initialize database and seed data on startup
create_tables()

# Run seed script
try:
    exec(open(backend_dir / "seed.py").read())
except Exception as e:
    print(f"Seed warning: {e}")

# Serve frontend static files
frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        backend_app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA fallback: serve index.html for non-API routes
    @backend_app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"detail": "Not found"}
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(backend_app, host="0.0.0.0", port=port)
