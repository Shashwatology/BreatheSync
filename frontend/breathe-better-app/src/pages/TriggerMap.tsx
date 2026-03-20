import { ArrowLeft, MapPin, Filter, CloudRain, Thermometer, Wind as WindIcon, AlertTriangle, Clock, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AppLayout from "@/components/AppLayout";
import TravelSafeChat, { type TravelPinData } from "@/components/TravelSafeChat";
import { useEnvData } from "@/hooks/useEnvData";

const filters = ["Overall Risk", "PM2.5", "NO2", "Humidity"];

const getMarkerColor = (aqi: number | null): string => {
  if (!aqi) return "#9CA3AF";
  if (aqi < 50) return "#22C55E";
  if (aqi <= 100) return "#F59E0B";
  if (aqi <= 150) return "#F97316";
  return "#EF4444";
};

const getRiskLabel = (aqi: number | null) => {
  if (!aqi) return { risk: "Unknown", color: "aqi-moderate" };
  if (aqi < 50) return { risk: "Low", color: "aqi-safe" };
  if (aqi <= 100) return { risk: "Moderate", color: "aqi-moderate" };
  return { risk: "High", color: "aqi-danger" };
};

const TriggerMap = () => {
  const [activeFilter, setActiveFilter] = useState("Overall Risk");
  const { data, prediction, loading, predictionLoading, coords } = useEnvData();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const travelPinRef = useRef<L.CircleMarker | null>(null);

  const handleShowOnMap = useCallback((pin: TravelPinData) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous travel pin
    if (travelPinRef.current) {
      map.removeLayer(travelPinRef.current);
      travelPinRef.current = null;
    }

    const color = getMarkerColor(pin.aqi);
    const marker = L.circleMarker([pin.lat, pin.lng], {
      radius: 14,
      color,
      fillColor: color,
      fillOpacity: 0.6,
      weight: 3,
    })
      .bindPopup(
        `<div style="font-family:Inter,sans-serif;color:#1a1a2e;min-width:160px">
          <strong style="font-size:13px">📍 ${pin.location}</strong>
          <div style="font-size:12px;margin-top:4px">AQI: <strong>${pin.aqi ?? "N/A"}</strong></div>
          <div style="font-size:12px">Risk: <strong>${pin.risk_level}</strong> (${pin.risk_score}/100)</div>
        </div>`
      )
      .addTo(map);

    marker.openPopup();
    travelPinRef.current = marker;
    map.flyTo([pin.lat, pin.lng], 14, { duration: 1.2 });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !data) return;

    map.setView([coords.lat, coords.lng], 12);

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    // Add user location
    L.circleMarker([coords.lat, coords.lng], {
      radius: 8,
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.8,
      weight: 3,
    })
      .bindPopup(`<strong>Your Location</strong><br/>AQI: ${data.aqi ?? "N/A"}`)
      .addTo(map);

    // Add stations
    data.stations.forEach((s) => {
      if (!s.aqi) return;
      const color = getMarkerColor(s.aqi);
      L.circleMarker([s.lat, s.lng], {
        radius: 12,
        color,
        fillColor: color,
        fillOpacity: 0.5,
        weight: 2,
      })
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;color:#1a1a2e;min-width:140px">
            <strong style="font-size:13px">${s.name}</strong>
            <div style="font-size:12px;margin-top:4px">AQI: <strong>${s.aqi}</strong></div>
          </div>`
        )
        .addTo(map);
    });
  }, [data, coords]);

  return (
    <AppLayout>
      <div className="px-0 pt-0 pb-6">
        {/* Map */}
        <div className="relative" style={{ height: "40vh" }}>
          <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

          {/* Legend */}
          <div className="absolute top-4 right-4 flex flex-col gap-1 z-[1000]">
            {[
              { label: "Good", color: "bg-success" },
              { label: "Moderate", color: "bg-warning" },
              { label: "Unhealthy", color: "bg-destructive" },
            ].map((z) => (
              <span key={z.label} className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-white/10" style={{ background: "rgba(11,18,32,0.8)", backdropFilter: "blur(8px)" }}>
                <span className={`w-2 h-2 rounded-full ${z.color}`} /> {z.label}
              </span>
            ))}
          </div>

          {/* Back */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Link to="/dashboard" className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition block" style={{ background: "rgba(11,18,32,0.8)", backdropFilter: "blur(8px)" }}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
          </div>

          {/* Current AQI overlay */}
          {data && (
            <div className="absolute bottom-4 left-4 right-4 z-[1000] flex gap-2">
              <div className="flex-1 rounded-xl border border-white/10 px-3 py-2" style={{ background: "rgba(11,18,32,0.85)", backdropFilter: "blur(8px)" }}>
                <p className="text-[10px] text-muted-foreground">AQI</p>
                <p className="text-lg font-bold" style={{ color: getMarkerColor(data.aqi) }}>{data.aqi ?? "--"}</p>
              </div>
              <div className="flex-1 rounded-xl border border-white/10 px-3 py-2" style={{ background: "rgba(11,18,32,0.85)", backdropFilter: "blur(8px)" }}>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp</p>
                <p className="text-lg font-bold">{data.weather.temp}°C</p>
              </div>
              <div className="flex-1 rounded-xl border border-white/10 px-3 py-2" style={{ background: "rgba(11,18,32,0.85)", backdropFilter: "blur(8px)" }}>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><CloudRain className="w-3 h-3" /> Humidity</p>
                <p className="text-lg font-bold">{data.weather.humidity}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pt-5">
          {/* Location + Weather */}
          {data && (
            <div className="glass-card !p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">{data.cityName}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><WindIcon className="w-3 h-3" /> {data.weather.windSpeed} m/s</span>
                <span>{data.weather.description}</span>
              </div>
            </div>
          )}

          {/* AI Prediction Card */}
          {predictionLoading && (
            <div className="glass-card !p-4 mb-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">AI analyzing environment...</span>
              </div>
            </div>
          )}
          {prediction && !prediction.error && (
            <div className="glass-card !p-4 mb-4 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Health Prediction</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${prediction.riskLevel === "Low" ? "aqi-safe" :
                  prediction.riskLevel === "Moderate" ? "aqi-moderate" : "aqi-danger"
                  }`}>
                  {prediction.riskLevel} Risk
                </span>
                <span className="text-xs text-muted-foreground">Score: {prediction.riskScore}/100</span>
              </div>
              <p className="text-sm text-foreground/80 mb-3">{prediction.prediction}</p>

              {prediction.triggerWarnings?.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {prediction.triggerWarnings.map((w, i) => (
                      <span key={i} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        <AlertTriangle className="w-3 h-3" /> {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {prediction.advice?.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {prediction.advice.map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}

              {prediction.bestTimeOutdoor && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Best outdoor time: {prediction.bestTimeOutdoor}</span>
                </div>
              )}
            </div>
          )}

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`press-effect px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${activeFilter === f
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "border border-white/10 text-muted-foreground hover:bg-white/5"
                  }`}
                style={activeFilter !== f ? { background: "rgba(255,255,255,0.04)" } : {}}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Stations */}
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Nearby Stations</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card !p-4 shimmer h-16 rounded-2xl" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {(data?.stations ?? []).filter(s => s.aqi !== null).map((z) => {
                  const { risk, color } = getRiskLabel(z.aqi);
                  return (
                    <div key={z.name} className="glass-card hover-lift flex items-center justify-between !p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{z.name}</p>
                          <p className="text-xs text-muted-foreground">{risk} Risk</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${color}`}>
                        AQI {z.aqi}
                      </span>
                    </div>
                  );
                })}
                {(data?.stations ?? []).filter(s => s.aqi !== null).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No stations found nearby</p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
      <TravelSafeChat onShowOnMap={handleShowOnMap} />
    </AppLayout>
  );
};

export default TriggerMap;