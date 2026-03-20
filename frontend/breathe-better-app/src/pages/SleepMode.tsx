import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Moon, Activity, AlertTriangle, ShieldCheck } from "lucide-react";

export default function SleepMode() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [coughsDetected, setCoughsDetected] = useState(0);
  const [wheezesDetected, setWheezesDetected] = useState(0);
  const [showConsent, setShowConsent] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reqFrameRef = useRef<number | null>(null);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setIsActive(true);
      setShowConsent(false);
      updateVolume();
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      // Fallback for demo if mic is disabled - just show the UI
      setIsActive(true);
      setShowConsent(false);
      simulateAudio();
    }
  };

  const stopMonitoring = () => {
    if (reqFrameRef.current) cancelAnimationFrame(reqFrameRef.current);
    if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsActive(false);
  };

  const updateVolume = () => {
    if (!analyserRef.current || !isActive) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Map to a reasonable 0-100 scale for UI
    setVolume(Math.min(100, (avg / 128) * 100));
    
    // Simulate Edge AI detection randomly when volume spikes (purely for hackathon demo)
    if (avg > 40 && Math.random() > 0.95) {
        if (Math.random() > 0.3) {
            setCoughsDetected(prev => prev + 1);
        } else {
            setWheezesDetected(prev => prev + 1);
        }
    }
    
    reqFrameRef.current = requestAnimationFrame(updateVolume);
  };

  // Fallback animation if mic access isn't working
  const simulateAudio = () => {
      if (!isActive) return;
      setVolume(Math.random() * 30 + 10);
      if (Math.random() > 0.98) {
          setCoughsDetected(prev => prev + 1);
      }
      setTimeout(simulateAudio, 200);
  };

  useEffect(() => {
    return () => stopMonitoring(); // Cleanup on unmount
  }, [isActive]);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center pt-8 pb-12 px-6 overflow-hidden">
        {/* Very dark ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black z-0" />
        
        <div className="w-full max-w-md relative z-10 flex flex-col h-full flex-1">
            <header className="flex justify-between items-center mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/60 hover:text-white press-effect">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span className="font-display font-semibold text-lg text-indigo-100">Sleep Mode</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <AnimatePresence mode="wait">
                {showConsent ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col justify-center"
                    >
                        <div className="glass-card !bg-white/5 border-white/10 !p-8 text-center">
                            <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-xl font-display font-bold mb-2">Acoustic Radar</h2>
                            <p className="text-sm text-white/60 mb-6 leading-relaxed">
                                BreatheSync uses on-device Edge AI to completely privately monitor nocturnal coughing and wheezing.
                                <br/><br/>
                                <strong>No audio is ever recorded or uploaded.</strong> Only exacerbation frequency data is securely synced to predict tomorrow's asthma risks.
                            </p>
                            <button 
                                onClick={startMonitoring}
                                className="w-full py-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white press-effect shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all"
                            >
                                Start Passive Monitoring
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-between py-10"
                    >
                        {/* Audio Visualizer Ring */}
                        <div className="relative w-64 h-64 flex items-center justify-center mt-10">
                            {/* Static core */}
                            <div className="absolute w-32 h-32 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center z-20">
                                <Moon className="w-8 h-8 text-indigo-300" />
                            </div>
                            
                            {/* Dynamic rings based on volume */}
                            {[1, 2, 3].map((ring) => (
                                <motion.div
                                    key={`ring-${ring}`}
                                    className="absolute rounded-full border border-indigo-500/20"
                                    animate={{ 
                                        width: isActive ? `${120 + volume * ring * 0.8}px` : '120px',
                                        height: isActive ? `${120 + volume * ring * 0.8}px` : '120px',
                                        opacity: isActive ? 0.8 - (ring * 0.2) : 0,
                                        rotate: volume * 2
                                    }}
                                    transition={{ type: "tween", duration: 0.1 }}
                                    style={{
                                        boxShadow: `0 0 ${10 + volume}px rgba(79,70,229,${0.1 * ring})`
                                    }}
                                />
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <h3 className="text-xl font-semibold text-indigo-200">Listening Privately...</h3>
                            <p className="text-sm text-white/40 mt-1">Screen will dim automatically</p>
                        </div>

                        {/* Real-time Edge AI Detections (Mocked) */}
                        <div className="w-full grid grid-cols-2 gap-4 mt-auto mb-8">
                            <div className="glass-card !bg-white/5 border-white/10 !p-4 flex flex-col items-center">
                                <Activity className="w-5 h-5 text-accent mb-2" />
                                <span className="text-3xl font-bold font-display">{coughsDetected}</span>
                                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Coughs</span>
                            </div>
                            <div className="glass-card !bg-white/5 border-white/10 !p-4 flex flex-col items-center">
                                <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
                                <span className="text-3xl font-bold font-display">{wheezesDetected}</span>
                                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Wheezes</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                stopMonitoring();
                                navigate('/dashboard');
                            }}
                            className="w-full py-4 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white press-effect border border-white/10"
                        >
                            Wake Up & Save Session
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
