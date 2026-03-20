import requests

token = "46d7e7db64f4eb386c3b1ffd34a6a3ef39192af5"

coords = [
    {"name": "Mumbai (Ghatkopar)", "lat": 19.076, "lng": 72.877},
    {"name": "Mumbai (Colaba)", "lat": 18.9220, "lng": 72.8347},
    {"name": "Delhi (CP)", "lat": 28.6304, "lng": 77.2177}
]

for c in coords:
    print(f"--- Testing {c['name']} ({c['lat']}, {c['lng']}) ---")
    url = f"https://api.waqi.info/feed/geo:{c['lat']};{c['lng']}/?token={token}"
    try:
        response = requests.get(url)
        data = response.json()
        if data.get("status") == "ok":
            result = data.get("data", {})
            print(f"Station: {result.get('city', {}).get('name')}")
            print(f"Returned Coords: {result.get('city', {}).get('geo')}")
            print(f"AQI: {result.get('aqi')}")
        else:
            print(f"Failed: {data.get('status')}")
    except Exception as e:
        print(f"Error: {e}")
    print("\n")
