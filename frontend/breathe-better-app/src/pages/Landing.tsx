import { Link, Navigate } from "react-router-dom";
import { Wind, Mic, Activity, Shield, ArrowRight, Lock, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Mic,
    title: "Voice Check",
    description: "AI-powered lung health analysis from your voice in just 6 seconds",
  },
  {
    icon: Wind,
    title: "Lung Gym",
    description: "Fun breathing exercises and games to strengthen your lungs daily",
  },
  {
    icon: Activity,
    title: "Smart Monitoring",
    description: "Real-time AQI, triggers, and personalized risk alerts",
  },
];

const stats = [
  { value: "34.3M", label: "Asthma patients in India" },
  { value: "46%", label: "Of global asthma deaths" },
  { value: "3×", label: "Higher mortality than global average" },
];

// Floating particle component
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="particle bg-primary/20"
        style={{
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
          left: `${Math.random() * 100}%`,
          animationDuration: `${8 + Math.random() * 12}s`,
          animationDelay: `${Math.random() * 10}s`,
        }}
      />
    ))}
  </div>
);

const Landing = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Wind className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Initializing BreatheSync...</p>
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-mesh min-h-[85vh] flex items-center">
        <Particles />
        {/* Animated wave overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
          <motion.div
            className="w-full h-full bg-gradient-to-t from-primary/20 to-transparent"
            animate={{ y: [0, -20, 0], rotate: [0, 1, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Breathing pulse behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(217 91% 60% / 0.08) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative px-6 pt-12 pb-20 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Wind className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-foreground font-display font-bold text-xl">BreatheSync</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground leading-tight mb-4">
              Breathe Better.<br />
              <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
                Live Better.
              </span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-sm">
              Your AI-powered companion for managing asthma, tracking lung health, and breathing easier every day.
            </p>
            <div className="flex gap-3 mb-6">
              <Link
                to="/signup"
                className="glow-button press-effect inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl shadow-elevated transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="press-effect inline-flex items-center gap-2 text-foreground font-semibold px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-300"
              >
                Login
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-success" /> Secure</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Encrypted</span>
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-sky-400" /> AI Powered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-display font-bold mb-2">How BreatheSync Helps</h2>
          <p className="text-muted-foreground">Three powerful tools in your pocket</p>
        </motion.div>
        <div className="grid gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="glass-card hover-lift flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 text-center border-primary/20"
        >
          <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-1">Why It Matters</h2>
          <p className="text-muted-foreground text-sm mb-8">Asthma is a silent crisis in India</p>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-display font-bold mb-3">Ready to breathe easier?</h2>
        <p className="text-muted-foreground mb-6">Join thousands managing their asthma smarter.</p>
        <Link
          to="/signup"
          className="glow-button press-effect inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl shadow-elevated transition-all duration-300"
        >
          Get Started Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm">BreatheSync</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 BreatheSync. Breathe Better. Live Better.</p>
      </footer>
    </div>
  );
};

export default Landing;
