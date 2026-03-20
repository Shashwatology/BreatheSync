from fastapi import APIRouter, Body, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any

from services.chat_service import chat_service

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)

class ChatRequest(BaseModel):
    message: str

@router.post("/travel-safe")
async def travel_safe_chat(request: ChatRequest):
    """
    Analyzes destination messages and provides safety assessments
    """
    try:
        result = await chat_service.analyze_message(request.message)
        return result
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat analysis: {str(e)}"
        )
