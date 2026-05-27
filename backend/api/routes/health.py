import os
from fastapi import APIRouter
from data.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development"),
    )
