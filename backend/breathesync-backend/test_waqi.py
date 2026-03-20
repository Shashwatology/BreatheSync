import requests
import os

token = "46d7e7db64f4eb386c3b1ffd34a6a3ef39192af5"
lat, lng = 19.076, 72.877
url = f"https://api.waqi.info/feed/geo:{lat};{lng}/?token={token}"

try:
    response = requests.get(url)
    data = response.json()
    print(f"Status: {data.get('status')}")
    if data.get("status") == "ok":
        result = data.get("data", {})
        print(f"Station Name: {result.get('city', {}).get('name')}")
        print(f"AQI: {result.get('aqi')}")
        print(f"Location: {result.get('city', {}).get('geo')}")
except Exception as e:
    print(f"Error: {e}")
