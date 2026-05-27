"""
history.py — Return temporal drift history for a company from Cognee memory.
"""

from fastapi import APIRouter, HTTPException
from data.schemas import HistoryResponse
from memory.retrieve import get_temporal_history

router = APIRouter()


@router.get("/history/{company}", response_model=HistoryResponse)
async def get_history(company: str, limit: int = 20):
    """
    Return temporal RDI history for a company from Cognee graph memory.
    Used to power the Historical Drift Timeline on the dashboard.
    """
    try:
        history = await get_temporal_history(company, limit=limit)
    except Exception as e:
        # Cognee may not be initialized yet — return empty history gracefully
        history = []

    return HistoryResponse(company=company, history=history)
