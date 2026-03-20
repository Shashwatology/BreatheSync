import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { aqi, aqiDetails, weather, forecastSummary, cityName } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are a respiratory health AI assistant for an asthma management app called BreatheSync.

Given the following real-time environmental data for ${cityName}:

Current AQI: ${aqi}
PM2.5: ${aqiDetails?.pm25 ?? "N/A"}
PM10: ${aqiDetails?.pm10 ?? "N/A"}
NO2: ${aqiDetails?.no2 ?? "N/A"}
O3: ${aqiDetails?.o3 ?? "N/A"}
Temperature: ${weather?.temp}°C
Humidity: ${weather?.humidity}%
Wind: ${weather?.windSpeed} m/s
Conditions: ${weather?.description}

24-hour forecast summary:
${(forecastSummary ?? []).map((f: any) => `${new Date(f.dt * 1000).toLocaleTimeString("en-IN", { hour: "2-digit" })}: ${f.temp}°C, ${f.humidity}% humidity, ${f.description}`).join("\n")}

Provide a JSON response with these fields:
1. "riskLevel": "Low", "Moderate", "High", or "Very High" - overall respiratory risk
2. "riskScore": 0-100 number
3. "prediction": A 2-sentence prediction for the next 6-12 hours regarding air quality trend
4. "advice": 2-3 bullet points of actionable health advice for asthma patients
5. "triggerWarnings": Array of specific triggers detected (e.g. "High PM2.5", "Humidity above 70%")
6. "bestTimeOutdoor": Best time window for outdoor activity in next 12 hours

Return ONLY valid JSON, no markdown or extra text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse JSON from AI response
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse AI response" };
    } catch {
      prediction = { error: "Could not parse AI response", raw: content };
    }

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
