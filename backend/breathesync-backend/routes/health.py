from fastapi import APIRouter

router = APIRouter(
    prefix="/api/health",
    tags=["health"],
)

@router.get("")
async def health_status():
    """
    A basic health monitoring endpoint to check if the backend is up
    """
    return {
        "status": "ok",
        "version": "0.1.0"
    }
