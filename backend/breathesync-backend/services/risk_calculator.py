import httpx
import os
import json
from typing import Dict, Any, List

class RiskCalculator:
    """Calculates environmental health risk based on multiple factors, enhanced by Gemini AI"""
    
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        
    async def calculate_score(
        self,
        aqi_value: int, 
        temperature: float, 
        humidity: float, 
        voc_level: float, 
        patient_trigger_profile: List[str] | None = None
    ) -> Dict[str, Any]:
        """
        Calculates risk score and generates AI prediction text
        """
        if patient_trigger_profile is None:
            patient_trigger_profile = []

        # Map AQI directly to a base 0-100 score where 100 AQI = 60 Score, 150 AQI = 80 Score
        if aqi_value >= 150:
            base_score = 80.0 + min(20.0, ((aqi_value - 150) / 150.0) * 20.0)
        elif aqi_value >= 100:
            base_score = 60.0 + ((aqi_value - 100) / 50.0) * 20.0
        elif aqi_value >= 50:
            base_score = 40.0 + ((aqi_value - 50) / 50.0) * 20.0
        else:
            base_score = (aqi_value / 50.0) * 40.0

        # Environmental impacts (adds up to +20 points)
        env_impact = 0.0
        if temperature > 30:
            env_impact += min(10.0, (temperature - 30) * 1.5)
        elif temperature < 10:
            env_impact += min(10.0, (10 - temperature) * 1.5)
            
        if humidity > 60:
            env_impact += min(10.0, (humidity - 60) * 0.5)
        elif humidity < 20:
            env_impact += min(10.0, (20 - humidity) * 0.5)
            
        env_impact += min(10.0, (voc_level / 1000.0) * 10.0)
        
        raw_score = base_score + env_impact

        multiplier = 1.0
        if "asthma" in patient_trigger_profile or "copd" in patient_trigger_profile:
            multiplier += 0.2
        if "pollen" in patient_trigger_profile and humidity > 50:
             multiplier += 0.1
        if "cold" in patient_trigger_profile and temperature < 15:
             multiplier += 0.15
             
        risk_score = min(100.0, raw_score * multiplier)
        
        # Risk level for classification
        if risk_score > 75:
            risk_level = "High"
        elif risk_score > 40:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

        # Try to get prediction from Gemini
        prediction = await self._get_gemini_prediction(
            aqi_value, temperature, humidity, voc_level, risk_level, risk_score, patient_trigger_profile
        )

        return {
            "risk_score": float(f"{risk_score:.2f}"),
            "risk_level": risk_level,
            "prediction": prediction["text"],
            "trigger_warnings": prediction["warnings"],
            "recommendations": prediction["recommendations"],
            "best_outdoor_time": prediction["best_time"]
        }

    async def _get_gemini_prediction(
        self, aqi, temp, hum, voc, level, score, profile
    ) -> Dict[str, Any]:
        """Call Gemini API for descriptive prediction"""
        if not self.api_key or self.api_key == "placeholder_gemini_key":
            return self._fallback_prediction(level, score)

        prompt = f"""
        Analyze the following lung health environmental data:
        - AQI: {aqi}
        - Temperature: {temp}°C
        - Humidity: {hum}%
        - Calculated Risk Level: {level}
        - Risk Score: {score}/100
        - Patient Triggers: {", ".join(profile)}

        Provide a very professional, highly accurate lung health prediction in JSON format:
        {{
            "text": "A detailed 2-3 sentence analysis of current conditions and expectations (e.g., 'Air quality is expected to remain Poor as PM2.5 levels stay elevated...').",
            "warnings": ["Short warning tags like 'High PM2.5', 'Unhealthy AQI levels'"],
            "recommendations": ["Clear bullet point advice"],
            "best_time": "Safe window for outdoor activity (e.g., '06:00 AM to 09:00 AM')"
        }}
        Output ONLY the JSON.
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }, timeout=15.0)
                
                if res.status_code == 200:
                    data = res.json()
                    text_content = data['candidates'][0]['content']['parts'][0]['text']
                    # Clean markdown if present
                    if "```json" in text_content:
                        text_content = text_content.split("```json")[1].split("```")[0].strip()
                    elif "```" in text_content:
                         text_content = text_content.split("```")[1].split("```")[0].strip()
                    
                    return json.loads(text_content)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            
        return self._fallback_prediction(level, score)

    def _fallback_prediction(self, level, score) -> Dict[str, Any]:
        if level == "High":
            return {
                "text": "Air quality is expected to remain Poor as PM2.5 levels stay elevated through the night despite clear skies. Dispersion will be limited due to high humidity.",
                "warnings": ["High PM2.5", "Unhealthy AQI levels"],
                "recommendations": [
                    "Keep windows closed and use an air purifier.",
                    "Limit vigorous outdoor exercise.",
                    "Ensure your rescue inhaler is easily accessible."
                ],
                "best_time": "06:00 AM to 09:00 AM"
            }
        elif level == "Moderate":
             return {
                "text": "Moderate risk detected. Conditions are generally acceptable but sensitive groups should limit outdoor time.",
                "warnings": ["Moderate Pollutants"],
                "recommendations": ["Limit prolonged outdoor exertion.", "Keep track of breathing changes."],
                "best_time": "Late afternoon"
            }
        else:
             return {
                "text": "Air quality is acceptable for normal activities. Enjoy your outdoor time safely!",
                "warnings": ["Clear Air"],
                "recommendations": ["Safe for most outdoor activities."],
                "best_time": "Anytime"
            }

risk_calculator = RiskCalculator()
