import pytest
from unittest.mock import patch, AsyncMock
from services.aqi_service import aqi_service

@pytest.mark.asyncio
async def test_aqi_cache_hit():
    """Test that consecutive identical requests return the cached AQI without making upstream API calls"""
    
    # Reset cache before testing
    aqi_service._cache.clear()
    
    mock_data = {
        "status": "ok",
        "data": {"aqi": 85, "city": {"name": "Testville"}, "iaqi": {}}
    }
    
    mock_owm = {
        "list": [{"main": {"aqi": 3}, "components": {}}]
    }
    
    with patch('services.aqi_service.AQIService._fetch_aqicn', new_callable=AsyncMock) as mock_aqicn:
        mock_aqicn.return_value = mock_data["data"]
        
        with patch('services.aqi_service.AQIService._fetch_owm', new_callable=AsyncMock) as mock_owm_call:
             mock_owm_call.return_value = mock_owm["list"][0]
             
             with patch('services.aqi_service.AQIService._fetch_weather', new_callable=AsyncMock) as mock_weather:
                  mock_weather.return_value = {"temp": 24}
                  
                  with patch('services.aqi_service.AQIService._fetch_nearby_stations', new_callable=AsyncMock) as mock_stations:
                       mock_stations.return_value = []
                       
                       # Call 1
                       res1 = await aqi_service.get_combined_aqi(19.05, 72.88)
                       assert res1["overall_aqi"] == 85
                       
                       # Verify all upstream called ONCE
                       assert mock_aqicn.call_count == 1
                       
                       # Call 2 (cache hit) Let's slightly perturb the coordinates inside the rounding limit (~ 1km)
                       res2 = await aqi_service.get_combined_aqi(19.051, 72.882)
                       
                       assert res2["overall_aqi"] == 85
                       
                       # Verify upstream still called ONLY ONCE
                       assert mock_aqicn.call_count == 1
