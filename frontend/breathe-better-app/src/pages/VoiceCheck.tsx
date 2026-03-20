import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Mic, MicOff, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import AppLayout from "@/components/AppLayout";
import LungGauge from "@/components/LungGauge";

const trendData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 68 },
  { day: "Wed", score: 75 },
  { day: "Thu", score: 71 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 74 },
  { day: "Sun", score: 82 },
];

const history = [
  { date: "Today, 2:30 PM", score: 82, change: +4 },
  { date: "Yesterday, 10:15 AM", score: 78, change: +3 },
  { date: "Jun 20, 9:00 AM", score: 75, change: -2 },
  { date: "Jun 19, 3:45 PM", score: 77, change: +1 },
  { date: "Jun 18, 11:30 AM", score: 76, change: +5 },
];

type Phase = "idle" | "recording" | "analyzing" | "result";

const getClassification = (score: number) => {
  if (score >= 80) return { text: "Healthy", color: "text-success" };
  if (score >= 60) return { text: "Mild", color: "text-warning" };
  if (score >= 40) return { text: "Moderate", color: "text-accent" };
  return { text: "Severe", color: "text-destructive" };
};

const VoiceCheck = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(6);
  const [score] = useState(82);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArray], { type: "audio/wav" });
  };

  const stopAudio = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "hsl(217, 91%, 60%)";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const startRecording = async () => {
    setPhase("recording");
    setSeconds(6);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setPhase("analyzing");

        try {
          const blob = new Blob(audioChunksRef.current);
          const arrayBuffer = await blob.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = bufferToWav(decodedData);

          const formData = new FormData();
          formData.append("file", wavBlob, "recording.wav");

          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
          
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          const response = await fetch(`${apiUrl}/api/voice/analyze`, {
            method: "POST",
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Analysis failed" }));
            throw new Error(errorData.detail || "Failed to analyze voice");
          }

          const result = await response.json();
          setAnalysisResult(result);
          setPhase("result");
          toast.success("Analysis complete!");
        } catch (error: any) {
          console.error("Analysis error:", error);
          const message = error.name === "AbortError" ? "Analysis timed out. Please check your connection." : error.message;
          toast.error(message);
          setPhase("idle");
        }
      };

      mediaRecorder.start();
    } catch (err: any) {
      console.error("Mic error:", err);
      toast.error("Could not access microphone. Please check your browser permissions.");
      setPhase("idle");
      clearInterval(intervalRef.current!);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          stopAudio();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudio();
    };
  }, [stopAudio]);

  const classification = getClassification(score);

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-display font-bold">Voice Check</h1>
        </div>

        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <p className="text-muted-foreground mb-2">Tap the mic and say</p>
              <p className="text-2xl font-display font-bold mb-8">"Ahhh" for 6 seconds</p>
              <button
                onClick={startRecording}
                className="w-32 h-32 rounded-full gradient-primary text-primary-foreground mx-auto flex items-center justify-center shadow-glow hover:scale-105 transition-transform"
              >
                <Mic className="w-12 h-12" />
              </button>
              <p className="text-xs text-muted-foreground mt-6">Ensure you're in a quiet environment</p>
            </motion.div>
          )}

          {phase === "recording" && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <p className="text-lg font-display font-bold text-destructive mb-1">Recording...</p>
              <p className="text-5xl font-display font-extrabold mb-6">{seconds}s</p>

              {/* Real-time waveform */}
              <div className="rounded-xl overflow-hidden mb-6 mx-auto" style={{ background: "rgba(255,255,255,0.03)", maxWidth: 320 }}>
                <canvas ref={canvasRef} width={320} height={80} className="w-full" />
              </div>

              <button
                onClick={() => {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  stopAudio();
                  setPhase("idle");
                }}
                className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground mx-auto flex items-center justify-center"
              >
                <MicOff className="w-8 h-8" />
              </button>
            </motion.div>
          )}

          {phase === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              {/* Animated breathing lung */}
              <motion.div
                className="mx-auto mb-6 text-6xl"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                🫁
              </motion.div>
              <p className="text-lg font-display font-bold">Analyzing your voice...</p>
              <p className="text-sm text-muted-foreground mt-1">AI is processing lung patterns</p>
              <div className="flex items-center justify-center gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-4">
              <div className="stat-card text-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Your Lung Voice Score</h3>
                <LungGauge score={analysisResult?.lung_score || 0} size={180} />
                <p className={`text-lg font-display font-bold mt-3 ${analysisResult?.lung_score >= 80 ? "text-success" : analysisResult?.lung_score >= 60 ? "text-warning" : "text-destructive"}`}>
                  {analysisResult?.classification || "Unknown"}
                </p>
                <div className="flex flex-col gap-2 mt-4 text-sm text-left px-4">
                  <p className="font-semibold">Recommendations:</p>
                  <p className="text-muted-foreground">{analysisResult?.recommendation}</p>
                </div>
              </div>

              <div className="stat-card mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">7-Day Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis domain={[60, 100]} hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* History */}
              <div className="stat-card mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Recent History</h3>
                </div>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{h.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{h.score}</span>
                        <span className={`text-xs font-medium flex items-center gap-0.5 ${h.change >= 0 ? "text-success" : "text-destructive"}`}>
                          {h.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {h.change >= 0 ? "+" : ""}{h.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setPhase("idle")}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-elevated"
              >
                Check Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default VoiceCheck;
