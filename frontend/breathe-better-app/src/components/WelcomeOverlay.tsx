import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Sparkles } from "lucide-react";

interface WelcomeOverlayProps {
  name: string;
  onComplete: () => void;
}

const WelcomeOverlay = ({ name, onComplete }: WelcomeOverlayProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          {/* Breathing glow */}
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative text-center px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto mb-6"
            >
              <Wind className="w-8 h-8 text-primary-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Welcome to BreatheSync</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-extrabold text-foreground mb-3">
                Hello,{" "}
                <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
                  {name}!
                </span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your lung health journey starts now. Let's breathe better together.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="mt-8"
            >
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeOverlay;
