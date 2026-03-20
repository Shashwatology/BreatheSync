import httpx
import os
import asyncio
from typing import Dict, Any
from cachetools import TTLCache

class AQIService:
    """Service to fetch environmental data from external APIs"""
    
    def __init__(self):
        # Read API keys from environment
        self.aqicn_token = os.environ.get("AQICN_API_TOKEN", "placeholder_token")
        self.owm_api_key = os.environ.get("OPENWEATHERMAP_API_KEY", "placeholder_owm_key")
        
        # Cache for combined AQI responses (max 200 items, expires in 15 mins/900 secs)
        self._cache = TTLCache(maxsize=200, ttl=900)
        
    async def get_combined_aqi(self, lat: float, lng: float) -> Dict[str, Any]:
        """Fetch combined data from AQICN and OpenWeatherMap APIs using coordinates"""
        
        # Check cache explicitly using rounded coords (approx ~1km precision cache key)
        cache_key = f"{round(float(lat), 2)}_{round(float(lng), 2)}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Fetch all data in parallel to reduce latency
        aqicn_task = self._fetch_aqicn(lat, lng)
        owm_task = self._fetch_owm(lat, lng)
        weather_task = self._fetch_weather(lat, lng)
        nearby_task = self._fetch_nearby_stations(lat, lng)
        
        aqicn_data, owm_pollution, weather_data, nearby_stations = await asyncio.gather(
            aqicn_task, owm_task, weather_task, nearby_task
        )
        
        # Combine the data
        combined_data = {
            "location": {
                "lat": lat,
                "lng": lng
            },
            "aqicn": aqicn_data,
            "owm": owm_pollution,
            "weather": weather_data,
            "overall_aqi": aqicn_data.get("aqi", 0),
            "dominant_pollutant": aqicn_data.get("dominentpol", "unknown"),
            "components": owm_pollution.get("components", {}),
            "stations": nearby_stations
        }
        
        # Cache the result
        self._cache[cache_key] = combined_data
        
        return combined_data

    async def get_aqi_by_name(self, city_name: str) -> Dict[str, Any]:
        """Fetch combined data using city name (geocodes first)"""
        lat, lng = await self._geocode_city(city_name)
        if lat is None or lng is None:
            # Fallback to a direct city search in WAQI if geocoding fails
            return await self._fetch_aqicn_by_city_direct(city_name)
            
        return await self.get_combined_aqi(lat, lng)

    async def _geocode_city(self, city_name: str) -> tuple:
        """Get coordinates for a city name using OWM Geocoding"""
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={self.owm_api_key}"
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=5.0)
                if res.status_code == 200:
                    data = res.json()
                    if data:
                        return data[0].get("lat"), data[0].get("lon")
        except Exception as e:
            print(f"Geocoding error for {city_name}: {e}")
        return None, None

    async def _fetch_aqicn_by_city_direct(self, city_name: str) -> dict:
        """Fallback: Try WAQI Feed by name if geocoding failed"""
        url = f"https://api.waqi.info/feed/{city_name}/?token={self.aqicn_token}"
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "ok":
                        aqicn_data = data.get("data", {})
                        # Construct a basic response
                        return {
                            "location": {"lat": 0, "lng": 0},
                            "aqicn": aqicn_data,
                            "overall_aqi": aqicn_data.get("aqi", 0),
                            "weather": self._mock_weather_response(), # Mocking since no lat/lng
                            "stations": []
                        }
        except Exception:
            pass
        return {"overall_aqi": 0, "error": True}


    async def _fetch_nearby_stations(self, lat: float, lng: float) -> list:
        """Fetch all stations within ~100km radius using map bounds"""
        # ~1 degree = 111km. 0.9 degree box around center roughly covers 100km.
        lat1, lng1 = lat - 0.9, lng - 0.9
        lat2, lng2 = lat + 0.9, lng + 0.9
        
        url = f"https://api.waqi.info/map/bounds/?latlng={lat1},{lng1},{lat2},{lng2}&token={self.aqicn_token}"
        try:
            async with httpx.AsyncClient() as client:
                if self.aqicn_token == "placeholder_token":
                    return []
                    
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "ok":
                        stations = []
                        for s in data.get("data", []):
                            stations.append({
                                "name": s.get("station", {}).get("name", "Unknown Station"),
                                "aqi": int(s.get("aqi")) if s.get("aqi") and s.get("aqi") != "-" else None,
                                "lat": s.get("lat"),
                                "lng": s.get("lon")
                            })
                        return stations
                return []
        except Exception as e:
            print(f"Error fetching stations in radius: {e}")
            return []
        return []

    async def _fetch_aqicn(self, lat: float, lng: float) -> dict:
        """Fetch from AQICN API with robust city-fallback using OWM Geocoding"""
        print(f"DEBUG: Starting AQICN fetch for {lat}, {lng}")
        
        city_name = None
        # 1. Try to get city name via OWM Reverse Geocoding first (more reliable for city grouping)
        if self.owm_api_key != "placeholder_owm_key":
            try:
                print(f"DEBUG: Attempting OWM Reverse Geocode for {lat}, {lng}")
                geocode_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lng}&limit=1&appid={self.owm_api_key}"
                async with httpx.AsyncClient() as client:
                    geo_res = await client.get(geocode_url, timeout=5.0)
                    if geo_res.status_code == 200:
                        geo_data = geo_res.json()
                        if geo_data:
                            city_name = geo_data[0].get("name")
                            print(f"DEBUG: OWM Geocode found city: {city_name}")
            except Exception as e:
                print(f"DEBUG: OWM Geocode failed: {e}")

        # 2. Try WAQI with City Name if available
        if city_name:
            try:
                print(f"DEBUG: Attempting WAQI fetch for city: {city_name}")
                city_url = f"https://api.waqi.info/feed/{city_name}/?token={self.aqicn_token}"
                async with httpx.AsyncClient() as client:
                    response = await client.get(city_url, timeout=10.0)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "ok":
                            result = data.get("data", {})
                            print(f"DEBUG: WAQI City Success - Station: {result.get('city', {}).get('name')}")
                            return result
            except Exception as e:
                print(f"DEBUG: WAQI City fetch failed: {e}")
                # Continue to fallback

        # 3. Fallback to standard geo-coordinate fetch
        print(f"DEBUG: Falling back to geo-coordinate fetch for {lat}, {lng}")
        url = f"https://api.waqi.info/feed/geo:{lat};{lng}/?token={self.aqicn_token}"
        try:
            async with httpx.AsyncClient() as client:
                if self.aqicn_token == "placeholder_token":
                    print("DEBUG: Using mock AQICN response (token is placeholder)")
                    return self._mock_aqicn_response()
                    
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "ok":
                        result = data.get("data", {})
                        print(f"DEBUG: WAQI Geo Success - Station: {result.get('city', {}).get('name')}")
                        return result
                print(f"DEBUG: WAQI geo status not ok or failure")
                return self._mock_aqicn_response()
        except Exception as e:
            print(f"Error in AQICN flow: {e}")
            return self._mock_aqicn_response()
        return self._mock_aqicn_response()

    async def _fetch_owm(self, lat: float, lng: float) -> dict:
        """Fetch from OpenWeatherMap Air Pollution API"""
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lng}&appid={self.owm_api_key}"
        try:
            async with httpx.AsyncClient() as client:
                if self.owm_api_key == "placeholder_owm_key":
                    return self._mock_owm_response()
                    
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                if "list" in data and len(data["list"]) > 0:
                    return data["list"][0]
                return {}
        except Exception as e:
            print(f"Error fetching OWM data: {e}")
            return self._mock_owm_response() # Fallback to mock
        return {} # Final fallback

    async def _fetch_weather(self, lat: float, lng: float) -> dict:
        """Fetch real-time weather from OpenWeatherMap"""
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&units=metric&appid={self.owm_api_key}"
        try:
            async with httpx.AsyncClient() as client:
                if self.owm_api_key == "placeholder_owm_key":
                    return self._mock_weather_response()
                    
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "temp": data.get("main", {}).get("temp"),
                        "humidity": data.get("main", {}).get("humidity"),
                        "windSpeed": data.get("wind", {}).get("speed"),
                        "description": data.get("weather", [{}])[0].get("description"),
                        "icon": data.get("weather", [{}])[0].get("icon")
                    }
                return self._mock_weather_response()
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return self._mock_weather_response()
        return self._mock_weather_response()

    def _mock_weather_response(self) -> dict:
        return {
            "temp": 24,
            "humidity": 60,
            "windSpeed": 5,
            "description": "Partly Cloudy",
            "icon": "02d"
        }

    def _mock_aqicn_response(self) -> dict:
        return {
            "aqi": 68,
            "idx": 5432,
            "city": {"name": "Mock City"},
            "dominentpol": "pm25",
            "iaqi": {
                "co": {"v": 4.1},
                "no2": {"v": 12.3},
                "pm10": {"v": 34},
                "pm25": {"v": 68},
                "so2": {"v": 5.4}
            }
        }
        
    def _mock_owm_response(self) -> dict:
        return {
            "main": {"aqi": 2},
            "components": {
                "co": 250.34,
                "no2": 15.54,
                "o3": 65.09,
                "pm2_5": 14.5,
                "pm10": 20.1,
                "so2": 4.3
            },
            "dt": 1605182400
        }

aqi_service = AQIService()
