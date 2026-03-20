import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Wind, Mail, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard?welcome=true",
        },
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: window.location.origin + "/dashboard?welcome=true",
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      // Send welcome email (fire-and-forget)
      supabase.functions.invoke("send-welcome-email", {
        body: { email, name },
      }).catch(console.error);
      toast.success("Account created! Please check your email to verify.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">
      <motion.div
        className="absolute top-10 -right-20 w-72 h-72 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(217 91% 60% / 0.3), transparent 70%)" }}
        animate={{ y: [0, 25, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Wind className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">BreatheSync</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-display font-bold mb-1 text-center">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6 text-center">Start tracking your lung health today</p>

          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="press-effect w-full flex items-center justify-center gap-3 border border-white/10 rounded-xl py-3 font-semibold text-sm hover:bg-white/5 transition-all disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
              <input
                placeholder="Your name"
                className="glass-input w-full text-foreground placeholder:text-muted-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="glass-input w-full pl-10 text-foreground placeholder:text-muted-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="glass-input w-full pl-10 text-foreground placeholder:text-muted-foreground"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="glass-input w-full pr-10 text-foreground placeholder:text-muted-foreground"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-button press-effect w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
