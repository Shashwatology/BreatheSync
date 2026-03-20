import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng } = await req.json();
    const AQICN_TOKEN = Deno.env.get("AQICN_API_TOKEN");
    const OW_KEY = Deno.env.get("OPENWEATHER_API_KEY");

    if (!AQICN_TOKEN) throw new Error("AQICN_API_TOKEN not configured");
    if (!OW_KEY) throw new Error("OPENWEATHER_API_KEY not configured");

    // Fetch AQI data from AQICN
    const aqiRes = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${AQICN_TOKEN}`
    );
    const aqiData = await aqiRes.json();

    // Fetch nearby stations
    const stationsRes = await fetch(
      `https://api.waqi.info/map/bounds/?latlng=${lat - 0.15},${lng - 0.15},${lat + 0.15},${lng + 0.15}&token=${AQICN_TOKEN}`
    );
    const stationsData = await stationsRes.json();

    // Fetch weather data from OpenWeather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();

    // Fetch 5-day forecast for predictions
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=metric`
    );
    const forecastData = await forecastRes.json();

    // Parse AQI
    const aqi = aqiData?.data?.aqi ?? null;
    const aqiDetails = aqiData?.data?.iaqi ?? {};
    const cityName = weatherData?.name ?? aqiData?.data?.city?.name ?? "Unknown";

    // Parse stations
    const stations = (stationsData?.data ?? []).slice(0, 8).map((s: any) => ({
      name: s.station?.name ?? "Unknown",
      aqi: s.aqi === "-" ? null : Number(s.aqi),
      lat: s.lat,
      lng: s.lon,
    }));

    // Parse weather
    const weather = {
      temp: Math.round(weatherData?.main?.temp ?? 0),
      humidity: weatherData?.main?.humidity ?? 0,
      windSpeed: weatherData?.wind?.speed ?? 0,
      description: weatherData?.weather?.[0]?.description ?? "",
      icon: weatherData?.weather?.[0]?.icon ?? "",
    };

    // Simple forecast summary (next 24h)
    const forecastSummary = (forecastData?.list ?? []).slice(0, 8).map((f: any) => ({
      dt: f.dt,
      temp: Math.round(f.main?.temp ?? 0),
      humidity: f.main?.humidity ?? 0,
      description: f.weather?.[0]?.description ?? "",
    }));

    return new Response(JSON.stringify({
      aqi,
      aqiDetails: {
        pm25: aqiDetails.pm25?.v ?? null,
        pm10: aqiDetails.pm10?.v ?? null,
        no2: aqiDetails.no2?.v ?? null,
        o3: aqiDetails.o3?.v ?? null,
        so2: aqiDetails.so2?.v ?? null,
        co: aqiDetails.co?.v ?? null,
      },
      cityName,
      stations,
      weather,
      forecastSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("env-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
