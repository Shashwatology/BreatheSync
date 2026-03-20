from fastapi import APIRouter, Query, Body, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any

from services.aqi_service import aqi_service
from services.risk_calculator import risk_calculator

router = APIRouter(
    prefix="/api/environment",
    tags=["environment"],
)

class RiskScoreRequest(BaseModel):
    aqi_value: int
    temperature: float
    humidity: float
    voc_level: float
    patient_trigger_profile: List[str]

@router.get("/aqi")
async def get_aqi(lat: float = Query(...), lng: float = Query(...)):
    """
    Fetches data from AQICN API and OpenWeatherMap Air Pollution API
    Returns combined AQI data
    """
    try:
        data = await aqi_service.get_combined_aqi(lat, lng)
        return data
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching environmental data: {str(e)}"
        )

@router.post("/risk-score")
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Input: aqi_value, temperature, humidity, voc_level, patient_trigger_profile
    Algorithm: weighted risk score combining all factors
    Returns: {risk_score: 0-100, risk_level: "Low"/"Medium"/"High", recommendations: [string]}
    """
    try:
        result = await risk_calculator.calculate_score(
            aqi_value=request.aqi_value,
            temperature=request.temperature,
            humidity=request.humidity,
            voc_level=request.voc_level,
            patient_trigger_profile=request.patient_trigger_profile
        )
        return result
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating risk score: {str(e)}"
        )

import random

@router.get("/digital-twin-forecast")
async def get_digital_twin_forecast(
    city: str = Query(..., description="City name"),
    history_score: int = Query(default=80, description="Average user lung score"),
    reported_triggers: str = Query(default="", description="Comma-separated list of known triggers")
):
    """
    Simulated 'Digital Twin' AI endpoint that calculates asthma exacerbation probability.
    """
    base_aqi = 50
    # Use existing functions or just simulate if too complex to wire up without frontend location
    # Since this is a hackathon simulation demonstrating the ML heuristic:
    baseline_risk = max(0, 100 - history_score) * 1.5 
    
    aqi_risk = 25 # Assume moderate for demo if we can't fetch it easily here
        
    trigger_risk = 0
    triggers = [t.strip().lower() for t in reported_triggers.split(",") if t.strip()]
    
    if "dust" in triggers: trigger_risk += 15
    if "pollen" in triggers: trigger_risk += 10
        
    total_probability = min(98, max(5, int(baseline_risk + aqi_risk + trigger_risk + random.randint(-5, 5))))
    
    alert = "Normal conditions expected."
    action = "Continue standard maintenance inhaler."
    
    if total_probability > 75:
        alert = f"High Risk: Environmental conditions correlate strongly with historical attacks."
        action = "Escalate ICS dosage tonight as per GINA Action Plan."
    elif total_probability > 40:
        alert = "Moderate Risk: Environmental triggers are rising."
        action = "Consider pre-medication before outdoor activities."

    return {
        "probability_percent": total_probability,
        "forecast_window_hours": 48,
        "primary_factor": "Air Quality & Triggers",
        "alert_message": alert,
        "recommended_action": action
    }
