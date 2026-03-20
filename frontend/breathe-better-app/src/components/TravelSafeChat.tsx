import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, MapPin, Thermometer, Droplets, Wind, Shield, Clock, AlertTriangle, Loader2, Navigation, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface TravelPinData {
  lat: number;
  lng: number;
  location: string;
  risk_level: string;
  aqi: number | null;
  risk_score: number;
}

interface TravelAssessment {
  location: string;
  lat: number;
  lng: number;
  datetime_description: string;
  environment: {
    aqi: number | null;
    pm25?: number | null;
    temp: number;
    humidity: number;
    weatherDesc: string;
  };
  risk_level: string;
  risk_score: number;
  summary: string;
  recommendations: string[];
  mask_type: string;
  best_time: string;
  avoid_time?: string;
  alternatives?: string[];
  medication_reminder?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  assessment?: TravelAssessment;
  loading?: boolean;
}

const riskConfig: Record<string, { emoji: string; bg: string; text: string; border: string }> = {
  Safe: { emoji: "🟢", bg: "bg-success/15", text: "text-success", border: "border-success/25" },
  Low: { emoji: "🟡", bg: "bg-accent/15", text: "text-accent", border: "border-accent/25" },
  Medium: { emoji: "🟠", bg: "bg-warning/15", text: "text-warning", border: "border-warning/25" },
  High: { emoji: "🔴", bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/25" },
};

const TravelSafeChat = ({ onShowOnMap }: { onShowOnMap?: (pin: TravelPinData) => void }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognition.onerror = () => { setListening(false); recognitionRef.current = null; };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const loadingMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    try {
      // Send the last few messages for context
      const historyToSend = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));
      // Add the new message
      historyToSend.push({ role: "user", content: text });

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/chat/travel-safe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: text,
          history: historyToSend 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to call chat API: ${response.statusText}`);
      }

      const data = await response.json();

      if (data?.type === "chat") {
        // General conversational reply
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? { ...m, loading: false, content: data.reply }
              : m
          )
        );
      } else {
        // Travel assessment
        const assessment = data as TravelAssessment;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? { ...m, loading: false, content: assessment.summary, assessment }
              : m
          )
        );
      }
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, content: `Sorry, I couldn't analyze that. ${e?.message || "Please try again."}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const AssessmentCard = ({ a }: { a: TravelAssessment }) => {
    const rc = riskConfig[a.risk_level] || riskConfig.Medium;
    return (
      <div className="space-y-3 mt-2">
        {/* Risk badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${rc.bg} border ${rc.border}`}>
          <span className="text-lg">{rc.emoji}</span>
          <span className={`text-sm font-bold ${rc.text}`}>{a.risk_level.toUpperCase()} RISK</span>
          <span className="text-xs text-muted-foreground ml-auto">Score: {a.risk_score}/100</span>
        </div>

        {/* Location + Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          <span>{a.location}</span>
          <span className="mx-1">•</span>
          <Clock className="w-3 h-3" />
          <span>{a.datetime_description}</span>
        </div>

        {/* Environment stats */}
        <div className="grid grid-cols-2 gap-2">
          {a.environment.aqi !== null && (
            <div className="glass-card !p-2.5 !rounded-xl">
              <p className="text-[10px] text-muted-foreground">AQI</p>
              <p className="text-sm font-bold">{a.environment.aqi}</p>
            </div>
          )}
          {a.environment.pm25 !== null && (
            <div className="glass-card !p-2.5 !rounded-xl">
              <p className="text-[10px] text-muted-foreground">PM2.5</p>
              <p className="text-sm font-bold">{a.environment.pm25} μg/m³</p>
            </div>
          )}
          <div className="glass-card !p-2.5 !rounded-xl">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Thermometer className="w-2.5 h-2.5" /> Temp</p>
            <p className="text-sm font-bold">{a.environment.temp}°C</p>
          </div>
          <div className="glass-card !p-2.5 !rounded-xl">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Droplets className="w-2.5 h-2.5" /> Humidity</p>
            <p className="text-sm font-bold">{a.environment.humidity}%</p>
          </div>
        </div>


        {/* Recommendations */}
        {a.recommendations?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recommendations</p>
            <ul className="space-y-1.5">
              {a.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mask + Best time */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-3 h-3" /> {a.mask_type}
          </span>
          <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
            <Clock className="w-3 h-3" /> Best: {a.best_time}
          </span>
          {a.avoid_time && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-3 h-3" /> Avoid: {a.avoid_time}
            </span>
          )}
        </div>

        {/* Alternatives */}
        {a.alternatives && a.alternatives.length > 0 && (
          <div className="glass-card !p-3 !rounded-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Safer Alternatives</p>
            {a.alternatives.map((alt, i) => (
              <p key={i} className="text-xs text-foreground/80 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-success" /> {alt}
              </p>
            ))}
          </div>
        )}

        {/* Medication */}
        {a.medication_reminder && (
          <p className="text-xs text-accent flex items-start gap-1.5">
            💊 {a.medication_reminder}
          </p>
        )}

        {/* Show on Map button */}
        {onShowOnMap && (
          <button
            onClick={() => {
              onShowOnMap({
                lat: a.lat,
                lng: a.lng,
                location: a.location,
                risk_level: a.risk_level,
                aqi: a.environment.aqi,
                risk_score: a.risk_score,
              });
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 mt-1 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold press-effect shadow-glow"
          >
            <Navigation className="w-3.5 h-3.5" />
            Show on Map
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-28 right-5 z-[2000] w-14 h-14 rounded-full gradient-primary shadow-glow flex items-center justify-center press-effect"
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[2000] flex flex-col bg-background"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">AI Travel Safe</h2>
                  <p className="text-[10px] text-muted-foreground">Your asthma travel companion</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-muted transition">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center shadow-glow">
                    <MapPin className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">Where are you heading?</h3>
                    <p className="text-xs text-muted-foreground">Tell me your destination and I'll check if it's safe for you</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Juhu Beach this evening", "Delhi next week", "Marine Drive tomorrow"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); }}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition press-effect"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
                    : "glass-card !p-4 !rounded-2xl !rounded-bl-md"
                    }`}>
                    {msg.loading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Analyzing your destination...
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{msg.content}</p>
                        {msg.assessment && <AssessmentCard a={msg.assessment} />}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="e.g. Visiting Juhu Beach this evening..."
                  className="glass-input flex-1 text-sm"
                  disabled={loading}
                />
                <button
                  onClick={listening ? stopListening : startListening}
                  disabled={loading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center press-effect transition-all ${listening
                      ? "bg-destructive/20 border border-destructive/40 animate-pulse"
                      : "border border-border hover:bg-muted"
                    }`}
                >
                  {listening ? (
                    <MicOff className="w-4 h-4 text-destructive" />
                  ) : (
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center press-effect disabled:opacity-40"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              {listening && (
                <p className="text-[10px] text-destructive mt-1.5 text-center animate-pulse">🎤 Listening... speak your destination</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TravelSafeChat;
