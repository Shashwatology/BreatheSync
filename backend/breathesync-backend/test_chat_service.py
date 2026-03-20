import pytest
from unittest.mock import patch, AsyncMock
from services.chat_service import chat_service
import os

@pytest.fixture
def mock_env():
    # Make sure we don't accidentally hit the real API in tests
    os.environ["GEMINI_API_KEY"] = "fake-key"
    chat_service.api_key = "fake-key"

@pytest.mark.asyncio
async def test_analyze_message_with_history(mock_env):
    """Test that analyze_message properly passes history to the Gemini extract_intent"""
    
    mock_history = [
        {"role": "user", "content": "I am traveling to Shimla tomorrow."},
        {"role": "assistant", "content": "I can help with that."},
        {"role": "user", "content": "Is the air safe?"}
    ]
    
    # Mock the internal methods so we don't trigger HTTPX or AQI service
    with patch.object(chat_service, '_extract_intent', new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = {
             "type": "assessment",
             "location": "Shimla",
             "time_description": "tomorrow"
        }
        
        with patch('services.aqi_service.aqi_service.get_aqi_by_name', new_callable=AsyncMock) as mock_aqi:
             mock_aqi.return_value = {"overall_aqi": 50, "weather": {"temp": 15, "humidity": 60}}
             
             with patch.object(chat_service, '_generate_assessment', new_callable=AsyncMock) as mock_gen:
                  mock_gen.return_value = {"type": "assessment", "summary": "Shimla is safe."}
                  
                  # Execute
                  result = await chat_service.analyze_message("Is the air safe?", mock_history)
                  
                  # Assert _extract_intent was called with the history
                  mock_extract.assert_called_once_with(mock_history)
                  
                  # Assert _generate_assessment got the environment and history
                  mock_gen.assert_called_once_with(mock_extract.return_value, mock_aqi.return_value, mock_history)
                  
                  assert result["summary"] == "Shimla is safe."

@pytest.mark.asyncio
async def test_chat_fallback_empty_location(mock_env):
    """Test if location extraction fails or type is chat, it falls back to conversional reply"""
    with patch.object(chat_service, '_extract_intent', new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = {
             "type": "chat",
             "reply": "I'm just a chatbot."
        }
        
        result = await chat_service.analyze_message("Hello")
        assert result["type"] == "chat"
        assert result["reply"] == "I'm just a chatbot."
