import httpx
import os
import json
import datetime
from typing import Dict, Any, List
from services.aqi_service import aqi_service

class ChatService:
    """Service to handle AI Travel Safe Chatbot logic using Gemini AI"""
    
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")

    async def analyze_message(self, message: str, history: List[Dict[str, str]] | None = None) -> Dict[str, Any]:
        """
        Uses Gemini to extract destination/intent, then fetches real AQI data,
        retaining conversational history context.
        """
        if not self.api_key or self.api_key == "placeholder_gemini_key":
            return {
                "type": "chat",
                "reply": "AI is in demo mode. Try asking about 'Juhu', 'Delhi', or 'Marine Drive'."
            }
            
        if history is None:
            history = [{"role": "user", "content": message}]

        # 1. Ask Gemini to extract destination and intent, providing history context
        extraction = await self._extract_intent(history)
        
        if extraction.get("type") == "chat" or not extraction.get("location"):
            return {
                "type": "chat",
                "reply": extraction.get("reply", "I'm here to help you plan your travel safely. Could you tell me where you're heading and when?")
            }

        # 2. Fetch REAL AQI/Weather for the extracted location
        location_name = extraction.get("location")
        env_data = await aqi_service.get_aqi_by_name(location_name)
        
        # 3. Generate a dynamic assessment using Gemini + real data
        assessment = await self._generate_assessment(extraction, env_data, history)
        return assessment

    async def _extract_intent(self, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """Use Gemini to see if user wants to travel and where based on chat history"""
        
        # Format history string
        history_str = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in history])
        
        prompt = f"""
        Analyze this conversation history to extract the user's ultimate travel destination and time:
        
        --- HISTORY ---
        {history_str}
        --- END HISTORY ---
        
        Return ONLY a JSON object:
        {{
            "type": "assessment" or "chat",
            "location": "City/Place name (e.g., Manali, Mumbai) if they clearly stated a travel desire",
            "time_description": "Time/Date (e.g., tomorrow, next week) if provided",
            "reply": "If type is chat (i.e., conversational), provide a short helpful conversational response remembering the context of the chat."
        }}
        If the user is just saying hello, asking general asthma questions, or not mentioning a place, use type="chat".
        WARNING: Do NOT give explicit medical treatment advice. Always remind them to consult a doctor.
        """
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                res = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10.0)
                if res.status_code == 200:
                    text = res.json()['candidates'][0]['content']['parts'][0]['text']
                    # Clean markdown
                    if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
                    elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
                    return json.loads(text)
        except Exception as e:
            print(f"Intent Extraction Error: {e}")
        
        return {"type": "chat", "reply": "I'm listening! Tell me your destination or ask me about travel."}

    async def _generate_assessment(self, intent: dict, env: dict, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generates a rich assessment using real data + Gemini reasoning + chat context"""
        aqi = env.get("overall_aqi", 0)
        temp = env.get("weather", {}).get("temp", 25)
        hum = env.get("weather", {}).get("humidity", 50)
        
        # Slice standard Python list to avoid lint issues
        recent_history = history[-3:] if isinstance(history, list) else history
        history_str = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in recent_history])
        
        prompt = f"""
        Create a Travel Safe Assessment for an asthma patient visiting {intent.get('location', 'Unknown')} at {intent.get('time_description', 'sometime soon')}.
        
        Context of the conversation:
        {history_str}
        
        Current Environmental Data: AQI {aqi}, Temp {temp}°C, Humidity {hum}%.
        
        IMPORTANT: Do NOT give professional medical treatment. End your summary with a disclaimer to consult a doctor.
        
        Return ONLY a JSON object following this EXACT structure:
        {{
            "type": "assessment",
            "location": "{intent.get('location', 'Unknown')}",
            "lat": {env.get('location', {}).get('lat', 0)},
            "lng": {env.get('location', {}).get('lng', 0)},
            "datetime_description": "{intent.get('time_description', 'sometime soon')}",
            "environment": {{
                "aqi": {aqi},
                "temp": {temp},
                "humidity": {hum},
                "weatherDesc": "{env.get('weather', {}).get('description', 'Clear')}"
            }},
            "risk_level": "Safe" | "Low" | "Medium" | "High",
            "risk_score": 0-100,
            "summary": "1-2 sentence summary of safety including a medical disclaimer",
            "recommendations": ["list of 3 specific tips"],
            "mask_type": "None" | "Surgical" | "N95",
            "best_time": "Safe window",
            "avoid_time": "Risky window",
            "alternatives": ["2 nearby safer places"],
            "medication_reminder": "Medication advice"
        }}
        """
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                res = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10.0)
                if res.status_code == 200:
                    text = res.json()['candidates'][0]['content']['parts'][0]['text']
                    if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
                    elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
                    return json.loads(text)
        except Exception as e:
             print(f"Assessment Gen Error: {e}")
             
        # Fallback if AI fails
        return { "type": "chat", "reply": f"Fetched data for {intent.get('location', 'Unknown')}: AQI is {aqi}. Please consult your doctor for detailed medical advice before travel." }

chat_service = ChatService()

