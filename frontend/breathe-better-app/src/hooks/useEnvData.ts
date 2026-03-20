import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EnvData {
  aqi: number | null;
  aqiDetails: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    o3: number | null;
    so2: number | null;
    co: number | null;
  };
  cityName: string;
  stations: Array<{
    name: string;
    aqi: number | null;
    lat: number;
    lng: number;
  }>;
  weather: {
    temp: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  forecastSummary: Array<{
    dt: number;
    temp: number;
    humidity: number;
    description: string;
  }>;
}

export interface Prediction {
  riskLevel: string;
  riskScore: number;
  prediction: string;
  advice: string[];
  triggerWarnings: string[];
  bestTimeOutdoor: string;
  error?: string;
}

export const useEnvData = () => {
  const [data, setData] = useState<EnvData | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.076, lng: 72.877 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/environment/aqi?lat=${coords.lat}&lng=${coords.lng}`);

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();

        // Map backend response to EnvData format
        const mappedData: EnvData = {
          aqi: result.overall_aqi,
          aqiDetails: {
            pm25: result.components?.pm2_5 || result.aqicn?.iaqi?.pm25?.v || null,
            pm10: result.components?.pm10 || result.aqicn?.iaqi?.pm10?.v || null,
            no2: result.components?.no2 || result.aqicn?.iaqi?.no2?.v || null,
            o3: result.components?.o3 || result.aqicn?.iaqi?.o3?.v || null,
            so2: result.components?.so2 || result.aqicn?.iaqi?.so2?.v || null,
            co: result.components?.co || result.aqicn?.iaqi?.co?.v || null,
          },
          cityName: result.aqicn?.city?.name || "Your Location",
          stations: result.stations && result.stations.length > 0
            ? result.stations
            : [
              {
                name: result.aqicn?.city?.name || "Main Station",
                aqi: result.overall_aqi,
                lat: coords.lat,
                lng: coords.lng,
              }
            ],
          weather: {
            temp: result.weather?.temp ?? 24,
            humidity: result.weather?.humidity ?? 60,
            windSpeed: result.weather?.windSpeed ?? 5,
            description: result.weather?.description ?? "Partly Cloudy",
            icon: result.weather?.icon ?? "02d",
          },
          forecastSummary: [],
        };

        setData(mappedData);
      } catch (e) {
        console.error("env-data error:", e);
        setError("Failed to load environmental data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [coords]);

  const fetchPrediction = async () => {
    if (!data) return;
    setPredictionLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/environment/risk-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aqi_value: data.aqi,
          temperature: data.weather.temp,
          humidity: data.weather.humidity,
          voc_level: 0.5, // Placeholder for VOC level
          patient_trigger_profile: ["dust", "pollen"], // Example profile for richer results
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();

      // Adapt backend response to frontend Prediction interface
      setPrediction({
        riskLevel: result.risk_level,
        riskScore: result.risk_score,
        prediction: result.prediction || (result.risk_level === "High" ? "High risk detected" : "Safe conditions"),
        advice: result.recommendations || [],
        triggerWarnings: result.trigger_warnings || [],
        bestTimeOutdoor: result.best_outdoor_time || "See recommendations",
      });
    } catch (e) {
      console.error("predict error:", e);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Auto-fetch prediction when data arrives
  useEffect(() => {
    if (data) fetchPrediction();
  }, [data]);

  return { data, prediction, loading, predictionLoading, coords, error };
};
