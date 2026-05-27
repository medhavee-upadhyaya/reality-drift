"""
main.py — Reality Drift FastAPI application entry point
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes import analyze, companies, history, health
from memory.cognee_client import initialize_cognee


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup + shutdown lifecycle"""
    # Initialize Cognee on startup (non-blocking if credentials missing)
    try:
        await initialize_cognee()
        print("✅ Cognee memory initialized")
    except Exception as e:
        print(f"⚠️  Cognee init skipped (will retry on first use): {e}")

    yield

    # Cleanup on shutdown
    print("🔄 Reality Drift shutting down...")


app = FastAPI(
    title="Reality Drift API",
    description="AI observability infrastructure for detecting regional narrative drift in ESG claims",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────────────
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,https://reality-drift.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="", tags=["Health"])
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
