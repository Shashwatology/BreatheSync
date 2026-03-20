import requests

owm_key = "d0eacb4871a56f3ae96fe060c20a5599"
token = "46d7e7db64f4eb386c3b1ffd34a6a3ef39192af5"
lat, lng = 19.076, 72.877 # Mumbai

print(f"--- Testing OWM Reverse Geocode for {lat}, {lng} ---")
owm_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lng}&limit=1&appid={owm_key}"
try:
    response = requests.get(owm_url)
    geo_data = response.json()
    if geo_data:
        city = geo_data[0].get("name")
        print(f"OWM City: {city}")
        
        # Now try WAQI with city name
        print(f"--- Testing WAQI with city: {city} ---")
        waqi_url = f"https://api.waqi.info/feed/{city}/?token={token}"
        waqi_res = requests.get(waqi_url)
        waqi_data = waqi_res.json()
        if waqi_data.get("status") == "ok":
            print(f"Station: {waqi_data['data']['city']['name']}")
            print(f"AQI: {waqi_data['data']['aqi']}")
        else:
            print(f"WAQI Failed for city: {waqi_data.get('status')}")
    else:
        print("OWM failed to find city")
except Exception as e:
    print(f"Error: {e}")
