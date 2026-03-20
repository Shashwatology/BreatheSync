import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callAI(prompt: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini AI error:", res.status, errText);
    throw new Error(`AI error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty AI response");
  return content;
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();

    // Step 0: Classify intent — is this a travel/location query or a general question?
    const classifyPrompt = `You classify user messages for an asthma travel safety app.

User message: "${message}"

Is this a travel/location query (asking about visiting a place, checking air quality at a location, travel safety) OR a general question (health advice, greetings, how-to, chitchat, asthma info)?

Return ONLY a JSON object: {"intent": "travel"} or {"intent": "general"}`;

    const classifyText = await callAI(classifyPrompt);
    let intent = "travel";
    try {
      const classified = extractJson(classifyText);
      intent = classified.intent || "travel";
    } catch {
      // Default to travel if classification fails
      intent = "travel";
    }

    // If general question, answer conversationally
    if (intent === "general") {
      const chatPrompt = `You are a friendly, knowledgeable asthma health companion called "AI Travel Safe". You help asthma patients with health advice, tips, medication info, triggers, lifestyle guidance, and general wellness.

User message: "${message}"

Reply in a warm, concise, helpful way. Keep it under 3-4 sentences unless a detailed answer is needed. If the user greets you, greet back and remind them you can check travel safety for any destination.`;

      const reply = await callAI(chatPrompt);
      return new Response(JSON.stringify({ type: "chat", reply: reply.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Travel assessment flow (existing logic) ---
    const AQICN_TOKEN = Deno.env.get("AQICN_API_TOKEN");
    const OW_KEY = Deno.env.get("OPENWEATHER_API_KEY");

    const parsePrompt = `You extract location and time info from travel queries by asthma patients.

User query: "${message}"

Extract the location and time. If no specific time mentioned, assume "today".
If location is ambiguous, pick the most popular match in India.
Common locations: Mumbai(19.076,72.877), Delhi(28.614,77.209), Bangalore(12.972,77.594), Chennai(13.083,80.270), Kolkata(22.573,88.364), Hyderabad(17.385,78.487), Pune(18.520,73.857), Juhu Beach(19.098,72.827), Marine Drive(18.944,72.824), Gateway of India(18.922,72.835), India Gate(28.613,77.229).

Return ONLY a JSON object (no markdown, no explanation):
{
  "location": "place name",
  "lat": 0.0,
  "lng": 0.0,
  "datetime_description": "this evening",
  "duration_description": "few hours"
}`;

    const parseText = await callAI(parsePrompt);
    let parsed;
    try {
      parsed = extractJson(parseText);
    } catch (e) {
      console.error("Parse JSON failed:", parseText);
      throw new Error("Failed to parse location from AI response");
    }

    const { location, lat, lng, datetime_description, duration_description } = parsed;

    let aqi: number | null = null;
    let pm25: number | null = null;
    let pm10: number | null = null;
    let no2: number | null = null;
    let temp = 0, humidity = 0, windSpeed = 0, weatherDesc = "";

    const [aqiResult, weatherResult] = await Promise.allSettled([
      (async () => {
        if (!AQICN_TOKEN) return;
        const aqiRes = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${AQICN_TOKEN}`);
        const aqiData = await aqiRes.json();
        console.log("AQICN response status:", aqiData?.status, "AQI:", aqiData?.data?.aqi);
        if (aqiData?.status === "ok" && aqiData?.data) {
          aqi = typeof aqiData.data.aqi === "number" ? aqiData.data.aqi : null;
          const iaqi = aqiData.data.iaqi ?? {};
          pm25 = iaqi.pm25?.v ?? null;
          pm10 = iaqi.pm10?.v ?? null;
          no2 = iaqi.no2?.v ?? null;
        }
      })(),
      (async () => {
        if (!OW_KEY) return;
        const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=metric`);
        const wData = await wRes.json();
        temp = Math.round(wData?.main?.temp ?? 0);
        humidity = wData?.main?.humidity ?? 0;
        windSpeed = wData?.wind?.speed ?? 0;
        weatherDesc = wData?.weather?.[0]?.description ?? "";
      })(),
    ]);

    if (aqiResult.status === "rejected") console.error("AQI fetch failed:", aqiResult.reason);
    if (weatherResult.status === "rejected") console.error("Weather fetch failed:", weatherResult.reason);

    const assessPrompt = `You are an asthma health advisor. Analyze environmental data and provide travel safety advice.

Patient with asthma is visiting ${location} (${datetime_description}, ${duration_description}).

REAL-TIME Environmental data:
- AQI: ${aqi !== null ? aqi : "unavailable"}
- PM2.5: ${pm25 !== null ? pm25 : "unavailable"} μg/m³
- PM10: ${pm10 !== null ? pm10 : "unavailable"}
- NO2: ${no2 !== null ? no2 : "unavailable"}
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Weather: ${weatherDesc}

AQI Scale: 0-50=Good, 51-100=Moderate, 101-150=Unhealthy for Sensitive Groups, 151-200=Unhealthy, 201-300=Very Unhealthy, 300+=Hazardous.

Based on this REAL data, provide assessment. Return ONLY a JSON object (no markdown, no explanation):
{
  "risk_level": "Safe|Low|Medium|High",
  "risk_score": 0-100,
  "summary": "One sentence summary using the actual AQI value",
  "recommendations": ["3-5 specific actionable recommendations"],
  "mask_type": "N95|KN95|Surgical|None needed",
  "best_time": "Best time to visit",
  "avoid_time": "Time to avoid or empty string",
  "alternatives": ["1-2 safer nearby locations"],
  "medication_reminder": "Medication advice"
}`;

    const assessText = await callAI(assessPrompt);
    let assessment;
    try {
      assessment = extractJson(assessText);
    } catch (e) {
      console.error("Assessment JSON failed:", assessText);
      throw new Error("Failed to parse assessment from AI response");
    }

    const response = {
      type: "travel",
      location,
      lat,
      lng,
      datetime_description,
      duration_description,
      environment: { aqi, pm25, pm10, no2, temp, humidity, windSpeed, weatherDesc },
      ...assessment,
    };

    console.log("Travel-safe response AQI:", aqi, "Risk:", assessment.risk_level);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("travel-safe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
